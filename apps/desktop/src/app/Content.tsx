import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Align, Exception, ExtendPage, Loading } from "@/components";
import { categoryExists, getTool } from "@/config";
import { getToolLayout } from "@/design-system/tool-layout";
import event from "@/event";
import { matchRoute, useRoute } from "@/lib/router";
import useOperate from "@/store/operate";
import type { RouteMeta } from "@/types";
import Setting from "@/app/Setting";

type RouteLocation = {
    path: string;
    fullPath?: string;
    name?: string | number;
    query?: unknown;
};

type RouteModule = {
    default: ComponentType;
};

type MatchedRoute = {
    name?: string | number;
    meta: RouteMeta;
    component: () => Promise<RouteModule>;
};

type RouteViewState = {
    key: string;
    Component: ComponentType | null;
    loading: boolean;
    error: boolean;
};

const queryCategory = (query: unknown): string => {
    if (query instanceof URLSearchParams) {
        return query.get("category") || "";
    }
    if (typeof query === "object" && query !== null && "category" in query) {
        const value = (query as { category?: unknown }).category;
        if (Array.isArray(value)) {
            return value.length > 0 ? String(value[0]) : "";
        }
        return value === undefined || value === null ? "" : String(value);
    }
    return "";
};

export default function Content() {
    const operate = useOperate();
    const currentRoute = useRoute() as unknown as RouteLocation;
    const routeKey = currentRoute.fullPath || currentRoute.path;
    const [openSetting, setOpenSetting] = useState(false);
    const [routeView, setRouteView] = useState<RouteViewState>({
        key: "",
        Component: null,
        loading: true,
        error: false,
    });

    useEffect(() => {
        const toggleSetting = () => setOpenSetting(value => !value);
        event.addListener("open_setting", toggleSetting);
        window.dispatchEvent(new Event("resize"));
        return () => event.removeListener("open_setting", toggleSetting);
    }, []);

    useEffect(() => {
        const matched = matchRoute(currentRoute.path) as unknown as MatchedRoute | null;
        if (!matched) {
            setRouteView({ key: routeKey, Component: null, loading: false, error: true });
            return;
        }

        const meta = matched.meta;
        if (meta.type === "tool") {
            const requestedCategory = queryCategory(currentRoute.query);
            const category =
                requestedCategory === "common" || categoryExists(requestedCategory)
                    ? requestedCategory
                    : getTool(meta.tool).firstCategory().name;
            if (!operate.access(meta.tool, meta.feature, category)) {
                return;
            }
        }

        let active = true;
        setRouteView({ key: routeKey, Component: null, loading: true, error: false });
        matched
            .component()
            .then(module => {
                if (active) {
                    setRouteView({ key: routeKey, Component: module.default, loading: false, error: false });
                }
            })
            .catch(() => {
                if (active) {
                    setRouteView({ key: routeKey, Component: null, loading: false, error: true });
                }
            });

        return () => {
            active = false;
        };
    }, [routeKey]);

    const RouteComponent = routeView.Component;
    const toolLayout = getToolLayout(operate.items.tool);

    return (
        <>
            <main className="lumia-content" id="lumia-main-content" tabIndex={-1}>
                <div
                    className={`lumia-main-tool lumia-tool-layout-${toolLayout}`}
                    data-tool={operate.items.tool}
                    data-feature={operate.items.feature}
                >
                    {routeView.loading && <Loading />}
                    {!routeView.loading && routeView.error && (
                        <Align horizontal="center" vertical="center">
                            <Exception />
                        </Align>
                    )}
                    {!routeView.loading && !routeView.error && RouteComponent && <RouteComponent key={routeView.key} />}
                </div>
            </main>
            <ExtendPage value={openSetting} onChange={setOpenSetting} aria-label={$t("main_ui_setting")}>
                <Setting />
            </ExtendPage>
        </>
    );
}
