import { useCallback } from "react";
import type { SelectOption, SelectValue } from "@/types";
import Select from "./Select";
import type { SelectProps } from "./Select";

type ChangeHandler<T> = { bivarianceHack(value: T): void }["bivarianceHack"];

export type DropdownProps<T extends SelectValue = SelectValue> =
    Omit<SelectProps<T>, "center" | "onChange" | "onSelect" | "options"> & {
        options?: SelectOption;
        onSelect?: ChangeHandler<T>;
    };

const Dropdown = <T extends SelectValue = SelectValue>({
    options = [] as SelectOption,
    onSelect,
    ...selectProps
}: DropdownProps<T>) => {
    const change = useCallback((value: T) => {
        onSelect?.(value);
    }, [onSelect]);

    return (
        <Select
            {...selectProps}
            center
            options={options}
            onChange={change}
        />
    );
};

export default Dropdown;
