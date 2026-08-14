import { useState } from "react";
import type { ComponentSizeType } from "@/types";
import { uuid } from "@/lib/util";

export interface BoolProps {
    value?: boolean;
    border?: boolean;
    disabled?: boolean;
    size?: ComponentSizeType;
    label?: string;
    onChange?: (value: boolean) => void;
}

export default function Bool({
    value = false,
    border = false,
    disabled = false,
    size = "default",
    label = "",
    onChange,
}: BoolProps) {
    const [key] = useState(() => `ctool-bool-key-${uuid()}`);

    return (
        <div
            className="ctool-bool"
            data-size={size}
            data-border={border ? "y" : "n"}
            data-checked={value ? "y" : "n"}
            data-disabled={disabled ? "y" : "n"}
        >
            <label htmlFor={key}>
                <input
                    type="checkbox"
                    id={key}
                    name={key}
                    disabled={disabled}
                    checked={value}
                    onChange={(event) => onChange?.(event.currentTarget.checked)}
                />
                {label}
            </label>
        </div>
    );
}
