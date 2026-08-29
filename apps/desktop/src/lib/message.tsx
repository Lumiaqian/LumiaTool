import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { MessageMethod, MessageOption, MessageType } from "@/types";
import { Icon } from "@/components";

const roots = new Map<HTMLElement, Root>();

const close = (container: HTMLElement) => {
    const root = roots.get(container);
    if (root) {
        root.unmount();
        roots.delete(container);
    }
    container.remove();
};

const show = (type: MessageType, content: string, option: MessageOption = {}) => {
    const append = document.getElementById("lumia-append") ?? document.body;
    const container = document.createElement("div");
    container.className = "lumia-message";
    const offset = option.offset ?? 20;
    const previous = Array.from(roots.keys());
    const top = previous.reduce((value, element) => value + element.clientHeight + 10, offset);
    container.style.top = `${top}px`;
    append.appendChild(container);

    const root = createRoot(container);
    roots.set(container, root);
    const liveRole = type === "error" ? "alert" : "status";
    root.render(
        <div
            className="lumia-message-content"
            data-type={type}
            role={liveRole}
            aria-live={type === "error" ? "assertive" : "polite"}
            aria-atomic="true"
        >
            <Icon name={type} aria-hidden="true" />
            <span>{content}</span>
        </div>,
    );

    const duration = option.duration ?? 3000;
    if (duration > 0) {
        window.setTimeout(() => close(container), duration);
    }
};

const Message: MessageMethod = {
    closeAll: () => {
        for (const container of Array.from(roots.keys())) {
            close(container);
        }
    },
    success: (content, option) => show("success", content, option),
    error: (content, option) => show("error", content, option),
    info: (content, option) => show("info", content, option),
};

export default Message;
