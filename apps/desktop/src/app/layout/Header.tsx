import { useEffect, useMemo, useRef, useState } from "react";
import { ExtendPage, Icon } from "@/components";
import { categories, categoryExists, getCategory, getTool, toolExists } from "@/config";
import type { FeatureInterface } from "@/config";
import { getToolMark } from "@/design-system/tool-layout";
import event from "@/event";
import { toggleDevTools } from "@/lib/desktop";
import useOperate from "@/store/operate";
import useSetting from "@/store/setting";
import History from "../History";
import Search from "../Search";
import Tools from "../Tools";

export default function Header() {
    const storeOperate = useOperate();
    const storeSetting = useSetting();
    const [openTools, setOpenTools] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const toolListRef = useRef<HTMLElement | null>(null);
    const categoryListRef = useRef<HTMLElement | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(() => storeOperate.items.category || "common");
    const allCategories = ["common", ...categories.map(({ name }) => name)];

    const toolsForCategory = (category: string): string[] => {
        if (categoryExists(category)) {
            return getCategory(category).tools.map(({ name }) => name);
        }
        return storeSetting.items.common;
    };

    const categoryTools = useMemo(
        () => toolsForCategory(selectedCategory),
        [selectedCategory, storeSetting.items.common],
    );

    const features: FeatureInterface[] =
        toolExists(storeOperate.items.tool) && !getTool(storeOperate.items.tool).isSimple()
            ? getTool(storeOperate.items.tool).features
            : [];
    const workspaceSubtitle = features.length > 1 && storeOperate.items.feature
        ? $t(`tool_${storeOperate.items.tool}_${storeOperate.items.feature}`)
        : $t(`main_category_${selectedCategory}`);

    const selectTool = (name: string, category = selectedCategory) => {
        storeOperate.redirectTool(name, storeOperate.getToolLastFeature(name), category);
        setMobileOpen(false);
    };

    const selectCategory = (name: string) => {
        setSelectedCategory(name);
        const nextCategoryTools = toolsForCategory(name);
        let tool = "";
        if (categoryExists(name)) {
            tool = storeOperate.getCategoryLastTool(name);
        } else {
            for (const feature of storeOperate.getRecently()) {
                if (storeSetting.items.common.includes(feature.tool.name)) {
                    tool = feature.tool.name;
                    break;
                }
            }
        }
        const nextTool = tool || nextCategoryTools[0];
        if (nextTool) {
            selectTool(nextTool, name);
        }
    };

    const selectFeature = (feature: FeatureInterface) => {
        storeOperate.redirectTool(storeOperate.items.tool, feature.name, storeOperate.items.category);
    };

    useEffect(() => {
        if (storeOperate.items.category) {
            setSelectedCategory(storeOperate.items.category);
        }
    }, [storeOperate.items.category]);

    useEffect(() => {
        window.dispatchEvent(new Event("resize"));
        requestAnimationFrame(() => {
            categoryListRef.current?.querySelector<HTMLElement>(".is-current")?.scrollIntoView({
                inline: "nearest",
                block: "nearest",
            });
            toolListRef.current?.querySelector<HTMLElement>(".is-current")?.scrollIntoView({ block: "nearest" });
        });
    }, [selectedCategory, storeOperate.items.tool]);


    return (
        <>
            <header className="ctool-workbench-topbar" data-tauri-drag-region>
                <button
                    className="ctool-mobile-tools"
                    onClick={() => setMobileOpen(true)}
                    aria-label={$t("main_workbench_open_shelf")}
                    aria-expanded={mobileOpen}
                >
                    <Icon name="common" size={16} />
                    <span>{$t("main_workbench_tools")}</span>
                </button>
                <button
                    className="ctool-brand"
                    onClick={() => selectCategory("common")}
                    aria-label={$t("main_workbench_home")}
                >
                    <span className="ctool-brand-mark" aria-hidden="true" />
                    <strong>LumiaTool</strong>
                </button>
                <div className="ctool-global-search">
                    <Search />
                    <kbd>{/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"}</kbd>
                </div>
                <button
                    className={openHistory ? "ctool-topbar-action is-active" : "ctool-topbar-action"}
                    onClick={() => setOpenHistory(value => !value)}
                    aria-pressed={openHistory}
                    aria-label={$t("main_history")}
                >
                    <Icon size={15} name="history" />
                    <span>{$t("main_history")}</span>
                </button>
                <button
                    className="ctool-topbar-action"
                    onClick={() => event.dispatch("open_setting") }
                    aria-label={$t("main_ui_setting")}
                >
                    <Icon size={15} name="setting" />
                    <span>{$t("main_ui_setting")}</span>
                </button>
            </header>

            <aside className={`ctool-tool-shelf${mobileOpen ? " is-mobile-open" : ""}`} aria-label={$t("main_workbench_shelf")}>
                <button className="ctool-mobile-close" onClick={() => setMobileOpen(false)} aria-label={$t("main_workbench_close_shelf")}>
                    ×
                </button>

                <nav ref={categoryListRef} className="ctool-category-strip" aria-label={$t("main_workbench_category")}>
                    {allCategories.map(name => (
                        <button
                            className={selectedCategory === name ? "is-current" : ""}
                            key={name}
                            onClick={() => selectCategory(name)}
                            aria-current={selectedCategory === name ? "page" : undefined}
                        >
                            {$t(`main_category_${name}`)}
                        </button>
                    ))}
                </nav>

                <nav ref={toolListRef} className="ctool-tool-grid" aria-label={$t("main_workbench_category_tools")}>
                    {categoryTools.map(name => (
                        <button
                            className={storeOperate.items.tool === name ? "is-current" : ""}
                            key={name}
                            onClick={() => selectTool(name)}
                            aria-current={storeOperate.items.tool === name ? "page" : undefined}
                        >
                            <span className="ctool-tool-glyph" aria-hidden="true">
                                {getToolMark(name)}
                            </span>
                            <span>{$t(`tool_${name}`)}</span>
                        </button>
                    ))}
                </nav>

                <div className="ctool-shelf-footer" role="toolbar" aria-label={$t("main_workbench_actions")}>
                    <button onClick={() => setOpenTools(value => !value)} aria-label={$t("main_tools_lists")}>
                        <Icon size={16} name="common" />
                    </button>
                    <button onClick={() => event.dispatch("content_clear")} aria-label={$t("main_content_clear")}>
                        <Icon size={16} name="clear" />
                    </button>
                    <button onClick={toggleDevTools} aria-label={$t("main_ui_open_devtools")}>
                        <Icon size={16} name="devtools" />
                    </button>
                </div>
            </aside>

            {mobileOpen && <button className="ctool-shelf-mask" onClick={() => setMobileOpen(false)} aria-label={$t("main_workbench_close_shelf")} />}

            <header className="ctool-workbench-toolbar">
                <div className="ctool-workbench-title">
                    <strong>{$t(`tool_${storeOperate.items.tool}`)}</strong>
                    <span>{workspaceSubtitle}</span>
                </div>
                {features.length > 1 && (
                    <nav className="ctool-feature-tabs" aria-label={$t("main_workbench_features")}>
                        {features.map(feature => (
                            <button
                                className={storeOperate.items.feature === feature.name ? "is-current" : ""}
                                key={`${storeOperate.items.tool}-${feature.name}`}
                                onClick={() => selectFeature(feature)}
                                aria-current={storeOperate.items.feature === feature.name ? "page" : undefined}
                            >
                                {$t(`tool_${storeOperate.items.tool}_${feature.name}`)}
                            </button>
                        ))}
                    </nav>
                )}
            </header>

            <footer className="ctool-workbench-status" aria-label={$t("main_workbench_status")}>
                <span>UTF-8</span>
                <span>{storeOperate.items.feature || $t("main_workbench_status_workspace")}</span>
                <span>{$t("main_workbench_status_local")}</span>
                <span>{$t("main_workbench_status_ready")}</span>
            </footer>

            <ExtendPage value={openTools} onChange={setOpenTools}>
                <Tools />
            </ExtendPage>
            <ExtendPage value={openHistory} onChange={setOpenHistory} hideClose>
                <History onClose={() => setOpenHistory(false)} />
            </ExtendPage>
        </>
    );
}
