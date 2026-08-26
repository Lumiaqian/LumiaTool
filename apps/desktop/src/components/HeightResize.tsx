import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { debounce } from "lodash";
import event, { mainToolHeight } from "@/event";
import { rowStyle } from "@/components/util";

interface HeightResizeSlotProps {
    height: number;
    small: number;
    large: number;
}

interface HeightResizeOwnProps {
    children?: ReactNode | ((props: HeightResizeSlotProps) => ReactNode);
    append?: string[];
    reduce?: number;
    fatherHeight?: number;
    remove?: string[];
    ignore?: boolean;
    onResize?: (height: number) => void;
    row?: string;
}

type HeightResizeProps = HeightResizeOwnProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof HeightResizeOwnProps>;

interface ResizeInputs {
    append: string[];
    reduce: number;
    fatherHeight: number;
    remove: string[];
    ignore: boolean;
    onResize?: (height: number) => void;
}

interface SlotMetrics {
    height: number;
    small: number;
    large: number;
}

function getAbsoluteHeight(selector: string) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
        return 0;
    }

    const styles = window.getComputedStyle(element);
    return Math.ceil(
        element.offsetHeight
        + parseFloat(styles.marginTop)
        + parseFloat(styles.marginBottom),
    );
}

function HeightResize({
    children,
    append = [],
    reduce = 0,
    fatherHeight = 0,
    remove = [],
    ignore = false,
    onResize,
    row,
    className,
    style: fallthroughStyle,
    ...rest
}: HeightResizeProps) {
    const [height, setHeight] = useState("auto");
    const [metrics, setMetrics] = useState<SlotMetrics>(() => {
        const initialHeight = Number.isFinite(mainToolHeight) && mainToolHeight > 0
            ? mainToolHeight
            : window.innerHeight;
        const small = Math.min(160, Math.ceil(initialHeight * 0.4));
        return {
            height: initialHeight,
            small,
            large: initialHeight - small,
        };
    });
    const inputsRef = useRef<ResizeInputs>({
        append,
        reduce,
        fatherHeight,
        remove,
        ignore,
        onResize,
    });
    inputsRef.current = { append, reduce, fatherHeight, remove, ignore, onResize };

    const resize = useMemo(
        () => debounce(() => {
            const inputs = inputsRef.current;
            let current = inputs.fatherHeight || mainToolHeight;
            const defaultFilterBlock: string[] = [];
            const filterBlock = defaultFilterBlock
                .filter(item => !inputs.remove.includes(item))
                .concat(inputs.append || []);

            for (const block of filterBlock) {
                current -= getAbsoluteHeight(block);
            }
            if (inputs.reduce > 0) {
                current -= inputs.reduce;
            }
            if (!inputs.ignore) {
                setHeight(`${current}px`);
            }

            const small = Math.min(160, Math.ceil(current * 0.4));
            const large = current - small;
            setMetrics(previous =>
                previous.height === current
                && previous.small === small
                && previous.large === large
                    ? previous
                    : { height: current, small, large },
            );
            inputs.onResize?.(current);
            event.dispatch("component_resize");
        }, 300),
        [],
    );

    const windowResize = useCallback(() => {
        Promise.resolve().then(() => resize());
    }, [resize]);

    useEffect(() => {
        event.addListener("window_height_resize", windowResize);
        resize();

        return () => {
            event.removeListener("window_height_resize", windowResize);
            resize.cancel();
        };
    }, [resize, windowResize]);

    useEffect(() => {
        windowResize();
    });

    if (metrics.height <= 0) {
        return null;
    }

    const content = typeof children === "function"
        ? children({
            height: metrics.height,
            small: metrics.small,
            large: metrics.large,
        })
        : children;
    const style: CSSProperties = { height, ...rowStyle(row), ...fallthroughStyle };

    return (
        <div
            {...rest}
            className={["ctool-height-resize", className].filter(Boolean).join(" ")}
            style={style}
        >
            {content}
        </div>
    );
}

export default HeightResize;
