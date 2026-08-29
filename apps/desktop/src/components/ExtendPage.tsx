import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Icon } from "@/components";
import event, { componentResizeDispatch } from "@/event";

let activeModalCount = 0;

interface ExtendPageOwnProps {
    children?: ReactNode;
    value?: boolean;
    onChange?: (value: boolean) => void;
    disableReplace?: boolean;
    offset?: number;
    closeText?: string;
    hideClose?: boolean;
}

type ExtendPageProps = ExtendPageOwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof ExtendPageOwnProps>;

interface TransitionPresence {
    present: boolean;
    transitionClassName: string;
}
const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

function useTransitionPresence(show: boolean): TransitionPresence {
    const [present, setPresent] = useState(show);
    const [transitionClassName, setTransitionClassName] = useState("");
    const initialRender = useRef(true);
    const presentRef = useRef(present);
    presentRef.current = present;

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let frame: number | undefined;

        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        if (show) {
            setPresent(true);
            setTransitionClassName("lumia-extend-page-enter-active lumia-extend-page-enter-from");
            frame = window.requestAnimationFrame(() => {
                setTransitionClassName("lumia-extend-page-enter-active");
                timer = setTimeout(() => setTransitionClassName(""), 300);
            });
        } else if (presentRef.current) {
            setTransitionClassName("lumia-extend-page-leave-active lumia-extend-page-leave-to");
            timer = setTimeout(() => {
                setPresent(false);
                setTransitionClassName("");
            }, 300);
        }

        return () => {
            if (frame !== undefined) {
                window.cancelAnimationFrame(frame);
            }
            if (timer !== undefined) {
                clearTimeout(timer);
            }
        };
    }, [show]);

    return { present, transitionClassName };
}

function getTop() {
    return typeof document === "undefined"
        ? 33
        : document.querySelector<HTMLElement>(".lumia-header")?.offsetHeight || 33;
}

function getBottom() {
    return typeof document === "undefined"
        ? 33
        : document.querySelector<HTMLElement>(".lumia-bottom")?.offsetHeight || 33;
}

function ExtendPage({
    children,
    value = false,
    onChange,
    disableReplace = false,
    offset = 0,
    closeText = "",
    hideClose = false,
    className,
    style: fallthroughStyle,
    ...rest
}: ExtendPageProps) {
    const [closeI18n, setCloseI18n] = useState(() => $t("main_ui_close"));
    const [top, setTop] = useState(getTop);
    const [bottom, setBottom] = useState(getBottom);
    const isCurrentOpen = useRef(false);
    const disableReplaceRef = useRef(disableReplace);
    const onChangeRef = useRef(onChange);
    disableReplaceRef.current = disableReplace;
    onChangeRef.current = onChange;
    const pageRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    const transition = useTransitionPresence(value);

    useEffect(() => {
        if (value && !disableReplaceRef.current) {
            isCurrentOpen.current = true;
            event.dispatch("extend_page_close");
        }
        if (value) {
            const timer = setTimeout(() => {
                componentResizeDispatch();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [value]);

    useEffect(() => {
        const closeExtendPageListener = () => {
            if (isCurrentOpen.current) {
                isCurrentOpen.current = false;
                return;
            }
            onChangeRef.current?.(false);
        };
        const resize = () => {
            setTop(getTop());
            setBottom(getBottom());
        };

        event.addListener("extend_page_close", closeExtendPageListener);
        event.addListener("window_height_resize", resize);
        return () => {
            event.removeListener("extend_page_close", closeExtendPageListener);
            event.removeListener("window_height_resize", resize);
        };
    }, []);

    useEffect(() => {
        const localeChange = () => setCloseI18n($t("main_ui_close"));
        event.addListener("locale_change", localeChange);
        return () => event.removeListener("locale_change", localeChange);
    }, []);
    useEffect(() => {
        if (!value) {
            triggerRef.current?.focus();
            triggerRef.current = null;
            return;
        }

        triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const app = document.querySelector<HTMLElement>("#app");
        app?.setAttribute("inert", "");
        activeModalCount += 1;

        const keydown = (keyboardEvent: KeyboardEvent) => {
            const page = pageRef.current;
            const openPages = [...document.querySelectorAll<HTMLElement>(".lumia-extend-page")];
            if (!page || openPages.at(-1) !== page) {
                return;
            }
            if (keyboardEvent.key === "Escape") {
                keyboardEvent.preventDefault();
                onChangeRef.current?.(false);
                return;
            }
            if (keyboardEvent.key !== "Tab") {
                return;
            }
            const focusable = [...page.querySelectorAll<HTMLElement>(focusableSelector)];
            if (focusable.length === 0) {
                keyboardEvent.preventDefault();
                page.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (keyboardEvent.shiftKey && document.activeElement === first) {
                keyboardEvent.preventDefault();
                last.focus();
            } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
                keyboardEvent.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", keydown);
        return () => {
            document.removeEventListener("keydown", keydown);
            activeModalCount -= 1;
            if (activeModalCount === 0) {
                app?.removeAttribute("inert");
            }
        };
    }, [value]);

    useEffect(() => {
        if (!value || !transition.present) {
            return;
        }
        const page = pageRef.current;
        const firstFocusable = page?.querySelector<HTMLElement>(focusableSelector);
        (firstFocusable ?? page)?.focus();
    }, [transition.present, value]);

    const pageStyle = useMemo<CSSProperties>(
        () => ({
            top: `${top + offset}px`,
            height: `calc(100vh - ${top + bottom + offset}px)`,
            ...fallthroughStyle,
        }),
        [bottom, fallthroughStyle, offset, top],
    );

    const target = typeof document === "undefined" ? null : document.querySelector("#lumia-append");
    if (!target) {
        return null;
    }

    return createPortal(
        <>
            {transition.present ? (
                <div
                    {...rest}
                    ref={pageRef}
                    role="dialog"
                    aria-modal="true"
                    tabIndex={-1}
                    className={["lumia-extend-page", className, transition.transitionClassName]
                        .filter(Boolean)
                        .join(" ")}
                    style={pageStyle}
                >
                    {!hideClose ? (
                        <div className="lumia-extend-page-close">
                            <Button size="small" type="primary" onClick={() => onChangeRef.current?.(false)}>
                                <Icon name="close" size={10} />
                                <span>{closeText || closeI18n}</span>
                            </Button>
                        </div>
                    ) : null}
                    {children}
                </div>
            ) : null}
        </>,
        target,
    );
}

export default ExtendPage;
