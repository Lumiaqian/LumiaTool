import { useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import type { ToolRouteConfig, RouteMeta } from "@/types";
import { toolRoutes } from "@/generated/data";
import { getTool } from "@/config";

export type RouteLocation = {
    path: string;
    query: Record<string, string>;
};

export type AppRoute = {
    name: string;
    path: string;
    component: () => Promise<{ default: ComponentType }>;
    meta: RouteMeta;
};

const parseHash = (hash: string): RouteLocation => {
    const value = hash.replace(/^#/, "") || "/";
    const [path, search = ""] = value.split("?", 2);
    return {
        path: path.startsWith("/") ? path : `/${path}`,
        query: Object.fromEntries(new URLSearchParams(search)),
    };
};

export const getCurrentRoute = () => parseHash(window.location.hash);

export const navigate = ({ path, query = {} }: { path: string; query?: Record<string, string | number> }) => {
    const search = new URLSearchParams(
        Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])),
    ).toString();
    window.location.hash = `${path}${search ? `?${search}` : ""}`;
};

export const useRoute = () => {
    const hash = useSyncExternalStore(
        callback => {
            window.addEventListener("hashchange", callback);
            return () => window.removeEventListener("hashchange", callback);
        },
        () => window.location.hash,
        () => "",
    );
    return parseHash(hash);
};

export const routes: AppRoute[] = [
    {
        name: "index",
        path: "/",
        component: () => import("@/app/Index"),
        meta: { type: "index" },
    },
    {
        name: "test",
        path: "/test",
        component: () => import("@/app/Test"),
        meta: { type: "other" },
    },
    ...toolRoutes.map((item: ToolRouteConfig): AppRoute => ({
        name: `${item.tool}${item.feature ? `_${item.feature}` : ""}`,
        path: getTool(item.tool).getFeature(item.feature).getRouter(),
        component: item.component,
        meta: { type: "tool", tool: item.tool, feature: item.feature },
    })),
];

export const matchRoute = (path: string) => routes.find(route => route.path === path) ?? routes[0];
