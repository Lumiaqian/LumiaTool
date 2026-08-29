import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import event from "@/event";
import type { ComponentSizeType } from "@/types";

type ColorStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface ColorProps extends Omit<HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
    value?: string;
    size?: ComponentSizeType;
    disabled?: boolean;
    label?: string;
    onChange?: (value: string) => void;
}

const Color = ({
    value = "#666666",
    size = "default",
    disabled = false,
    label = "",
    onChange,
    className,
    style: nativeStyle,
    ...nativeProps
}: ColorProps) => {
    const inputLeft = useRef<HTMLDivElement>(null);
    const [inputLeftWidth, setInputLeftWidth] = useState(0);

    const updatePadding = useCallback(() => {
        if (inputLeft.current) {
            setInputLeftWidth(inputLeft.current.offsetWidth);
        }
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

    const style: ColorStyle = { ...nativeStyle };
    if (inputLeftWidth) {
        style["--lumia-color-left-padding"] = `${inputLeftWidth}px`;
    }

    return (
        <div
            {...nativeProps}
            className={["lumia-color", className].filter(Boolean).join(" ")}
            data-size={size}
            style={style}
        >
            <input
                type="color"
                value={value}
                disabled={disabled}
                onChange={(changeEvent) => onChange?.(changeEvent.currentTarget.value)}
            />
            <div className="lumia-color-left" ref={inputLeft}>
                {label !== "" ? (
                    <div className="lumia-color-prepend lumia-input-label">
                        {label}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Color;
