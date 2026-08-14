import type { AnchorHTMLAttributes, ReactNode } from "react";
import { openUrl } from "@/lib/helper";
import type { LinkType } from "@/types";
import Tooltip from "./Tooltip";

type NativeAnchorProps = Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "children" | "href" | "onClick" | "type"
>;

export interface LinkProps extends NativeAnchorProps {
    href?: string;
    type?: LinkType;
    tooltip?: string;
    children?: ReactNode;
    onClick?: () => void;
}

function Link({
    href = "",
    type = "default",
    tooltip = "",
    children,
    onClick,
    className,
    ...anchorProps
}: LinkProps) {
    const click = () => {
        if (href !== "") {
            openUrl(href);
        }
        onClick?.();
    };

    return (
        <Tooltip content={tooltip}>
            <a
                {...anchorProps}
                className={["ctool-link", className].filter(Boolean).join(" ")}
                data-type={type}
                onClick={click}
            >
                {children}
            </a>
        </Tooltip>
    );
}

export default Link;
