import { join, resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { readFileSync } from "fs";
import HtmlConfig from "vite-plugin-html-config";

export default defineConfig({
    base: "./",
    plugins: [
        nodePolyfills(),
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
