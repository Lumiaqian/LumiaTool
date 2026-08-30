import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { locale, platform } from "@tauri-apps/plugin-os";
import { openUrl as openExternalUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import type { LocaleLists } from "@/types";

export const platformName = "tauri";

export const openUrl = (url: string) => openExternalUrl(url);

export const toggleDevTools = () => invoke<void>("toggle_dev_tools");

export const saveFile = async (data: Uint8Array, defaultPath: string) => {
    const path = await save({ defaultPath });
    if (!path) {
        return false;
    }
    await writeFile(path, data);
    return true;
};

export const installAvailableUpdate = async () => {
    const update = await check();
    if (!update) {
        return false;
    }
    await update.downloadAndInstall();
    await relaunch();
    return true;
};

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

export const probeLivePhotoVideo = (path: string) => invoke<LivePhotoVideoInfo>("live_photo_probe", { path });

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

let systemLocale: LocaleLists = "en";

export const isMacOs = platform() === "macos";

export const initializeSystemLocale = async () => {
    const detected = (await locale())?.trim() ?? "";
    systemLocale = detected === "zh" || detected.startsWith("zh-") || detected.startsWith("zh_") ? "zh_CN" : "en";
};

export const getSystemLocale = () => systemLocale;
