import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { isNumber, isString } from "lodash";
import type {
    AlignDirection,
    CheckboxOption,
    CheckboxValue,
    ComponentSizeType,
} from "@/types";
import Align from "../Align";
import Bool from "./Bool";

const EMPTY_VALUE: CheckboxValue = [];
const EMPTY_OPTIONS: CheckboxOption = [];

type ListsValueType = Record<
    string,
    { value: string | number; select: boolean; label: string }
>;

interface SerializedOption {
    value: string | number;
    label: string;
}

type CheckboxItem = string | number;
type ChangeHandler<T> = { bivarianceHack(value: T): void }["bivarianceHack"];

export interface CheckboxProps<T extends CheckboxItem = CheckboxItem>
    extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
    value?: T[];
    border?: boolean;
    direction?: AlignDirection;
    size?: ComponentSizeType;
    options?: CheckboxOption;
    onChange?: ChangeHandler<T[]>;
}

function serializeOptions(options: CheckboxOption): SerializedOption[] {
    const items: SerializedOption[] = [];

    for (const item of options) {
        if (isNumber(item) || isString(item)) {
            items.push({ value: item, label: `${item}` });
        } else {
            items.push({ value: item.value, label: `${item.label}` });
        }
    }

    return items;
}

function createLists(
    options: SerializedOption[],
    values: CheckboxValue,
): ListsValueType {
    const lists: ListsValueType = {};

    for (const option of options) {
        const key = `${isNumber(option.value) ? "n_" : "s_"}${option.value}`;
        lists[key] = {
            value: option.value,
            select: values.includes(option.value),
            label: option.label,
        };
    }

    return lists;
}

function Checkbox<T extends CheckboxItem = CheckboxItem>({
    value = EMPTY_VALUE as T[],
    border = false,
    direction = "horizontal",
    size = "default",
    options = EMPTY_OPTIONS,
    onChange,
    className,
    ...restProps
}: CheckboxProps<T>) {
    const serializedOptions = useMemo(
        () => serializeOptions(options),
        [options],
    );
    const [lists, setLists] = useState<ListsValueType>(() =>
        createLists(serializedOptions, value),
    );

    useEffect(() => {
        setLists(createLists(serializedOptions, value));
    }, [serializedOptions, value]);

    const listKeys = useMemo(() => Object.keys(lists), [lists]);

    const update = useCallback(
        (key: string, selected: boolean) => {
            const currentItem = lists[key];
            if (!currentItem) {
                return;
            }

            const nextLists: ListsValueType = {
                ...lists,
                [key]: {
                    ...currentItem,
                    select: selected,
                },
            };
            const nextValue: CheckboxValue = Object.keys(nextLists)
                .filter((itemKey) => nextLists[itemKey].select)
                .map((itemKey) => nextLists[itemKey].value);

            setLists(nextLists);
            onChange?.(nextValue as T[]);
        },
        [lists, onChange],
    );

    return (
        <Align
            {...restProps}
            className={className ? `ctool-checkbox ${className}` : "ctool-checkbox"}
            direction={direction}
        >
            {listKeys.map((key) => (
                <Bool
                    key={key}
                    value={lists[key].select}
                    label={lists[key].label}
                    onChange={(selected: boolean) => update(key, selected)}
                    size={size}
                    border={border}
                />
            ))}
        </Align>
    );
}

export default Checkbox;
