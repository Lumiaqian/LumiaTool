import type { ReactNode } from "react";
import { toNumber } from "lodash";
import Input from "./Input";

export interface InputNumberProps {
    value?: number;
    step?: number | string;
    min?: number | boolean;
    max?: number | boolean;
    width?: number | string;
    size?: import("@/types").ComponentSizeType;
    label?: string;
    center?: boolean;
    disabled?: boolean;
    prepend?: ReactNode;
    append?: ReactNode;
    suffix?: ReactNode;
    prefix?: ReactNode;
    onChange?: (value: number) => void;
}

export default function InputNumber({
    value = 1,
    step = "any",
    min = 0,
    max = false,
    width,
    size,
    label,
    center,
    disabled,
    prepend,
    append,
    suffix,
    prefix,
    onChange,
}: InputNumberProps) {
    return (
        <Input
            value={`${value}`}
            type="number"
            max={typeof max === "number" ? max : undefined}
            min={typeof min === "number" ? min : undefined}
            step={step}
            width={width}
            size={size}
            label={label}
            center={center}
            disabled={disabled}
            prepend={prepend}
            append={append}
            suffix={suffix}
            prefix={prefix}
            onChange={(nextValue) => onChange?.(toNumber(`${nextValue}`))}
        />
    );
}
