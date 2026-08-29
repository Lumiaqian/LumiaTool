import { useEffect, useMemo, useRef } from "react";
import type {
    ComponentPropsWithoutRef,
    CSSProperties,
    ReactNode,
} from "react";
import { componentResizeDispatch } from "@/event";
import { sizeConvert } from "../util";

export interface CardProps
    extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
    title?: string;
    padding?: string;
    height?: number | string;
    extra?: ReactNode;
    children?: ReactNode;
}

function Card({
    title = "",
    padding = "5px",
    height = "",
    extra,
    children,
    className,
    style: externalStyle,
    ...restProps
}: CardProps) {
    const bodyRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const body = bodyRef.current;
        if (!body) {
            return;
        }

        body.addEventListener("scroll", componentResizeDispatch);
        return () => {
            body.removeEventListener("scroll", componentResizeDispatch);
        };
    }, []);

    const cardStyle = useMemo<CSSProperties>(() => {
        const computedStyle: CSSProperties = {};

        if (height) {
            computedStyle.height = sizeConvert(height);
        }
        if (title === "") {
            computedStyle.gridTemplateRows = "minmax(0px, 1fr)";
        }

        return {
            ...computedStyle,
            ...externalStyle,
        };
    }, [externalStyle, height, title]);

    return (
        <div
            {...restProps}
            className={className ? `lumia-card ${className}` : "lumia-card"}
            style={cardStyle}
        >
            {title !== "" && (
                <div className="lumia-card-header">
                    <div className="lumia-card-title">{title}</div>
                    <div className="lumia-card-extra">{extra}</div>
                </div>
            )}
            <div
                className="lumia-card-body"
                style={{ padding: `${padding}` }}
                ref={bodyRef}
            >
                {children}
            </div>
        </div>
    );
}

export default Card;
