import { useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Align, Bool, Button, Card, Exception, InputNumber, Select } from "@/components";
import {
    createAppleLivePhoto,
    createGoogleMotionPhoto,
    probeLivePhotoVideo,
} from "@/lib/desktop";
import { useMutable } from "@/lib/reactive";
import { livePhotoSession } from "./session";

type Variant = "google" | "apple" | "wallpaper";

const videoFilters = [
    { name: "Video", extensions: ["mp4", "mov", "m4v", "mkv", "avi", "webm"] },
];

const qualityOptions = [
    { value: "compact", label: $t("livePhoto_quality_compact") },
    { value: "balanced", label: $t("livePhoto_quality_balanced") },
    { value: "pristine", label: $t("livePhoto_quality_pristine") },
];

const heightOptions = [
    { value: "0", label: $t("livePhoto_height_source") },
    { value: "720", label: "720p" },
    { value: "1080", label: "1080p" },
];

const isMac = /Mac/i.test(navigator.userAgent);

const fileName = (path: string) => path.split(/[/\\]/).pop() || path;

export default function Workbench({ variant }: { variant: Variant }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const session = useMutable(livePhotoSession);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const { videoPath, coverPath, info, start, duration, coverTime, quality, height, importPhotos } = session;


    const previewSrc = useMemo(() => (videoPath ? convertFileSrc(videoPath) : ""), [videoPath]);
    const maxDuration = info?.duration ?? 0;
    const durationCap = variant === "wallpaper" ? Math.min(maxDuration || 3, 3) : maxDuration;
    const clipDuration = Math.min(duration, Math.max(durationCap - start, 0.2), durationCap || 3);
    const appleBlocked = (variant === "apple" || variant === "wallpaper") && !isMac;

    const pickVideo = async () => {
        const selected = await open({ multiple: false, filters: videoFilters });
        if (typeof selected !== "string" || selected === "") {
            return;
        }
        setError("");
        setStatus("");
        const next = await probeLivePhotoVideo(selected);
        session.videoPath = selected;
        session.info = next;
        session.start = 0;
        session.duration = Math.max(next.duration, 0.2);
        session.coverTime = Math.min(1, next.duration);
        if (!next.ffmpeg && !next.macos && variant === "google") {
            setError($t("livePhoto_ffmpeg_hint"));
        }
    };

    const pickCover = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: "Image", extensions: ["jpg", "jpeg", "png", "heic", "webp"] }],
        });
        if (typeof selected === "string" && selected !== "") {
            session.coverPath = selected;
        }
    };

    const useCurrentFrame = () => {
        const current = videoRef.current?.currentTime;
        if (typeof current === "number" && Number.isFinite(current)) {
            session.coverTime = current;
            session.coverPath = "";
        }
    };

    const exportLivePhoto = async () => {
        if (appleBlocked) {
            setError($t("livePhoto_macos_only"));
            return;
        }
        if (!videoPath) {
            setError($t("livePhoto_no_video"));
            return;
        }
        setBusy(true);
        setError("");
        setStatus("");
        try {
            if (variant === "google") {
                const outputPath = await save({
                    defaultPath: `${fileName(videoPath).replace(/\.[^.]+$/, "")}.MP.JPG`,
                    filters: [{ name: "Motion Photo", extensions: ["JPG"] }],
                });
                if (typeof outputPath !== "string" || outputPath === "") {
                    return;
                }
                const saved = await createGoogleMotionPhoto({
                    videoPath,
                    coverPath: coverPath || null,
                    outputPath,
                    start,
                    duration: clipDuration,
                    coverTime,
                    quality,
                    height: Number(height) || 0,
                });
                setStatus(`${$t("livePhoto_saved")}: ${saved}`);
            } else {
                const outputDir = await open({ directory: true, multiple: false });
                if (typeof outputDir !== "string" || outputDir === "") {
                    return;
                }
                const result = await createAppleLivePhoto({
                    videoPath,
                    coverPath: coverPath || null,
                    outputDir,
                    start,
                    duration: clipDuration,
                    coverTime,
                    importPhotos,
                    wallpaper: variant === "wallpaper",
                });
                const imported = result.imported
                    ? $t("livePhoto_imported")
                    : $t("livePhoto_import_failed");
                setStatus(`${$t("livePhoto_saved")} ${fileName(result.heicPath)} · ${imported}`);
            }
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="lumia-generator-editor-family lumia-generator-page lumia-live-photo-page">
            <aside className="lumia-generator-options" aria-label={$t("main_ui_setting")}>
                <Card>
                    <Align direction="vertical" className="lumia-live-photo-options">
                        <Button type="primary" long onClick={() => void pickVideo()}>
                            {$t("livePhoto_pick_video")}
                        </Button>
                        <div className="lumia-live-photo-path">{videoPath ? fileName(videoPath) : $t("livePhoto_empty_video")}</div>
                        {info ? (
                            <div className="lumia-live-photo-path">
                                {info.width}×{info.height} · {info.duration.toFixed(1)}s
                            </div>
                        ) : null}
                        <InputNumber
                            label={$t("livePhoto_start")}
                            value={Number(start.toFixed(2))}
                            min={0}
                            max={Math.max(maxDuration, 0)}
                            step={0.1}
                            disabled={!videoPath}
                            onChange={value => { session.start = Math.max(0, value); }}
                        />
                        <InputNumber
                            label={$t("livePhoto_duration")}
                            value={Number(Math.min(duration, durationCap || duration).toFixed(2))}
                            min={0.2}
                            max={Math.max(durationCap || 0.2, 0.2)}
                            step={0.1}
                            disabled={!videoPath}
                            onChange={value => { session.duration = Math.max(0.2, value); }}
                        />
                        <InputNumber
                            label={$t("livePhoto_cover_time")}
                            value={Number(coverTime.toFixed(2))}
                            min={0}
                            max={Math.max(maxDuration, 0)}
                            step={0.1}
                            disabled={!videoPath}
                            onChange={value => { session.coverTime = Math.max(0, value); }}
                        />
                        <Align>
                            <Button size="small" disabled={!videoPath} onClick={useCurrentFrame}>
                                {$t("livePhoto_use_frame")}
                            </Button>
                            <Button size="small" disabled={!videoPath} onClick={() => void pickCover()}>
                                {$t("livePhoto_pick_cover")}
                            </Button>
                        </Align>
                        {coverPath ? (
                            <Align>
                                <span className="lumia-live-photo-path">{fileName(coverPath)}</span>
                                <Button size="small" onClick={() => { session.coverPath = ""; }}>
                                    {$t("livePhoto_cover_clear")}
                                </Button>
                            </Align>
                        ) : null}
                        {variant === "google" ? (
                            <>
                                <Select
                                    label={$t("livePhoto_quality")}
                                    value={quality}
                                    options={qualityOptions}
                                    onChange={value => { session.quality = String(value); }}
                                />
                                <Select
                                    label={$t("livePhoto_height")}
                                    value={height}
                                    options={heightOptions}
                                    onChange={value => { session.height = String(value); }}
                                />
                            </>
                        ) : (
                            <Bool
                                border
                                disabled={appleBlocked}
                                value={importPhotos}
                                onChange={value => { session.importPhotos = value; }}
                                label={$t("livePhoto_import_photos")}
                            />
                        )}
                        {variant === "wallpaper" ? (
                            <div className="lumia-live-photo-hint">{$t("livePhoto_wallpaper_hint")}</div>
                        ) : clipDuration > 3.5 ? (
                            <div className="lumia-live-photo-hint">{$t("livePhoto_wechat_hint")}</div>
                        ) : null}
                        <Button
                            type="primary"
                            long
                            loading={busy}
                            disabled={busy || !videoPath || appleBlocked}
                            onClick={() => void exportLivePhoto()}
                        >
                            {$t("livePhoto_export")}
                        </Button>
                        {status ? <div className="lumia-live-photo-status">{status}</div> : null}
                        {error ? <div className="lumia-live-photo-error">{error}</div> : null}
                    </Align>
                </Card>
            </aside>
            <section className="lumia-generator-preview">
                <Card>
                    {appleBlocked ? (
                        <Exception content={$t("livePhoto_macos_only")} />
                    ) : previewSrc ? (
                        <video
                            ref={videoRef}
                            className="lumia-live-photo-video"
                            src={previewSrc}
                            controls
                            onLoadedMetadata={event => {
                                const next = event.currentTarget.duration;
                                if (Number.isFinite(next) && next > 0 && info && Math.abs(info.duration - next) > 0.4) {
                                    session.info = { ...info, duration: next };
                                }
                            }}
                        />
                    ) : (
                        <Exception content={$t("livePhoto_empty_video")} />
                    )}
                </Card>
            </section>
        </div>
    );
}
