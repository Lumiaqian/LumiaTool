import type { ReactNode } from "react";
import { Icon } from "@/components";

type Props = {
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (value: string) => void;
    children?: ReactNode;
};

export default function Option({ name = "", value = "", onSelect, children }: Props) {
    return (
        <div className="ctool-crontab-generate-layout" onClick={() => onSelect?.(name)}>
            {value === name
                ? <Icon hover size={14} color="var(--primary)" name="checked" />
                : <Icon hover size={14} color="var(--ctool-border-color)" name="unchecked" />}
            <span>{$t(`crontab_generate_${name}`)}</span>
            <div>{children}</div>
        </div>
    );
}
