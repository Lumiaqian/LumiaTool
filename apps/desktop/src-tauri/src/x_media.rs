use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

const USER_AGENT: &str = concat!(
    "LumiaTool/",
    env!("CARGO_PKG_VERSION"),
    " (https://github.com/Lumiaqian/LumiaTool)"
);

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct XMediaItem {
    pub kind: String,
    pub url: String,
    pub thumbnail: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub filename: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct XTweetMedia {
    pub id: String,
    pub url: String,
    pub author: String,
    pub text: String,
    pub items: Vec<XMediaItem>,
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|error| error.to_string())
}

fn parse_status_id(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.chars().all(|ch| ch.is_ascii_digit()) && trimmed.len() >= 8 && trimmed.len() <= 20 {
        return Ok(trimmed.to_string());
    }
    let lower = trimmed.to_ascii_lowercase();
    let markers = ["/status/", "/statuses/"];
    for marker in markers {
        if let Some(index) = lower.find(marker) {
            let rest = &trimmed[index + marker.len()..];
            let id: String = rest.chars().take_while(|ch| ch.is_ascii_digit()).collect();
            if id.len() >= 8 {
                return Ok(id);
            }
        }
    }
    Err("Paste an X/Twitter status URL or tweet id".into())
}

fn original_photo_url(url: &str) -> String {
    if !url.contains("pbs.twimg.com") {
        return url.to_string();
    }
    if let Some(index) = url.find("name=") {
        let prefix = &url[..index];
        let rest = url[index + 5..]
            .find('&')
            .map(|offset| &url[index + 5 + offset..])
            .unwrap_or("");
        return format!("{prefix}name=orig{rest}");
    }
    if url.contains('?') {
        format!("{url}&name=orig")
    } else {
        format!("{url}?name=orig")
    }
}

fn extension_for(kind: &str, url: &str) -> &'static str {
    let path = url.split('?').next().unwrap_or(url).to_ascii_lowercase();
    if kind == "photo" {
        if path.ends_with(".png") {
            return "png";
        }
        if path.ends_with(".webp") {
            return "webp";
        }
        if path.ends_with(".gif") {
            return "gif";
        }
        return "jpg";
    }
    "mp4"
}

fn collect_media(tweet: &Value, tweet_id: &str, prefix: &str, items: &mut Vec<XMediaItem>) {
    let media = tweet.get("media");
    let photos = media
        .and_then(|value| value.get("photos"))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let videos = media
        .and_then(|value| value.get("videos"))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    for photo in photos {
        let Some(url) = photo.get("url").and_then(Value::as_str) else {
            continue;
        };
        let url = original_photo_url(url);
        let index = items.len() + 1;
        items.push(XMediaItem {
            kind: "photo".into(),
            thumbnail: Some(url.clone()),
            width: photo
                .get("width")
                .and_then(Value::as_u64)
                .map(|value| value as u32),
            height: photo
                .get("height")
                .and_then(Value::as_u64)
                .map(|value| value as u32),
            filename: format!(
                "{prefix}{tweet_id}_{index:02}.{}",
                extension_for("photo", &url)
            ),
            url,
        });
    }

    for video in videos {
        let Some(url) = video.get("url").and_then(Value::as_str) else {
            continue;
        };
        let kind = video.get("type").and_then(Value::as_str).unwrap_or("video");
        let kind = if kind == "gif" { "gif" } else { "video" };
        let index = items.len() + 1;
        items.push(XMediaItem {
            kind: kind.into(),
            url: url.to_string(),
            thumbnail: video
                .get("thumbnail_url")
                .and_then(Value::as_str)
                .map(ToOwned::to_owned),
            width: video
                .get("width")
                .and_then(Value::as_u64)
                .map(|value| value as u32),
            height: video
                .get("height")
                .and_then(Value::as_u64)
                .map(|value| value as u32),
            filename: format!("{prefix}{tweet_id}_{index:02}.{}", extension_for(kind, url)),
        });
    }
}

fn tweet_object(payload: &Value) -> Option<&Value> {
    payload
        .get("tweet")
        .or_else(|| payload.get("status"))
        .filter(|value| value.is_object())
}

#[tauri::command]
pub async fn fetch_x_tweet(url: String) -> Result<XTweetMedia, String> {
    let id = parse_status_id(&url)?;
    let client = http_client()?;
    let endpoint = format!("https://api.fxtwitter.com/status/{id}");
    let response = client
        .get(endpoint)
        .send()
        .await
        .map_err(|error| error.to_string())?;
    let status = response.status();
    let payload: Value = response.json().await.map_err(|error| error.to_string())?;
    let code = payload
        .get("code")
        .and_then(Value::as_u64)
        .unwrap_or(u64::from(status.as_u16()));
    if code == 401 {
        return Err("This tweet is private".into());
    }
    if code == 404 {
        return Err("Tweet not found".into());
    }
    if code != 200 {
        let message = payload
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or("Failed to fetch tweet");
        return Err(message.to_string());
    }
    let tweet = tweet_object(&payload).ok_or_else(|| "Unexpected tweet payload".to_string())?;
    let author = tweet
        .get("author")
        .and_then(|value| value.get("screen_name"))
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    let text = tweet
        .get("text")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let tweet_url = tweet
        .get("url")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| format!("https://x.com/i/status/{id}"));
    let mut items = Vec::new();
    collect_media(tweet, &id, "", &mut items);
    if let Some(quote) = tweet.get("quote") {
        let quote_id = quote.get("id").and_then(Value::as_str).unwrap_or("quote");
        collect_media(quote, quote_id, "quote_", &mut items);
    }
    if items.is_empty() {
        return Err("This tweet has no downloadable image or video".into());
    }
    Ok(XTweetMedia {
        id,
        url: tweet_url,
        author: author.to_string(),
        text,
        items,
    })
}

#[tauri::command]
pub async fn download_x_media(
    items: Vec<XMediaItem>,
    output_dir: String,
) -> Result<Vec<String>, String> {
    if items.is_empty() {
        return Err("No media selected".into());
    }
    let dir = PathBuf::from(&output_dir);
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    let client = http_client()?;
    let mut saved = Vec::new();
    for item in items {
        let response = client
            .get(&item.url)
            .header("Referer", "https://x.com/")
            .send()
            .await
            .map_err(|error| format!("{}: {error}", item.filename))?;
        if !response.status().is_success() {
            return Err(format!("{}: HTTP {}", item.filename, response.status()));
        }
        let bytes = response.bytes().await.map_err(|error| error.to_string())?;
        let path = dir.join(&item.filename);
        fs::write(&path, bytes).map_err(|error| error.to_string())?;
        saved.push(path.to_string_lossy().into_owned());
    }
    Ok(saved)
}
