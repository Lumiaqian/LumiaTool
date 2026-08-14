import { useCallback, useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { isNumber, isString } from "lodash";
import type {
    ComponentSizeType,
    RadioOption,
    RadioValue,
} from "@/types";
import Button from "./Button";

const EMPTY_OPTIONS: RadioOption = [];

export interface RadioProps<T extends RadioValue = RadioValue>
    extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
    value?: T;
    options?: RadioOption;
    size?: ComponentSizeType;
    disabled?: boolean;
    button?: boolean;
    onChange?: (value: T) => void;
}

function Radio<T extends RadioValue = RadioValue>({
    value = "" as T,
    options = EMPTY_OPTIONS,
    size = "default",
    disabled = false,
    onChange,
    className,
    ...restProps
}: RadioProps<T>) {
    const normalizedOptions = useMemo(() => {
        const items: Array<{ value: RadioValue; label: string }> = [];

        for (const item of options) {
            if (isNumber(item) || isString(item)) {
                items.push({ value: item, label: `${item}` });
            } else {
                items.push({ value: item.value, label: `${item.label}` });
            }
        }

        return items;
    }, [options]);

    const select = useCallback(
        (nextValue: RadioValue) => {
            onChange?.(nextValue as T);
        },
        [onChange],
    );

    return (
        <div
            {...restProps}
            className={className ? `ctool-radio ${className}` : "ctool-radio"}
        >
            {normalizedOptions.map((item, index) => (
                <Button
                    key={`${typeof item.value}:${item.value}:${index}`}
                    size={size}
                    disabled={disabled}
                    type={item.value === value ? "primary" : "general"}
                    onClick={() => select(item.value)}
                >
                    {item.label}
                </Button>
            ))}
        </div>
    );
}

export default Radio;
