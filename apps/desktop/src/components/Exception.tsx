import type { CSSProperties, HTMLAttributes } from "react";
import { Icon } from "@/components";

interface ExceptionOwnProps {
    content?: string;
}

type ExceptionProps = ExceptionOwnProps &
    Omit<HTMLAttributes<HTMLDivElement>, keyof ExceptionOwnProps>;

const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: ".5rem",
};

const iconStyle: CSSProperties = {
    color: "var(--ctool-info-color)",
};

const textStyle: CSSProperties = {
    color: "var(--ctool-info-color)",
    fontSize: ".875rem",
};

function Exception({ content = "", style, ...rest }: ExceptionProps) {
    return (
        <div {...rest} style={{ ...containerStyle, ...style }}>
            <Icon
                name={content !== "" ? "error" : "empty"}
                size="2rem"
                style={iconStyle}
            />
            <div style={textStyle}>{content ? content : $t("main_ui_null")}</div>
        </div>
    );
}

export default Exception;
