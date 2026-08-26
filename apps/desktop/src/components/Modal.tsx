import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DialogHTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Link } from "@/components";
import type { ModalFooterType } from "@/types";
import Align from "./Align";
import { sizeConvert } from "./util";

interface ModalOwnProps {
    children?: ReactNode;
    footer?: ReactNode;
    value?: boolean;
    onChange?: (value: boolean) => void;
    title?: string;
    width?: number | string;
    padding?: string;
    footerType?: ModalFooterType;
    loading?: boolean;
    onOk?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
}

type ModalProps = ModalOwnProps &
    Omit<DialogHTMLAttributes<HTMLDialogElement>, keyof ModalOwnProps>;

interface ArticlePresence {
    present: boolean;
    transitionClassName: string;
}

function useArticlePresence(show: boolean): ArticlePresence {
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
            setTransitionClassName("ctool-modal-enter-active ctool-modal-enter-from");
            frame = window.requestAnimationFrame(() => {
                setTransitionClassName("ctool-modal-enter-active");
                timer = setTimeout(() => setTransitionClassName(""), 300);
            });
        } else if (presentRef.current) {
            setTransitionClassName("ctool-modal-leave-active ctool-modal-leave-to");
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

type ModalStyle = CSSProperties & {
    "--ctool-modal-margin": string;
};

function Modal({
    children,
    footer,
    value = false,
    onChange,
    title = "",
    width = "60%",
    padding = "5px 10px",
    footerType = "none",
    loading = false,
    onOk,
    onCancel,
    onClose,
    className,
    style: fallthroughStyle,
    ...rest
}: ModalProps) {
    const containerRef = useRef<HTMLDialogElement | null>(null);
    const onChangeRef = useRef(onChange);
    const onCloseRef = useRef(onClose);
    onChangeRef.current = onChange;
    onCloseRef.current = onClose;
    const articlePresence = useArticlePresence(value);

    const clickClose = useCallback((event: MouseEvent) => {
        const article = containerRef.current?.querySelector("article");
        const target = event.target;
        if (!(target instanceof Node) || !article?.contains(target)) {
            onChangeRef.current?.(false);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        let timer: ReturnType<typeof setTimeout>;
        if (value) {
            container.show();
            timer = setTimeout(() => {
                if (containerRef.current) {
                    document.addEventListener("click", clickClose);
                }
            }, 300);
        } else {
            timer = setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.close();
                    onCloseRef.current?.();
                }
            }, 300);
            document.removeEventListener("click", clickClose);
        }

        return () => {
            clearTimeout(timer);
            document.removeEventListener("click", clickClose);
        };
    }, [clickClose, value]);

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onChangeRef.current?.(false);
            }
        };
        document.addEventListener("keydown", keydown);
        return () => document.removeEventListener("keydown", keydown);
    }, []);

    const modalStyle = useMemo<ModalStyle>(() => ({
        "--ctool-modal-margin": padding,
        ...fallthroughStyle,
    }), [fallthroughStyle, padding]);

    const target = typeof document === "undefined"
        ? null
        : document.querySelector("#ctool-append");
    if (!target) {
        return null;
    }

    const hasFooterSlot = footer !== undefined;

    return createPortal(
        <dialog
            {...rest}
            className={["ctool-modal", className].filter(Boolean).join(" ")}
            ref={containerRef}
            style={modalStyle}
        >
            {articlePresence.present ? (
                <article
                    className={articlePresence.transitionClassName || undefined}
                    style={{ width: sizeConvert(width) }}
                >
                    {title !== "" ? (
                        <header>
                            <span>{title}</span>
                            <Link
                                aria-label={$t("main_ui_close")}
                                className="close"
                                onClick={() => onChangeRef.current?.(false)}
                            />
                        </header>
                    ) : null}
                    <main>{children}</main>
                    {hasFooterSlot || footerType !== "none" ? (
                        <footer>
                            {hasFooterSlot ? footer : (
                                <>
                                    {footerType === "normal" ? (
                                        <Align>
                                            <Button
                                                type="general"
                                                onClick={() => {
                                                    onChangeRef.current?.(false);
                                                    onCancel?.();
                                                }}
                                                text={$t("main_ui_cancel")}
                                            />
                                            <Button
                                                loading={loading}
                                                type="primary"
                                                onClick={() => onOk?.()}
                                                text={$t("main_ui_ok")}
                                            />
                                        </Align>
                                    ) : null}
                                    {footerType === "long" ? (
                                        <Button
                                            loading={loading}
                                            type="primary"
                                            long
                                            onClick={() => onOk?.()}
                                            text={$t("main_ui_ok")}
                                        />
                                    ) : null}
                                </>
                            )}
                        </footer>
                    ) : null}
                </article>
            ) : null}
        </dialog>,
        target,
    );
}

export default Modal;
