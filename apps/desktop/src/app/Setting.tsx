import { useState } from "react";
import { Align, Bool, Button, Card, ExtendPage, InputNumber, Link, Select } from "@/components";
import { useClipboardPermission } from "@/lib/clipboard";
import { navigate } from "@/lib/router";
import { getLocaleName } from "@/i18n";
import useSetting from "@/store/setting";
import { locales, themes } from "@/types";
import Common from "./Common";

export default function Setting() {
    const storeSetting = useSetting();
    const { state: clipboardState } = useClipboardPermission();
    const [openCommon, setOpenCommon] = useState(false);
    const localeOptions = locales.map((item) => ({ value: item, label: getLocaleName(item) || "" }));

    return (
        <>
            <Card
                title={$t("main_ui_setting")}
                height="100%"
                padding="24px"
            >
                <div className="ctool-setting">
                    <span>{$t("main_display_mode")}</span>
                    <div>
                        <Select
                            value={storeSetting.items.theme}
                            onChange={(value) => storeSetting.save("theme", value)}
                            options={themes.map((item) => ({
                                value: item,
                                label: $t(`main_display_mode_${item}`),
                            }))}
                        />
                    </div>

                    <span>{$t("main_setting_language")}</span>
                    <div>
                        <Select
                            value={storeSetting.items.locale}
                            onChange={(value) => storeSetting.save("locale", value)}
                            options={localeOptions}
                        />
                    </div>


                    <span style={{ gridRowStart: "span 3" }}>{$t("main_ui_clipboard")}</span>
                    <div>
                        <Bool
                            label={$t("main_copy_results_to_clipboard")}
                            value={storeSetting.items.auto_save_copy}
                            onChange={(value: boolean) => storeSetting.save("auto_save_copy", value)}
                        />
                    </div>
                    <div>
                        <Align>
                            <Bool
                                disabled={clipboardState !== "granted"}
                                label={$t("main_read_content_from_clipboard")}
                                value={storeSetting.items.auto_read_copy}
                                onChange={(value: boolean) => storeSetting.save("auto_read_copy", value)}
                            />
                            {clipboardState === "prompt" && (
                                <Link
                                    style={{ fontSize: ".875rem" }}
                                    type="primary"
                                    onClick={() => navigate({ path: "/clipboard" })}
                                >
                                    {$t("main_clipboard_get")}
                                </Link>
                            )}
                        </Align>
                    </div>
                    <div>
                        <Bool
                            disabled={!storeSetting.items.auto_read_copy}
                            label={$t("main_read_clipboard_content_trim")}
                            value={storeSetting.items.auto_read_copy_filter}
                            onChange={(value: boolean) => storeSetting.save("auto_read_copy_filter", value)}
                        />
                    </div>

                    <span>{$t("main_auto_fill")}</span>
                    <Align>
                        <InputNumber
                            value={storeSetting.items.fill_history_expire}
                            width={120}
                            onChange={(value: number) => storeSetting.save("fill_history_expire", value)}
                        />
                        <span style={{ fontSize: 12 }}>
                            {$t("main_auto_fill_explain", [storeSetting.items.fill_history_expire])}
                        </span>
                    </Align>

                    <span>{$t("main_common_tool")}</span>
                    <div>
                        <Button size="small" onClick={() => setOpenCommon((value) => !value)} text={$t("main_ui_config")} />
                    </div>

                    <span>{$t("main_ui_other")}</span>
                    <div>
                        <Bool
                            label={$t("main_history_icon_badge_hidden")}
                            value={storeSetting.items.history_icon_badge_hidden}
                            onChange={(value: boolean) => storeSetting.save("history_icon_badge_hidden", value)}
                        />
                    </div>
                </div>
            </Card>
            <ExtendPage value={openCommon} onChange={setOpenCommon} disableReplace>
                <Common />
            </ExtendPage>
        </>
    );
}
