import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { $t } from "@/i18n";
import { copy } from "@/lib/clipboard";
import { initPermission } from "@/lib/clipboard";
import "@/assets/style.css";
import "@/assets/react-migrated.css";
import "@/design-system/tokens.css";
import "@/design-system/workbench.css";
import "@/design-system/tool-layouts.css";
import "@/design-system/all-tools.css";
import "@/design-system/transformer-family.css";
import "@/design-system/tester-family.css";
import "@/design-system/inspector-utility-family.css";
import "@/design-system/generator-editor-family.css";
import "@/design-system/polish.css";

Object.assign(globalThis, {
    $t,
    $copy: copy,
    $error: (error: unknown, isI18n = true) => {
        const message = error instanceof Error ? error.message : String(error);
        return isI18n ? $t(message) : message;
    },
});

await initPermission();

const container = document.getElementById("app");
if (!container) {
    throw new Error("LumiaTool root element is missing");
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
