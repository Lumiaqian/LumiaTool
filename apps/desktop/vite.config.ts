import { join, resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import HtmlConfig from "vite-plugin-html-config";

export default defineConfig({
    base: "./",
    plugins: [
        HtmlConfig({
            metas: [
                {
                    name: "lumia-version",
                    content: JSON.parse(readFileSync(join(__dirname, "../../package.json")).toString())["version"],
                },
                {
                    name: "lumia-build-timestamp",
                    content: `${Date.parse(new Date().toString()) / 1000}`,
                },
            ],
        }),
        react(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            path: "path-browserify",
            url: "url",
            os: "os-browserify/browser",
            util: "util",
            http: "stream-http",
            https: "https-browserify",
            "fs/promises": resolve(__dirname, "./src/browser-empty.ts"),
            fs: resolve(__dirname, "./src/browser-empty.ts"),
            module: resolve(__dirname, "./src/browser-empty.ts"),
            crypto: resolve(__dirname, "./src/browser-empty.ts"),
        },
    },
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },
    build: {
        target: "esnext",
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, "index.html"),
        },
        reportCompressedSize: false,
        chunkSizeWarningLimit: 5000,
    },
});
