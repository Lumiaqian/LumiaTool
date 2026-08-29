import { useMemo } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { AlignDirection, AlignHorizontal, AlignSize, AlignVertical } from "@/types";
import { rowStyle, sizeConvert } from "@/components/util";

interface AlignOwnProps {
    children?: ReactNode;
    gap?: AlignSize;
    top?: AlignSize;
    bottom?: AlignSize;
    direction?: AlignDirection;
    horizontal?: AlignHorizontal;
    vertical?: AlignVertical;
    width?: number | string;
    height?: number | string;
    row?: string;
}

type AlignProps = AlignOwnProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof AlignOwnProps>;

const sizeLists = { small: "3px", large: "10px", default: "5px" };
const justify: Record<string, "flex-start" | "flex-end" | "center"> = {
    left: "flex-start",
    top: "flex-start",
    right: "flex-end",
    bottom: "flex-end",
    center: "center",
};

function Align({
    children,
    gap = "default",
    top = "none",
    bottom = "none",
    direction = "horizontal",
    horizontal = "none",
    vertical = "none",
    width = "",
    height = "",
    row,
    className,
    style: fallthroughStyle,
    ...rest
}: AlignProps) {
    const style = useMemo<CSSProperties>(() => {
        const css: CSSProperties = {
            display: "inline-flex",
            gap: gap === "none" ? "unset" : sizeConvert(gap, sizeLists),
            marginTop: top === "none" ? "unset" : sizeConvert(top, sizeLists),
            marginBottom: bottom === "none" ? "unset" : sizeConvert(bottom, sizeLists),
            justifyContent: "unset",
            flexWrap: "wrap",
            alignItems: "unset",
            flexDirection: direction === "horizontal" ? "row" : "column",
            height: "unset",
            width: "unset",
        };

        if (direction === "horizontal") {
            css.justifyContent = justify[horizontal] ?? "unset";
            css.alignItems = justify[vertical] ?? "center";
        }
        if (direction === "vertical") {
            css.alignItems = justify[horizontal] ?? "unset";
            css.justifyContent = justify[vertical] ?? "unset";
        }

        if (horizontal === "center" || direction === "vertical") {
            css.width = "100%";
        }
        if (vertical === "center") {
            css.height = "100%";
        }
        if (width !== "") {
            css.width = sizeConvert(width);
        }
        if (height !== "") {
            css.height = sizeConvert(height);
        }

        return { ...css, ...rowStyle(row) };
    }, [bottom, direction, gap, height, horizontal, row, top, vertical, width]);

    return (
        <div
            {...rest}
            className={["lumia-align", className].filter(Boolean).join(" ")}
            style={{ ...style, ...fallthroughStyle }}
        >
            {children}
        </div>
    );
}

export default Align;
