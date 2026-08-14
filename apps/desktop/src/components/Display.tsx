import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Button, Icon, Tooltip } from "@/components";
import type { ButtonType, DisplayPosition } from "@/types";

interface DisplayOwnProps {
    children?: ReactNode;
    extra?: ReactNode;
    position?: DisplayPosition;
    toggle?: boolean;
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
    text?: string;
    enable?: boolean;
    type?: ButtonType;
    onClick?: () => void;
}

type DisplayProps = DisplayOwnProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof DisplayOwnProps>;

interface ExtraSize {
    width: number;
    height: number;
}

function Display({
    children,
    extra,
    position = "bottom-right",
    toggle = false,
    bottom = 5,
    left = 5,
    right = 5,
    top = 5,
    text = "",
    enable = true,
    type = "primary",
    onClick,
    className,
    ...rest
}: DisplayProps) {
    const extraRef = useRef<HTMLSpanElement | null>(null);
    const [extraSize, setExtraSize] = useState<ExtraSize>({ width: 0, height: 0 });
    const [isShowExtra, setIsShowExtra] = useState(true);
    const hasExtraSlot = extra !== undefined;
    const isEnabled = enable && (text !== "" || hasExtraSlot);

    useLayoutEffect(() => {
        const element = extraRef.current;
        if (!element) {
            return;
        }

        const width = element.offsetWidth;
        const height = element.offsetHeight;
        setExtraSize(current =>
            current.width === width && current.height === height ? current : { width, height },
        );
    });

    const extraStyle = useMemo<CSSProperties>(() => {
        const css: CSSProperties = {
            position: "absolute",
            backgroundColor: "var(--el-bg-color)",
            display: "inline-flex",
        };

        switch (position) {
            case "bottom-left":
                css.bottom = `${bottom}px`;
                css.left = `${left}px`;
                break;
            case "bottom-center":
                css.bottom = `${bottom}px`;
                css.left = `calc(50% - ${extraSize.width / 2}px)`;
                break;
            case "top-right":
                css.top = `${top}px`;
                css.right = `${right}px`;
                break;
            case "top-left":
                css.top = `${top}px`;
                css.left = `${left}px`;
                break;
            case "top-center":
                css.top = `${top}px`;
                css.left = `calc(50% - ${extraSize.width / 2}px)`;
                break;
            case "left-center":
                css.left = `${left}px`;
                css.top = `calc(50% - ${extraSize.height / 2}px)`;
                break;
            case "right-center":
                css.right = `${right}px`;
                css.top = `calc(50% - ${extraSize.height / 2}px)`;
                break;
            case "center":
                css.left = `calc(50% - ${extraSize.width / 2}px)`;
                css.top = `calc(50% - ${extraSize.height / 2}px)`;
                break;
            default:
                css.bottom = `${bottom}px`;
                css.right = `${right}px`;
        }

        return css;
    }, [bottom, extraSize.height, extraSize.width, left, position, right, top]);


    const isToggle = toggle && extraSize.width > 0;
    const toggleLabel = $t(
        isShowExtra
            ? "component_display_fold_option"
            : "component_display_expand_option",
    );
    const toggleControl = (
        <Tooltip content={toggleLabel}>
            <button
                type="button"
                className="ctool-display-toggle"
                aria-expanded={isShowExtra}
                aria-label={toggleLabel}
                onClick={() => setIsShowExtra(current => !current)}
            >
                <Icon size={10} name="toggle" hover aria-hidden="true" />
            </button>
        </Tooltip>
    );

    return (
        <div
            {...rest}
            className={["ctool-display", className].filter(Boolean).join(" ")}
        >
            {children}
            {isEnabled && (
                <div style={extraStyle}>
                    <span
                        ref={extraRef}
                        className={[
                            "ctool-display-extra",
                            `ctool-display-extra-${position}`,
                            position.includes("right") ? "ctool-display-extra-right" : "",
                            position.includes("left") ? "ctool-display-extra-left" : "",
                            `ctool-display-extra-${isShowExtra ? "show" : "hide"}`,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {isToggle && position.includes("right") ? toggleControl : null}
                        {isShowExtra
                            ? hasExtraSlot
                                ? extra
                                : text !== ""
                                  ? <Button type={type} size="small" onClick={() => onClick?.()}>{text}</Button>
                                  : null
                            : null}
                        {isToggle && position.includes("left") ? toggleControl : null}
                    </span>
                </div>
            )}
        </div>
    );
}

export default Display;
