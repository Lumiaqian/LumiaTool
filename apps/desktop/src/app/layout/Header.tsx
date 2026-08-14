import { useEffect, useMemo, useRef, useState } from "react";
import { ExtendPage, Icon } from "@/components";
import { categories, categoryExists, getCategory, getTool, toolExists } from "@/config";
import type { FeatureInterface } from "@/config";
import event from "@/event";
import { toggleDevTools } from "@/lib/desktop";
import getHistoryInstance from "@/lib/history";
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
    const [historyExist, setHistoryExist] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ctool-sidebar-collapsed") === "true");
    const toolListRef = useRef<HTMLElement | null>(null);
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

    const selectTool = (name: string, category = selectedCategory) => {
        storeOperate.redirectTool(name, storeOperate.getToolLastFeature(name), category);
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
            toolListRef.current?.querySelector<HTMLElement>(".is-current")?.scrollIntoView({ block: "nearest" });
        });
    }, [collapsed, selectedCategory, storeOperate.items.tool]);

    useEffect(() => {
        const updateHistoryExist = () => {
            setHistoryExist(getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).length() > 0);
        };
        updateHistoryExist();
        event.addListener(["tool_change", "history_change"], updateHistoryExist);
        return () => event.removeListener(["tool_change", "history_change"], updateHistoryExist);
    }, [storeOperate]);

    const toggleCollapsed = () => {
        setCollapsed(current => {
            const next = !current;
            localStorage.setItem("ctool-sidebar-collapsed", String(next));
            requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
            return next;
        });
    };
    return (
        <>
            <aside className={`ctool-sidebar${collapsed ? " ctool-sidebar-collapsed" : ""}`}>
                <div className="ctool-sidebar-brand">
                    <button
                        className="ctool-sidebar-brand-mark"
                        onClick={() => selectCategory("common")}
                        title="LumiaTool"
                        aria-label="LumiaTool 首页"
                    >
                        <img src="./favicon.ico" alt="" width="38" height="38" />
                    </button>
                    {!collapsed && (
                        <div className="ctool-sidebar-brand-copy">
                            <strong>LumiaTool</strong>
                            <span>Developer Toolbox</span>
                        </div>
                    )}
                    <button
                        className="ctool-sidebar-toggle"
                        onClick={toggleCollapsed}
                        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        aria-expanded={!collapsed}
                    >
                        <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
                    </button>
                </div>

                {!collapsed && <Search />}

                <nav className="ctool-sidebar-categories" aria-label="工具分类">
                    {allCategories.map(name => (
                        <button
                            className={selectedCategory === name ? "is-current" : ""}
                            key={name}
                            onClick={() => selectCategory(name)}
                            title={$t(`main_category_${name}`)}
                            aria-label={$t(`main_category_${name}`)}
                            aria-current={selectedCategory === name ? "page" : undefined}
                        >
                            <span className={`ctool-sidebar-category-dot${collapsed ? " is-monogram" : ""}`}>
                                {collapsed ? $t(`main_category_${name}`).slice(0, 1) : ""}
                            </span>
                            {!collapsed && <span>{$t(`main_category_${name}`)}</span>}
                        </button>
                    ))}
                </nav>

                <div className="ctool-sidebar-section-heading" aria-hidden="true">
                    <span>{$t(`main_category_${selectedCategory}`)}</span>
                    <span>{categoryTools.length}</span>
                </div>

                <nav ref={toolListRef} className="ctool-sidebar-tools" aria-label="当前分类工具">
                    {categoryTools.map(name => (
                        <button
                            className={storeOperate.items.tool === name ? "is-current" : ""}
                            key={name}
                            onClick={() => selectTool(name)}
                            title={$t(`tool_${name}`)}
                            aria-label={$t(`tool_${name}`)}
                            aria-current={storeOperate.items.tool === name ? "page" : undefined}
                        >
                            {collapsed ? (
                                <span className="ctool-sidebar-tool-monogram">
                                    {$t(`tool_${name}`).slice(0, 1).toUpperCase()}
                                </span>
                            ) : (
                                <>
                                    <span className="ctool-sidebar-tool-indicator" aria-hidden="true" />
                                    <span>{$t(`tool_${name}`)}</span>
                                </>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="ctool-sidebar-footer" role="toolbar" aria-label="应用操作">
                    <button
                        className={openTools ? "is-active" : ""}
                        aria-pressed={openTools}
                        onClick={() => setOpenTools(value => !value)}
                        title={$t("main_tools_lists")}
                        aria-label={$t("main_tools_lists")}
                    >
                        <Icon size={16} name="common" />
                        {!collapsed && <span>{$t("main_tools_lists")}</span>}
                    </button>
                    <button
                        onClick={() => event.dispatch("content_clear")}
                        title={$t("main_content_clear")}
                        aria-label={$t("main_content_clear")}
                    >
                        <Icon size={16} name="clear" />
                        {!collapsed && <span>{$t("main_content_clear")}</span>}
                    </button>
                    <button
                        className={[
                            !storeSetting.items.history_icon_badge_hidden && historyExist
                                ? "ctool-sidebar-history-active"
                                : "",
                            openHistory ? "is-active" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        onClick={() => setOpenHistory(value => !value)}
                        aria-pressed={openHistory}
                        title={`${$t(`tool_${storeOperate.items.tool}`)} -${$t("main_history")}`}
                        aria-label={`${$t(`tool_${storeOperate.items.tool}`)} -${$t("main_history")}`}
                    >
                        <Icon size={16} name="history" />
                        {!collapsed && <span>{$t("main_history")}</span>}
                    </button>
                    <button
                        onClick={() => event.dispatch("open_setting")}
                        title={$t("main_ui_setting")}
                        aria-label={$t("main_ui_setting")}
                    >
                        <Icon size={16} name="setting" />
                        {!collapsed && <span>{$t("main_ui_setting")}</span>}
                    </button>
                    <button
                        onClick={toggleDevTools}
                        title={$t("main_ui_open_devtools")}
                        aria-label={$t("main_ui_open_devtools")}
                    >
                        <Icon size={16} name="devtools" />
                        {!collapsed && <span>{$t("main_ui_open_devtools")}</span>}
                    </button>
                </div>
            </aside>

            <header className="ctool-workbench-toolbar">
                <div className="ctool-workbench-title">
                    <span className="ctool-workbench-eyebrow">{$t(`main_category_${selectedCategory}`)}</span>
                    <h1>{$t(`tool_${storeOperate.items.tool}`)}</h1>
                </div>
                {features.length > 1 && (
                    <nav className="ctool-feature-tabs" aria-label="工具功能">
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

            <ExtendPage value={openTools} onChange={setOpenTools}>
                <Tools />
            </ExtendPage>
            <ExtendPage value={openHistory} onChange={setOpenHistory}>
                <History />
            </ExtendPage>
        </>
    );
}
