import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Icon, Tooltip } from "@/components";
import { openUrl } from "@/lib/helper";
import type { IconType } from "@/lib/icon";

interface HelpTipOwnProps {
    children?: ReactNode;
    link?: string;
    icon?: IconType;
    iconSize?: string | number;
    text?: string;
    onClick?: () => void;
}

type TooltipFallthroughProps = Omit<
    ComponentPropsWithoutRef<typeof Tooltip>,
    keyof HelpTipOwnProps | "children" | "content"
>;

type HelpTipProps = HelpTipOwnProps & TooltipFallthroughProps;

function HelpTip({
    children,
    link = "",
    icon = "question",
    iconSize = 14,
    text,
    onClick,
    ...rest
}: HelpTipProps) {
    const [defaultText] = useState(() => $t("component_click_help"));
    const handleClick = () => {
        if (link !== "") {
            openUrl(link);
        }
        onClick?.();
    };

    return (
        <Tooltip {...rest} content={text ?? defaultText}>
            {children !== undefined
                ? children
                : <Icon onClick={handleClick} hover name={icon} size={iconSize} />}
        </Tooltip>
    );
}

export default HelpTip;
