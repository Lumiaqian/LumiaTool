import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const paths = [
    "node_modules",
    "apps/desktop/node_modules",
    "apps/desktop/dist",
    "apps/desktop/tsconfig.app.tsbuildinfo",
    "apps/desktop/tsconfig.node.tsbuildinfo",
    "apps/desktop/src/generated",
    "apps/desktop/src-tauri/target",
    "packages/config/node_modules",
    "packages/config/dist",
    ".playwright-cli",
    "output",
];

for (const path of paths) {
    const abs = resolve(root, path);
    console.log(abs);
    rmSync(abs, { recursive: true, force: true });
}
