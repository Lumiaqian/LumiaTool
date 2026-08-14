import {
    createElement,
    useEffect,
    useMemo,
    useState,
} from "react";
import type {
    CSSProperties,
    HTMLAttributes,
    MouseEventHandler,
    ReactNode,
} from "react";
import { iconData } from "@/generated/data";
import Tooltip from "./Tooltip";

type IconName = keyof typeof iconData & string;
type SvgStyle = CSSProperties & Record<`--${string}`, string | number>;
type DataRecord = Record<string, unknown>;

export interface IconProps extends Omit<HTMLAttributes<HTMLElement>, "color" | "onClick"> {
    name?: IconName | "";
    color?: string;
    reverse?: boolean;
    hover?: boolean;
    highlight?: boolean;
    size?: string | number;
    tooltip?: string;
    rotate?: number;
    onClick?: () => void;
}

const SVG_ATTRIBUTE_NAMES: Record<string, string> = {
    class: "className",
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "marker-end": "markerEnd",
    "marker-mid": "markerMid",
    "marker-start": "markerStart",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    tabindex: "tabIndex",
    "text-anchor": "textAnchor",
    "vector-effect": "vectorEffect",
    "xlink:href": "xlinkHref",
    "xml:space": "xmlSpace",
};

const isRecord = (value: unknown): value is DataRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const camelCaseCssName = (name: string): string => {
    if (name.startsWith("--")) {
        return name;
    }
    return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
};

const parseStyle = (value: string): Record<string, string> => {
    const style: Record<string, string> = {};
    for (const declaration of value.split(";")) {
        const separator = declaration.indexOf(":");
        if (separator === -1) {
            continue;
        }
        const property = declaration.slice(0, separator).trim();
        const propertyValue = declaration.slice(separator + 1).trim();
        if (property && propertyValue) {
            style[camelCaseCssName(property)] = propertyValue;
        }
    }
    return style;
};

const domNodeToReact = (
    node: Node,
    key: string,
    root: Element,
    rootStyle: CSSProperties,
    rootClick: MouseEventHandler<SVGSVGElement>,
): ReactNode => {
    if (node.nodeType === 3) {
        return node.textContent;
    }
    if (node.nodeType !== 1) {
        return null;
    }

    const element = node as Element;
    const props: Record<string, unknown> = { key };
    for (const attribute of Array.from(element.attributes)) {
        const attributeName = SVG_ATTRIBUTE_NAMES[attribute.name] ?? attribute.name;
        props[attributeName] = attribute.name === "style"
            ? parseStyle(attribute.value)
            : attribute.value;
    }

    if (element === root) {
        const sourceStyle = isRecord(props.style) ? props.style : {};
        props.style = { ...sourceStyle, ...rootStyle };
        props.onClick = rootClick;
        if (props.width === undefined) {
            props.width = "100%";
        }
        if (props.height === undefined) {
            props.height = "100%";
        }
    }

    const children = Array.from(element.childNodes).map((child, index) =>
        domNodeToReact(child, `${key}-${index}`, root, rootStyle, rootClick),
    );
    return createElement(element.tagName.toLowerCase(), props, ...children);
};

