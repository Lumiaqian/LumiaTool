import { proxy, snapshot, subscribe } from "valtio/vanilla";
import { getTool, toolExists, categoryExists, tools, getCategory } from "@/config";
import type { FeatureType, ToolType } from "@/config";
import { navigate } from "@/lib/router";
import { useMutable } from "@/lib/reactive";
import event from "@/event";
import storage from "@/lib/storage";

interface OperateState {
    tool: string;
    feature: string;
    category: string;
    category_last_tool: Record<string, string>;
    tool_last_feature: Record<string, string>;
    recently: string[];
}

const defaults: OperateState = {
    tool: "",
    category: "",
    feature: "",
    category_last_tool: {},
    tool_last_feature: {},
    recently: [],
};

const persisted = storage.get<Partial<OperateState>>("operate", null, false);
const items = proxy<OperateState>({ ...defaults, ...persisted });

subscribe(items, () => {
    storage.setNoVersion("operate", snapshot(items));
});

const redirectTool = (
    requestedTool = "",
    requestedFeature = "",
    requestedCategory = "",
    history: string | number = "",
    keyword = "",
) => {
    const tool = getTool(toolExists(requestedTool) ? requestedTool : tools[0].name);
    const categoryName = requestedCategory === "common" || tool.inCategory(requestedCategory)
        ? (requestedCategory || tool.firstCategory().name)
        : tool.firstCategory().name;
    const feature = tool.getFeature(tool.existFeature(requestedFeature) ? requestedFeature : tool.firstFeature().name);
    const query: Record<string, string | number> = {};
    if (history !== "") {
        query.history = history;
    }
    if (keyword !== "") {
        query.keyword = keyword;
    }
    event.dispatch("extend_page_close");
    navigate({
        path: feature.getRouter(),
        query: feature.getQuery(categoryName, query),
    });
};

const access = (toolName: string, featureName: string, categoryName: string): boolean => {
    if (!toolExists(toolName)) {
        return false;
    }
    const tool = getTool(toolName);
    if (!tool.existFeature(featureName)) {
        return false;
    }
    if (categoryName !== "common") {
        if (!categoryExists(categoryName) || !tool.inCategory(categoryName)) {
            return false;
        }
    }
    const feature = tool.getFeature(featureName);
    items.tool = tool.name;
    items.feature = feature.name;
    items.category = categoryName;
    items.category_last_tool = { ...items.category_last_tool, [categoryName]: tool.name };
    items.tool_last_feature = { ...items.tool_last_feature, [tool.name]: feature.name };

    const recentlyKey = `${tool.name}-${feature.name}`;
    const recently = new Set([...items.recently].reverse());
    recently.delete(recentlyKey);
    recently.add(recentlyKey);
    items.recently = Array.from(recently).reverse();
    event.dispatch("tool_change");
    return true;
};

const getRecently = () => items.recently
    .filter(item => {
        const [tool, feature] = item.split("-");
        return toolExists(tool) && getTool(tool).existFeature(feature);
    })
    .map(item => {
        const [tool, feature] = item.split("-");
        return getTool(tool as ToolType).getFeature(feature as FeatureType);
    });

const getCategoryLastTool = (category: string) => {
    if (
        categoryExists(category)
        && category in items.category_last_tool
        && getCategory(category).existTool(items.category_last_tool[category])
    ) {
        return items.category_last_tool[category];
    }
    return "";
};

const getToolLastFeature = (tool: string) => {
    if (!toolExists(tool)) {
        return "";
    }
    const toolConfig = getTool(tool);
    if (toolConfig.isSimple()) {
        return toolConfig.firstFeature().name;
    }
    if (tool in items.tool_last_feature && toolConfig.existFeature(items.tool_last_feature[tool])) {
        return items.tool_last_feature[tool];
    }
    return "";
};

export const operateStore = {
    items,
    redirectTool,
    getCategoryLastTool,
    getToolLastFeature,
    access,
    getRecently,
};

export const useOperate = () => {
    useMutable(items);
    return operateStore;
};

export default useOperate;

