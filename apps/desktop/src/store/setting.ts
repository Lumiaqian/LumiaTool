import { useEffect, useState } from "react";
import { proxy, snapshot, subscribe } from "valtio/vanilla";
import type { Locale, ThemeRawType, ThemeType } from "@/types";
import { commonTool } from "@/config";
import type { ToolType } from "@/config";
import { setCurrentLocale } from "@/i18n";
import event from "@/event";
import storage from "@/lib/storage";
import { useMutable } from "@/lib/reactive";

interface Setting {
    common: ToolType[];
    locale: Locale;
    theme: ThemeType;
    auto_read_copy: boolean;
    auto_read_copy_filter: boolean;
    auto_save_copy: boolean;
    fill_history_expire: number;
    history_icon_badge_hidden: boolean;
}

const getSystemTheme = (): ThemeRawType => (
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
);

const defaults: Setting = {
    auto_read_copy: false,
    auto_read_copy_filter: false,
    auto_save_copy: true,
    locale: "_default",
    theme: "auto",
    common: [...commonTool],
    fill_history_expire: 3600,
    history_icon_badge_hidden: false,
};

const persisted = storage.get<Partial<Setting>>("setting", null, false);
const items = proxy<Setting>({ ...defaults, ...persisted });

subscribe(items, () => {
    storage.setNoVersion("setting", snapshot(items));
});

setCurrentLocale(items.locale);
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (items.theme === "auto") {
        event.dispatch("theme_change", "system change");
    }
});

const save = <K extends keyof Setting>(key: K, value: Setting[K]) => {
    if (key === "common" && (value as string[]).length < 1) {
        items.common = [...new Set(commonTool)];
        return;
    }
    items[key] = value;
    if (key === "locale") {
        setCurrentLocale(items.locale);
        window.dispatchEvent(new Event("resize"));
    }
    if (key === "theme") {
        event.dispatch("theme_change", value);
    }
};

export const settingStore = { items, save };

export const useSetting = () => {
    useMutable(items);
    return settingStore;
};

export const useTheme = () => {
    const setting = useSetting();
    const [theme, setTheme] = useState<{ raw: ThemeRawType; config: ThemeType }>(() => ({
        raw: setting.items.theme === "auto" ? getSystemTheme() : setting.items.theme,
        config: setting.items.theme,
    }));

    useEffect(() => {
        const update = () => {
            const next = {
                raw: setting.items.theme === "auto" ? getSystemTheme() : setting.items.theme,
                config: setting.items.theme,
            };
            document.documentElement.dataset.theme = next.raw;
            setTheme(next);
        };
        update();
        event.addListener("theme_change", update);
        return () => event.removeListener("theme_change", update);
    }, [setting.items.theme]);

    return { theme };
};

export default useSetting;
