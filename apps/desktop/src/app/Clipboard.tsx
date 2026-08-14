import { useEffect, useRef } from "react";
import { Align, Link } from "@/components";
import event from "@/event";
import { paste, useClipboardPermission } from "@/lib/clipboard";

export default function Clipboard() {
    const { state } = useClipboardPermission();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            event.dispatch("extend_page_close");
        }
    }, []);

    return (
        <Align horizontal="center" vertical="center">
            {state === "granted" && <span>{$t("main_clipboard_granted")}</span>}
            {state === "denied" && <span>{$t("main_clipboard_denied")}</span>}
            {state === "prompt" && (
                <Link type="primary" onClick={() => void paste(true)}>
                    {$t("main_clipboard_prompt")}
                </Link>
            )}
        </Align>
    );
}
