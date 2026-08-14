import { invoke } from "@tauri-apps/api/core";
import { openUrl as openExternalUrl } from "@tauri-apps/plugin-opener";

export const platformName = "tauri";

export const openUrl = (url: string) => openExternalUrl(url);

export const toggleDevTools = () => invoke<void>("toggle_dev_tools");

export const getSystemLocale = () => {
    const locale = navigator.language.trim();
    return locale === "zh" || locale.startsWith("zh-") || locale.startsWith("zh_") ? "zh_CN" : "en";
};
