import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { sizeConvert } from "../util";
import type { ComponentSizeType } from "@/types";
import event from "@/event";

type CSSVariableProperties = CSSProperties & {
    [key: `--${string}`]: string | number | undefined;
};

type NativeInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "children"
    | "disabled"
    | "onChange"
    | "onLoad"
    | "placeholder"
    | "prefix"
    | "readOnly"
    | "size"
    | "type"
    | "value"
    | "width"
>;

export interface InputProps extends NativeInputProps {
    value?: string;
    placeholder?: string;
    width?: number | string;
    size?: ComponentSizeType;
    label?: string;
    type?: "text" | "number";
    disabled?: boolean;
    readonly?: boolean;
    readOnly?: boolean;
    center?: boolean;
    disableClear?: boolean;
    prepend?: ReactNode;
    prefix?: ReactNode;
    suffix?: ReactNode;
    append?: ReactNode;
    onChange?: (value: string) => void;
    onLoad?: (value: HTMLInputElement) => void;
}

function Input({
    value = "",
    placeholder = "",
    width = "",
    size = "default",
    label = "",
    type = "text",
    disabled = false,
    readonly = false,
    readOnly,
    center = false,
    disableClear = false,
    prepend,
    prefix,
    suffix,
    append,
    onChange,
    onLoad,
    style: passedInputStyle,
    ...inputProps
}: InputProps) {
    const generatedInputId = useId();
    const containerRef = useRef<HTMLInputElement>(null);
    const inputLeftRef = useRef<HTMLDivElement>(null);
    const inputRightRef = useRef<HTMLDivElement>(null);
    const onLoadRef = useRef(onLoad);
    const [inputLeftWidth, setInputLeftWidth] = useState(0);
    const [inputRightWidth, setInputRightWidth] = useState(0);

    onLoadRef.current = onLoad;

    const updatePadding = useCallback(() => {
        const inputLeft = inputLeftRef.current;
        const inputRight = inputRightRef.current;
        if (!inputLeft || !inputRight) {
            return;
        }

        const nextLeftWidth = inputLeft.offsetWidth;
        const nextRightWidth = inputRight.offsetWidth;
        setInputLeftWidth(current => (current === nextLeftWidth ? current : nextLeftWidth));
        setInputRightWidth(current => (current === nextRightWidth ? current : nextRightWidth));
    }, []);

    useLayoutEffect(() => {
        updatePadding();
    });

    useEffect(() => {
        event.addListener("component_resize", updatePadding);
        return () => {
            event.removeListener("component_resize", updatePadding);
        };
    }, [updatePadding]);

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

    useEffect(() => {
        if (containerRef.current) {
            onLoadRef.current?.(containerRef.current);
        }
    }, []);

    const rootStyle: CSSVariableProperties = {};
    if (width !== "") {
        rootStyle.width = sizeConvert(width);
    }
    if (inputLeftWidth) {
        rootStyle["--ctool-input-left-padding"] = `${inputLeftWidth}px`;
    }
    if (inputRightWidth) {
        rootStyle["--ctool-input-right-padding"] = `${inputRightWidth}px`;
    }

    const inputStyle: CSSProperties = {
        ...passedInputStyle,
    };
    if (center) {
        inputStyle.textAlign = "center";
    }

    const hasPrepend = prepend !== undefined;
    const hasPrefix = prefix !== undefined;
    const hasSuffix = suffix !== undefined;
    const hasAppend = append !== undefined;
    const inputId = inputProps.id ?? generatedInputId;
    const accessibleLabel = label || placeholder || "Input";
    const hasVisibleLabel = label !== "" && !hasPrepend;
    const ariaLabel = hasVisibleLabel
        ? inputProps["aria-label"]
        : inputProps["aria-label"] ?? accessibleLabel;

    return (
        <div
            className="ctool-input"
            style={rootStyle}
            data-size={size}
            data-disabled={disabled ? "y" : "n"}
        >
            <input
                {...inputProps}
                id={inputId}
                aria-label={ariaLabel}
                autoComplete={inputProps.autoComplete ?? "off"}
                ref={containerRef}
                value={value}
                placeholder={placeholder}
                style={inputStyle}
                disabled={disabled}
                readOnly={readOnly ?? readonly}
                type={type}
                onChange={changeEvent => onChange?.(changeEvent.target.value)}
            />
            <div className="ctool-input-left" ref={inputLeftRef}>
                {(hasPrefix || label !== "" || hasPrepend) && (
                    <>
                        {(hasPrepend || label !== "") && (
                            hasPrepend ? (
                                <div
                                    className={`ctool-input-prepend${label !== "" ? " ctool-input-label" : ""}`}
                                >
                                    {prepend}
                                </div>
                            ) : (
                                <label
                                    htmlFor={inputId}
                                    className="ctool-input-prepend ctool-input-label"
                                >
                                    {label}
                                </label>
                            )
                        )}
                        {hasPrefix && <div className="ctool-input-prefix">{prefix}</div>}
                    </>
                )}
            </div>
            <div className="ctool-input-right" ref={inputRightRef}>
                {(hasSuffix || hasAppend) && (
                    <>
                        {hasSuffix && <div className="ctool-input-suffix">{suffix}</div>}
                        {hasAppend && <div className="ctool-input-append">{append}</div>}
                    </>
                )}
            </div>
        </div>
    );
}

export default Input;
