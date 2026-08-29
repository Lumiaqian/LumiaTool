import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Icon } from "@/components";
import event, { componentResizeDispatch } from "@/event";

if (typeof document !== "undefined") {
    document.addEventListener("keydown", keyboardEvent => {
        if (keyboardEvent.key === "Escape") {
            event.dispatch("extend_page_close");
        }
    });
}

interface ExtendPageOwnProps {
    children?: ReactNode;
    value?: boolean;
    onChange?: (value: boolean) => void;
    disableReplace?: boolean;
    offset?: number;
    closeText?: string;
    hideClose?: boolean;
}

type ExtendPageProps = ExtendPageOwnProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof ExtendPageOwnProps>;

interface TransitionPresence {
    present: boolean;
    transitionClassName: string;
}

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
            setTransitionClassName(
                "lumia-extend-page-enter-active lumia-extend-page-enter-from",
            );
            frame = window.requestAnimationFrame(() => {
                setTransitionClassName("lumia-extend-page-enter-active");
                timer = setTimeout(() => setTransitionClassName(""), 300);
            });
        } else if (presentRef.current) {
            setTransitionClassName(
                "lumia-extend-page-leave-active lumia-extend-page-leave-to",
            );
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

    const pageStyle = useMemo<CSSProperties>(() => ({
        top: `${top + offset}px`,
        height: `calc(100vh - ${top + bottom + offset}px)`,
        ...fallthroughStyle,
    }), [bottom, fallthroughStyle, offset, top]);

    const target = typeof document === "undefined"
        ? null
        : document.querySelector("#lumia-append");
    if (!target) {
        return null;
    }

    return createPortal(
        <>
            {transition.present ? (
                <div
                    {...rest}
                    className={[
                        "lumia-extend-page",
                        className,
                        transition.transitionClassName,
                    ].filter(Boolean).join(" ")}
                    style={pageStyle}
                >
                    {children}
                </div>
            ) : null}
            {transition.present && !hideClose ? (
                <div
                    className={[
                        "lumia-extend-page-close",
                        transition.transitionClassName,
                    ].filter(Boolean).join(" ")}
                >
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => onChangeRef.current?.(false)}
                    >
                        <Icon name="close" size={10} />
                        <span style={{ marginLeft: 5 }}>{closeText || closeI18n}</span>
                    </Button>
                </div>
            ) : null}
        </>,
        target,
    );
}

export default ExtendPage;
