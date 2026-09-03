use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{path::BaseDirectory, Manager};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoInfo {
    pub duration: f64,
    pub width: i32,
    pub height: i32,
    pub macos: bool,
    pub ffmpeg: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppleLivePhotoResult {
    pub heic_path: String,
    pub mov_path: String,
    pub imported: bool,
}

fn is_macos() -> bool {
    cfg!(target_os = "macos")
}

fn find_bin(name: &str) -> Option<PathBuf> {
    let mut names = vec![name.to_string()];
    if cfg!(windows) {
        names.push(format!("{name}.exe"));
    }
    let mut dirs: Vec<PathBuf> = Vec::new();
    if let Some(path) = std::env::var_os("PATH") {
        dirs.extend(std::env::split_paths(&path));
    }
    dirs.push(PathBuf::from("/opt/homebrew/bin"));
    dirs.push(PathBuf::from("/usr/local/bin"));
    for dir in dirs {
        for file in &names {
            let candidate = dir.join(file);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

fn run_command(program: &Path, args: &[&str]) -> Result<String, String> {
    let mut command = Command::new(program);
    command.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let output = command
        .output()
        .map_err(|error| format!("failed to run {}: {error}", program.display()))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(stderr.trim().to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn temp_path(ext: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    std::env::temp_dir().join(format!("lumiatool-live-{nanos}.{ext}"))
}

fn inject_xmp_app1(jpeg: &[u8], xmp: &str) -> Result<Vec<u8>, String> {
    if jpeg.len() < 4 || jpeg[0] != 0xff || jpeg[1] != 0xd8 {
        return Err("cover is not a JPEG".into());
    }
    let ident = b"http://ns.adobe.com/xap/1.0/\0";
    let xmp_bytes = xmp.as_bytes();
    let app1_data_len = ident.len() + xmp_bytes.len();
    let length = app1_data_len + 2;
    if length > 0xffff {
        return Err("XMP metadata is too large".into());
    }
    let mut segment = Vec::with_capacity(4 + app1_data_len);
    segment.extend_from_slice(&[0xff, 0xe1, (length >> 8) as u8, (length & 0xff) as u8]);
    segment.extend_from_slice(ident);
    segment.extend_from_slice(xmp_bytes);
    let mut out = Vec::with_capacity(2 + segment.len() + jpeg.len() - 2);
    out.extend_from_slice(&jpeg[..2]);
    out.extend_from_slice(&segment);
    out.extend_from_slice(&jpeg[2..]);
    Ok(out)
}

fn build_xmp(mp4_size: usize, presentation_timestamp_us: i64) -> String {
    format!(
        r#"<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:GCamera="http://ns.google.com/photos/1.0/camera/"
      xmlns:Container="http://ns.google.com/photos/1.0/container/"
      xmlns:Item="http://ns.google.com/photos/1.0/container/item/"
      GCamera:MotionPhoto="1"
      GCamera:MotionPhotoVersion="1"
      GCamera:MotionPhotoPresentationTimestampUs="{presentation_timestamp_us}"
      GCamera:MicroVideo="1"
      GCamera:MicroVideoVersion="1"
      GCamera:MicroVideoOffset="{mp4_size}"
      GCamera:MicroVideoPresentationTimestampUs="{presentation_timestamp_us}">
      <Container:Directory>
        <rdf:Seq>
          <rdf:li rdf:parseType="Resource">
            <Container:Item Item:Mime="image/jpeg" Item:Semantic="Primary" Item:Length="0"/>
          </rdf:li>
          <rdf:li rdf:parseType="Resource">
            <Container:Item Item:Mime="video/mp4" Item:Semantic="MotionPhoto" Item:Length="{mp4_size}"/>
          </rdf:li>
        </rdf:Seq>
      </Container:Directory>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>"#
    )
}

fn mux_motion_photo(
    jpeg_path: &Path,
    mp4_path: &Path,
    output_path: &Path,
    presentation_us: i64,
) -> Result<(), String> {
    let jpeg = fs::read(jpeg_path).map_err(|error| format!("read cover failed: {error}"))?;
    let mp4 = fs::read(mp4_path).map_err(|error| format!("read clip failed: {error}"))?;
    let jpeg = inject_xmp_app1(&jpeg, &build_xmp(mp4.len(), presentation_us))?;
    let mut output =
        fs::File::create(output_path).map_err(|error| format!("write output failed: {error}"))?;
    output
        .write_all(&jpeg)
        .and_then(|_| output.write_all(&mp4))
        .map_err(|error| format!("write output failed: {error}"))?;
    Ok(())
}

fn ffmpeg_quality(quality: &str) -> (&'static str, &'static str, &'static str) {
    match quality {
        "compact" => ("28", "96k", "veryfast"),
        "pristine" => ("18", "256k", "slow"),
        _ => ("23", "128k", "medium"),
    }
}

fn ffmpeg_probe(path: &str) -> Result<(f64, i32, i32), String> {
    let ffprobe = find_bin("ffprobe").ok_or_else(|| "ffprobe not found".to_string())?;
    let duration = run_command(
        &ffprobe,
        &[
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            path,
        ],
    )?;
    let size = run_command(
        &ffprobe,
        &[
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0",
            path,
        ],
    )?;
    let duration = duration
        .parse::<f64>()
        .map_err(|_| "invalid video duration".to_string())?;
    let mut parts = size.split(',');
    let width = parts
        .next()
        .and_then(|value| value.parse().ok())
        .ok_or_else(|| "invalid video width".to_string())?;
    let height = parts
        .next()
        .and_then(|value| value.parse().ok())
        .ok_or_else(|| "invalid video height".to_string())?;
    Ok((duration, width, height))
}

fn ffmpeg_export_mp4(
    src: &str,
    dest: &Path,
    start: f64,
    duration: f64,
    quality: &str,
    height: i32,
) -> Result<(), String> {
    let ffmpeg = find_bin("ffmpeg").ok_or_else(|| {
        "ffmpeg not found. Install ffmpeg and make sure it is on PATH.".to_string()
    })?;
    let (crf, audio, preset) = ffmpeg_quality(quality);
    let dest_str = dest.to_string_lossy();
    let start_str = format!("{start:.3}");
    let duration_str = format!("{duration:.3}");
    let mut args = vec![
        "-y",
        "-ss",
        &start_str,
        "-t",
        &duration_str,
        "-i",
        src,
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        crf,
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        audio,
        "-movflags",
        "+faststart",
    ];
    let scale = if height > 0 {
        Some(format!("scale=-2:{height}"))
    } else {
        None
    };
    if let Some(filter) = scale.as_deref() {
        args.extend_from_slice(&["-vf", filter]);
    }
    args.push(dest_str.as_ref());
    run_command(&ffmpeg, &args)?;
    Ok(())
}

fn ffmpeg_extract_jpeg(src: &str, dest: &Path, at_time: f64) -> Result<(), String> {
    let ffmpeg = find_bin("ffmpeg").ok_or_else(|| "ffmpeg not found".to_string())?;
    let dest_str = dest.to_string_lossy();
    let time = format!("{at_time:.3}");
    run_command(
        &ffmpeg,
        &[
            "-y",
            "-ss",
            &time,
            "-i",
            src,
            "-frames:v",
            "1",
            "-q:v",
            "2",
            dest_str.as_ref(),
        ],
    )?;
    Ok(())
}

#[cfg(target_os = "macos")]
mod apple {
    use super::*;
    use std::ffi::{CStr, CString};
    use std::os::raw::{c_char, c_int};

    #[repr(C)]
    struct LumiaVideoInfo {
        duration: f64,
        width: i32,
        height: i32,
    }

    unsafe extern "C" {
        fn lumia_probe_video(
            path: *const c_char,
            out: *mut LumiaVideoInfo,
            err: *mut c_char,
            err_len: c_int,
        ) -> c_int;
        fn lumia_export_mp4(
            src: *const c_char,
            dest: *const c_char,
            start: f64,
            duration: f64,
            height: c_int,
            err: *mut c_char,
            err_len: c_int,
        ) -> c_int;
        fn lumia_extract_jpeg(
            src: *const c_char,
            dest: *const c_char,
            at_time: f64,
            err: *mut c_char,
            err_len: c_int,
        ) -> c_int;
        fn lumia_export_apple_live_photo(
            src: *const c_char,
            cover_jpeg: *const c_char,
            start: f64,
            duration: f64,
            cover_time: f64,
            output_dir: *const c_char,
            wallpaper_base_mov: *const c_char,
            import_photos: c_int,
            wallpaper_mode: c_int,
            heic_out: *mut c_char,
            heic_out_len: c_int,
            mov_out: *mut c_char,
            mov_out_len: c_int,
            err: *mut c_char,
            err_len: c_int,
        ) -> c_int;
    }

    fn c_string(value: &str) -> Result<CString, String> {
        CString::new(value).map_err(|_| "path contains interior nul".to_string())
    }

    fn read_err(buf: &[u8]) -> String {
        CStr::from_bytes_until_nul(buf)
            .ok()
            .map(|value| value.to_string_lossy().into_owned())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "native media error".to_string())
    }

    pub fn probe(path: &str) -> Result<(f64, i32, i32), String> {
        let path = c_string(path)?;
        let mut info = LumiaVideoInfo {
            duration: 0.0,
            width: 0,
            height: 0,
        };
        let mut err = [0u8; 512];
        let code = unsafe {
            lumia_probe_video(
                path.as_ptr(),
                &mut info,
                err.as_mut_ptr() as *mut c_char,
                err.len() as c_int,
            )
        };
        if code != 0 {
            return Err(read_err(&err));
        }
        Ok((info.duration, info.width, info.height))
    }

    pub fn export_mp4(
        src: &str,
        dest: &Path,
        start: f64,
        duration: f64,
        height: i32,
    ) -> Result<(), String> {
        let src = c_string(src)?;
        let dest = c_string(&dest.to_string_lossy())?;
        let mut err = [0u8; 512];
        let code = unsafe {
            lumia_export_mp4(
                src.as_ptr(),
                dest.as_ptr(),
                start,
                duration,
                height,
                err.as_mut_ptr() as *mut c_char,
                err.len() as c_int,
            )
        };
        if code != 0 {
            return Err(read_err(&err));
        }
        Ok(())
    }

    pub fn extract_jpeg(src: &str, dest: &Path, at_time: f64) -> Result<(), String> {
        let src = c_string(src)?;
        let dest = c_string(&dest.to_string_lossy())?;
        let mut err = [0u8; 512];
        let code = unsafe {
            lumia_extract_jpeg(
                src.as_ptr(),
                dest.as_ptr(),
                at_time,
                err.as_mut_ptr() as *mut c_char,
                err.len() as c_int,
            )
        };
        if code != 0 {
            return Err(read_err(&err));
        }
        Ok(())
    }

    pub fn export_live_photo(
        src: &str,
        cover_jpeg: Option<&str>,
        start: f64,
        duration: f64,
        cover_time: f64,
        output_dir: &str,
        wallpaper_base_mov: &str,
        import_photos: bool,
        wallpaper_mode: bool,
    ) -> Result<AppleLivePhotoResult, String> {
        let src = c_string(src)?;
        let cover = c_string(cover_jpeg.unwrap_or(""))?;
        let output_dir = c_string(output_dir)?;
        let wallpaper_base_mov = c_string(wallpaper_base_mov)?;
        let mut heic = [0u8; 1024];
        let mut mov = [0u8; 1024];
        let mut err = [0u8; 512];
        let code = unsafe {
            lumia_export_apple_live_photo(
                src.as_ptr(),
                cover.as_ptr(),
                start,
                duration,
                cover_time,
                output_dir.as_ptr(),
                wallpaper_base_mov.as_ptr(),
                if import_photos { 1 } else { 0 },
                if wallpaper_mode { 1 } else { 0 },
                heic.as_mut_ptr() as *mut c_char,
                heic.len() as c_int,
                mov.as_mut_ptr() as *mut c_char,
                mov.len() as c_int,
                err.as_mut_ptr() as *mut c_char,
                err.len() as c_int,
            )
        };
        let heic_path = read_err(&heic);
        let mov_path = read_err(&mov);
        if code == 2 {
            return Ok(AppleLivePhotoResult {
                heic_path,
                mov_path,
                imported: false,
            });
        }
        if code != 0 {
            return Err(read_err(&err));
        }
        Ok(AppleLivePhotoResult {
            heic_path,
            mov_path,
            imported: import_photos,
        })
    }
}

fn probe_video(path: &str) -> Result<(f64, i32, i32), String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(info) = apple::probe(path) {
            return Ok(info);
        }
    }
    ffmpeg_probe(path)
}

fn export_mp4(
    src: &str,
    dest: &Path,
    start: f64,
    duration: f64,
    quality: &str,
    height: i32,
) -> Result<(), String> {
    if find_bin("ffmpeg").is_some() {
        return ffmpeg_export_mp4(src, dest, start, duration, quality, height);
    }
    #[cfg(target_os = "macos")]
    {
        return apple::export_mp4(src, dest, start, duration, height);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (src, dest, start, duration, quality, height);
        Err("ffmpeg not found. Install ffmpeg and make sure it is on PATH.".into())
    }
}

fn extract_jpeg(src: &str, dest: &Path, at_time: f64) -> Result<(), String> {
    if find_bin("ffmpeg").is_some() {
        return ffmpeg_extract_jpeg(src, dest, at_time);
    }
    #[cfg(target_os = "macos")]
    {
        return apple::extract_jpeg(src, dest, at_time);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (src, dest, at_time);
        Err("ffmpeg not found".into())
    }
}

#[tauri::command]
pub fn live_photo_probe(path: String) -> Result<VideoInfo, String> {
    let (duration, width, height) = probe_video(&path)?;
    Ok(VideoInfo {
        duration,
        width,
        height,
        macos: is_macos(),
        ffmpeg: find_bin("ffmpeg").is_some(),
    })
}

#[tauri::command]
pub fn create_google_motion_photo(
    video_path: String,
    cover_path: Option<String>,
    output_path: String,
    start: f64,
    duration: f64,
    cover_time: f64,
    quality: String,
    height: i32,
) -> Result<String, String> {
    if duration <= 0.0 {
        return Err("clip duration must be greater than 0".into());
    }
    let mp4_path = temp_path("mp4");
    let jpeg_path = temp_path("jpg");
    let result = (|| {
        export_mp4(&video_path, &mp4_path, start, duration, &quality, height)?;
        let cover = cover_path.as_deref().filter(|value| !value.is_empty());
        if let Some(cover) = cover {
            fs::copy(cover, &jpeg_path).map_err(|error| format!("copy cover failed: {error}"))?;
        } else {
            extract_jpeg(&video_path, &jpeg_path, cover_time.max(0.0))?;
        }
        let presentation_us = ((cover_time - start).max(0.0) * 1_000_000.0) as i64;
        mux_motion_photo(
            &jpeg_path,
            &mp4_path,
            Path::new(&output_path),
            presentation_us,
        )?;
        Ok(output_path)
    })();
    let _ = fs::remove_file(&mp4_path);
    let _ = fs::remove_file(&jpeg_path);
    result
}

#[tauri::command]
pub async fn create_apple_live_photo(
    app: tauri::AppHandle,
    video_path: String,
    cover_path: Option<String>,
    output_dir: String,
    start: f64,
    duration: f64,
    cover_time: f64,
    import_photos: bool,
    wallpaper: bool,
) -> Result<AppleLivePhotoResult, String> {
    let wallpaper_base_mov = if wallpaper {
        app.path()
            .resolve(
                "resources/live-photo-wallpaper-base.mov",
                BaseDirectory::Resource,
            )
            .map_err(|error| error.to_string())?
    } else {
        PathBuf::new()
    };
    let wallpaper_base_mov = wallpaper_base_mov.to_string_lossy().into_owned();
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "macos")]
        {
            apple::export_live_photo(
                &video_path,
                cover_path.as_deref().filter(|value| !value.is_empty()),
                start,
                duration,
                cover_time,
                &output_dir,
                &wallpaper_base_mov,
                import_photos,
                wallpaper,
            )
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = (
                video_path,
                cover_path,
                output_dir,
                start,
                duration,
                cover_time,
                import_photos,
                wallpaper,
            );
            Err("Apple Live Photo export is only available on macOS".into())
        }
    })
    .await
    .map_err(|error| error.to_string())?
}
