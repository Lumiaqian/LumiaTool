import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { $t } from "@/i18n";
import { copy } from "@/lib/clipboard";
import { initPermission } from "@/lib/clipboard";
import "@/assets/style.css";
import "@/assets/react-migrated.css";

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
