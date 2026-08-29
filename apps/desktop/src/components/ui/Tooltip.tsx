import {
    Children,
    Fragment,
    cloneElement,
    isValidElement,
    useId,
    useLayoutEffect,
    useRef,
} from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { useTheme } from "@/store/setting";

type TooltipElementProps = {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
} & Record<string, unknown>;

export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "content"> {
    content?: string;
    children: ReactNode;
}

function Tooltip({ content = "", children, ...restProps }: TooltipProps) {
    const storeTheme = useTheme();
    const tooltipRef = useRef<TippyInstance | undefined>(undefined);
    const reactId = useId();
    const marker = `lumia-tooltip-${reactId}`;
    const theme = storeTheme.theme.raw === "dark" ? "light" : "dark";

    let marked = false;
    const markFirstElement = (nodes: ReactNode): ReactNode =>
        Children.map(nodes, child => {
            if (marked || !isValidElement<TooltipElementProps>(child)) {
                return child;
            }

            if (child.type === Fragment) {
                return cloneElement(child, {
                    children: markFirstElement(child.props.children),
                });
            }

            marked = true;
            const className = [child.props.className, restProps.className].filter(Boolean).join(" ") || undefined;
            const style = {
                ...child.props.style,
                ...restProps.style,
            };

            return cloneElement(child, {
                ...restProps,
                className,
                style,
                "data-lumia-tooltip-id": marker,
            });
        });

    const renderedChildren = markFirstElement(children);

    useLayoutEffect(() => {
        const target = document.querySelector<HTMLElement>(`[data-lumia-tooltip-id="${marker}"]`);
        if (!target) {
            return;
        }

        const tooltip = tippy(target, {
            animation: "scale",
            content: "",
        });
        tooltipRef.current = tooltip;

        return () => {
            tooltip.destroy();
            if (tooltipRef.current === tooltip) {
                tooltipRef.current = undefined;
            }
        };
    }, [marker]);

    useLayoutEffect(() => {
        const tooltip = tooltipRef.current;
        if (!tooltip) {
            return;
        }

        tooltip.setProps({
            content,
            theme,
        });

        if (content !== "") {
            tooltip.enable();
        } else {
            tooltip.disable();
        }
    }, [content, theme]);

    return <>{renderedChildren}</>;
}

export default Tooltip;
