import { useCallback, useEffect, useMemo } from "react";
import type { HTMLAttributes } from "react";
import type { ButtonType, DisplayPosition } from "@/types";
import { sizeConvert } from "@/components/util";
import event from "@/event";
import Display from "../Display";

type NativeContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange">;

export interface TextareaProps extends NativeContainerProps {
    value?: string;
    placeholder?: string;
    height?: number | string;
    copy?: boolean | string;
    floatText?: string;
    floatPosition?: DisplayPosition;
    floatType?: ButtonType;
    disabled?: boolean;
    readonly?: boolean;
    readOnly?: boolean;
    disableClear?: boolean;
    onChange?: (value: string) => void;
    onClickFloatText?: () => void;
}

function Textarea({
    value = "",
    placeholder = "",
    height = "",
    copy = false,
    floatText = "",
    floatPosition = "bottom-right",
    floatType = "primary",
    disabled = false,
    readonly = false,
    readOnly,
    disableClear = false,
    onChange,
    onClickFloatText,
    className,
    style,
    ...containerProps
}: TextareaProps) {
    useEffect(() => {
        if (disableClear) {
            return;
        }

        const clearContent = () => onChange?.("");
        event.addListener("content_clear", clearContent);
        return () => {
            event.removeListener("content_clear", clearContent);
        };
    }, [disableClear, onChange]);

    const floatButtonText = useMemo(() => {
        if (floatText !== "") {
            return floatText;
        }
        if (copy !== false) {
            return copy === true ? $t("main_ui_copy") : copy;
        }
        return "";
    }, [copy, floatText]);

    const clickFloatText = useCallback(() => {
        if (floatText !== "") {
            onClickFloatText?.();
            return;
        }
        if (copy !== false) {
            $copy(value);
        }
    }, [copy, floatText, onClickFloatText, value]);

    return (
        <div
            {...containerProps}
            className={["ctool-textarea", className].filter(Boolean).join(" ")}
            style={{ height: sizeConvert(height), ...style }}
            data-disabled={disabled ? "y" : "n"}
        >
            <Display
                enable={floatButtonText !== ""}
                position={floatPosition}
                type={floatType}
                text={floatButtonText}
                onClick={clickFloatText}
                style={{ height: "100%" }}
            >
                <textarea
                    style={{ resize: "none" }}
                    disabled={disabled}
                    readOnly={readOnly ?? readonly}
                    placeholder={placeholder}
                    value={value}
                    onChange={changeEvent => onChange?.(changeEvent.target.value)}
                />
            </Display>
        </div>
    );
}

export default Textarea;