const parseSvgMarkup = (
    markup: string,
    style: CSSProperties,
    onClick: MouseEventHandler<SVGSVGElement>,
): ReactNode => {
    const source = markup.trim().startsWith("<svg")
        ? markup
        : `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
    const document = new DOMParser().parseFromString(source, "image/svg+xml");
    const root = document.documentElement;
    if (root.tagName.toLowerCase() === "parsererror") {
        return null;
    }
    return domNodeToReact(root, "svg-root", root, style, onClick);
};

interface MarkupSvgProps {
    markup: string;
    style: CSSProperties;
    onClick: MouseEventHandler<SVGSVGElement>;
}

const MarkupSvg = ({ markup, style, onClick }: MarkupSvgProps) => {
    const [content, setContent] = useState<ReactNode>(null);

    useEffect(() => {
        setContent(parseSvgMarkup(markup, style, onClick));
    }, [markup, onClick, style]);

    return content;
};

const stringProperty = (record: DataRecord, property: string): string | undefined => {
    const value = record[property];
    return typeof value === "string" || typeof value === "number"
        ? String(value)
        : undefined;
};

const renderPath = (path: unknown, key: string): ReactNode => {
    if (typeof path === "string") {
        return <path key={key} d={path} />;
    }
    if (!isRecord(path)) {
        return null;
    }

    const d = stringProperty(path, "d") ?? stringProperty(path, "path");
    if (!d) {
        return null;
    }

    return (
        <path
            key={key}
            d={d}
            fill={stringProperty(path, "fill")}
            stroke={stringProperty(path, "stroke")}
            fillRule={stringProperty(path, "fillRule") as "evenodd" | "nonzero" | undefined}
            clipRule={stringProperty(path, "clipRule") as "evenodd" | "nonzero" | undefined}
            strokeWidth={stringProperty(path, "strokeWidth")}
            strokeLinecap={stringProperty(path, "strokeLinecap") as "butt" | "round" | "square" | "inherit" | undefined}
            strokeLinejoin={stringProperty(path, "strokeLinejoin") as "round" | "inherit" | "miter" | "bevel" | undefined}
            opacity={stringProperty(path, "opacity")}
            transform={stringProperty(path, "transform")}
        />
    );
};

interface SvgIconProps {
    data: unknown;
    style: CSSProperties;
    onClick: MouseEventHandler<SVGSVGElement>;
}

const SvgIcon = ({ data, style, onClick }: SvgIconProps) => {
    if (typeof data === "string") {
        if (data.trim().startsWith("<")) {
            return <MarkupSvg markup={data} style={style} onClick={onClick} />;
        }
        return (
            <svg width="100%" height="100%" viewBox="0 0 1024 1024" style={style} onClick={onClick}>
                <path d={data} />
            </svg>
        );
    }

    if (Array.isArray(data)) {
        return (
            <svg width="100%" height="100%" viewBox="0 0 1024 1024" style={style} onClick={onClick}>
                {data.map((path, index) => renderPath(path, `path-${index}`))}
            </svg>
        );
    }

    if (!isRecord(data)) {
        return null;
    }

    const markup = stringProperty(data, "svg")
        ?? stringProperty(data, "body")
        ?? stringProperty(data, "content");
    if (markup?.trim().startsWith("<")) {
        return <MarkupSvg markup={markup} style={style} onClick={onClick} />;
    }

    const attributes = isRecord(data.attributes) ? data.attributes : {};
    const box = Array.isArray(data.box) ? data.box : undefined;
    const viewBox = stringProperty(data, "viewBox")
        ?? stringProperty(attributes, "viewBox")
        ?? (box?.length === 4 ? box.join(" ") : "0 0 1024 1024");
    const paths = Array.isArray(data.paths)
        ? data.paths
        : Array.isArray(data.data)
            ? data.data
            : [data.path ?? data.d];

    return (
        <svg width="100%" height="100%" viewBox={viewBox} style={style} onClick={onClick}>
            {paths.map((path, index) => renderPath(path, `path-${index}`))}
        </svg>
    );
};

const Icon = ({
    name = "",
    color = "",
    reverse = false,
    hover = false,
    highlight = false,
    size = 0,
    tooltip = "",
    rotate = 0,
    className,
    style: outerStyle,
    onClick,
    ...nativeProps
}: IconProps) => {
    const classes = [
        "ctool-icon",
        reverse ? "ctool-icon-reverse" : "",
        hover ? "ctool-icon-hover" : "",
        highlight ? "ctool-icon-highlight" : "",
        className ?? "",
    ].filter(Boolean).join(" ");

    const iconStyle = useMemo<CSSProperties>(() => {
        const nextStyle: CSSProperties = {};
        if (color) {
            nextStyle.color = color;
        }
        if (rotate) {
            nextStyle.transform = `rotate(${rotate}deg)`;
        }
        return nextStyle;
    }, [color, rotate]);

    const wrapperStyle: SvgStyle = { ...outerStyle };
    if (size) {
        wrapperStyle["--font-size"] = typeof size === "number" ? `${size}px` : size;
    }

    const handleClick: MouseEventHandler<SVGSVGElement> = () => {
        onClick?.();
    };
    const data = name
        ? (iconData as unknown as Record<string, unknown>)[name]
        : undefined;

    return (
        <Tooltip content={tooltip}>
            <i {...nativeProps} className={classes} style={wrapperStyle}>
                {data !== undefined && data !== null ? (
                    <SvgIcon data={data} style={iconStyle} onClick={handleClick} />
                ) : null}
            </i>
        </Tooltip>
    );
};

export default Icon;
