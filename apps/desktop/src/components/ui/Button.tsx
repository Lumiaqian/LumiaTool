import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonType, ComponentSizeType } from "@/types";
import Tooltip from "./Tooltip";

type NativeButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "disabled" | "onClick" | "size" | "type"
>;

export interface ButtonProps extends NativeButtonProps {
    type?: ButtonType;
    size?: ComponentSizeType;
    text?: string;
    long?: boolean;
    disabled?: boolean;
    loading?: boolean;
    tooltip?: string;
    children?: ReactNode;
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

export default function Button({
    type = "general",
    size = "default",
    text = "",
    long = false,
    disabled = false,
    loading = false,
    tooltip = "",
    children,
    onClick,
    ...buttonProps
}: ButtonProps) {
    return (
        <Tooltip content={tooltip}>
            <div
                className="ctool-button"
                data-size={size}
                data-type={type}
                style={long ? { width: "100%" } : {}}
            >
                <button
                    {...buttonProps}
                    onClick={onClick}
                    disabled={disabled}
                    aria-busy={loading ? "true" : "false"}
                >
                    {children ?? text}
                </button>
            </div>
        </Tooltip>
    );
}
