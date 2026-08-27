import { invoke } from "@tauri-apps/api/core";
import { openUrl as openExternalUrl } from "@tauri-apps/plugin-opener";

export const platformName = "tauri";

export const openUrl = (url: string) => openExternalUrl(url);

export const toggleDevTools = () => invoke<void>("toggle_dev_tools");

export type LivePhotoVideoInfo = {
    duration: number;
    width: number;
    height: number;
    macos: boolean;
    ffmpeg: boolean;
};

export type AppleLivePhotoResult = {
    heicPath: string;
    movPath: string;
    imported: boolean;
};

export const probeLivePhotoVideo = (path: string) =>
    invoke<LivePhotoVideoInfo>("live_photo_probe", { path });

export const createGoogleMotionPhoto = (args: {
    videoPath: string;
    coverPath?: string | null;
    outputPath: string;
    start: number;
    duration: number;
    coverTime: number;
    quality: string;
    height: number;
}) => invoke<string>("create_google_motion_photo", args);

export const createAppleLivePhoto = (args: {
    videoPath: string;
    coverPath?: string | null;
    outputDir: string;
    start: number;
    duration: number;
    coverTime: number;
    importPhotos: boolean;
    wallpaper?: boolean;
}) => invoke<AppleLivePhotoResult>("create_apple_live_photo", args);

export type XMediaItem = {
    kind: "photo" | "video" | "gif" | string;
    url: string;
    thumbnail?: string | null;
    width?: number | null;
    height?: number | null;
    filename: string;
};

export type XTweetMedia = {
    id: string;
    url: string;
    author: string;
    text: string;
    items: XMediaItem[];
};

export const fetchXTweet = (url: string) => invoke<XTweetMedia>("fetch_x_tweet", { url });

export const downloadXMedia = (items: XMediaItem[], outputDir: string) =>
    invoke<string[]>("download_x_media", { items, outputDir });

export const getSystemLocale = () => {
    const locale = navigator.language.trim();
    return locale === "zh" || locale.startsWith("zh-") || locale.startsWith("zh_") ? "zh_CN" : "en";
};
