import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { isNumber, isString } from "lodash";
import type { ComponentSizeType, SelectOption, SelectType, SelectValue } from "@/types";
import { measureTextMaxWidth, sizeConvert } from "@/components/util";
import Align from "../Align";
import Button from "./Button";
import Modal from "../Modal";

type CSSVariableProperties = CSSProperties & {
    [key: `--${string}`]: string | number | undefined;
};

type NativeContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange">;

type MenuPosition = Record<"top" | "right" | "left" | "bottom", string>;

type NormalizedOption = {
    value: SelectValue;
    label: string;
    description: string;
};

type ChangeHandler<T> = { bivarianceHack(value: T): void }["bivarianceHack"];

export interface SelectProps<T extends SelectValue = SelectValue> extends NativeContainerProps {
    value?: T;
    placeholder?: string;
    size?: ComponentSizeType;
    type?: SelectType;
    options?: SelectOption;
    label?: string;
    width?: number | string;
    disabled?: boolean;
    dialog?: boolean;
    disabledDialogClickClose?: boolean;
    center?: boolean;
    onChange?: ChangeHandler<T>;
}

const initialMenuPosition: MenuPosition = {
    top: "unset",
    right: "unset",
    left: "unset",
    bottom: "unset",
};

function Select<T extends SelectValue = SelectValue>({
    value = "__placeholder__" as T,
    placeholder = "",
    size = "default",
    type = "general",
    options = [],
    label = "",
    width = "",
    disabled = false,
    dialog = false,
    disabledDialogClickClose = false,
    center = true,
    onChange,
    className,
    style: passedStyle,
    ...containerProps
}: SelectProps<T>) {
    const generatedSelectId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const optionListRef = useRef<HTMLUListElement>(null);
    const selectLeftRef = useRef<HTMLDivElement>(null);
    const [selectLeftWidth, setSelectLeftWidth] = useState(0);
    const [menuTextWidth, setMenuTextWidth] = useState(0);
    const [menuPosition, setMenuPosition] = useState<MenuPosition>(initialMenuPosition);
    const [dialogShow, setDialogShow] = useState(false);
    const [menuHidden, setMenuHidden] = useState(true);
    const selectId = containerProps.id ?? generatedSelectId;
    const summaryId = `${selectId}-button`;
    const labelId = `${selectId}-label`;
    const listboxId = `${selectId}-listbox`;
    const hasVisibleLabel = label !== "" && type === "general";

    const normalizedOptions = useMemo<NormalizedOption[]>(() => {
        const items: NormalizedOption[] = [];
        for (const item of options) {
            if (isNumber(item) || isString(item)) {
                items.push({ value: item, label: `${item}`, description: "" });
            } else {
                items.push({
                    value: item.value,
                    label: `${item.label}`,
                    description: item.description || "",
                });
            }
        }
        return items;
    }, [options]);

    const placeholderValue = useMemo(() => {
        if (value !== "__placeholder__") {
            return normalizedOptions.find(item => item.value === value)?.label || placeholder;
        }
        return placeholder;
    }, [normalizedOptions, placeholder, value]);

    const update = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const nextMenuTextWidth = Math.max(
            measureTextMaxWidth(
                normalizedOptions.map(item => item.label),
                "1rem",
            ),
            container.offsetWidth,
        );
        setMenuTextWidth(nextMenuTextWidth);

        const boundingClientRect = container.getBoundingClientRect();
        const top = boundingClientRect.top;
        const bottom = window.innerHeight - boundingClientRect.bottom;
        const left = boundingClientRect.left;
        const right = window.innerWidth - boundingClientRect.left - 20;
        const menuHeight = optionListRef.current?.offsetHeight || 0;
        const menuWidth = nextMenuTextWidth || 0;
        const isBottom = bottom > menuHeight || bottom > top;
        const isLeft = right > menuWidth;

        setMenuPosition({
            top: isBottom ? `${boundingClientRect.bottom}px` : "unset",
            bottom: isBottom ? "unset" : `calc(100vh - ${boundingClientRect.top}px)`,
            left: isLeft ? `${left}px` : "unset",
            right: isLeft ? "unset" : `${window.innerWidth - boundingClientRect.right}px`,
        });
        setSelectLeftWidth(selectLeftRef.current?.offsetWidth || 0);
    }, [normalizedOptions]);

    const close = useCallback(() => {
        detailsRef.current?.removeAttribute("open");
    }, []);

    const selectValue = useCallback(
        (nextValue: SelectValue) => {
            if (disabled) {
                return;
            }
            onChange?.(nextValue as T);
            if (dialog && disabledDialogClickClose) {
                return;
            }
            close();
        },
        [close, dialog, disabled, disabledDialogClickClose, onChange],
    );

    useLayoutEffect(() => {
        update();
    }, [update]);

    useEffect(() => {
        const details = detailsRef.current;
        if (!details) {
            return;
        }

        const toggle = () => {
            if (disabled && details.open) {
                details.open = false;
                return;
            }
            setMenuHidden(!details.open);
            if (details.open && optionListRef.current) {
                update();
            }
            if (dialog) {
                setDialogShow(details.open);
            }
        };

        details.addEventListener("toggle", toggle);
        return () => {
            details.removeEventListener("toggle", toggle);
        };
    }, [dialog, disabled, update]);

    useEffect(() => {
        if (!disabled) {
            return;
        }
        close();
        setDialogShow(false);
        setMenuHidden(true);
    }, [close, disabled]);

    const componentStyle: CSSVariableProperties = {
        width: width ? sizeConvert(width) : "auto",
        "--ctool-select-menu-top": menuPosition.top,
        "--ctool-select-menu-right": menuPosition.right,
        "--ctool-select-menu-left": menuPosition.left,
        "--ctool-select-menu-bottom": menuPosition.bottom,
        ...passedStyle,
    };
    if (center) {
        componentStyle["--text-align"] = "center";
    }
    if (selectLeftWidth) {
        componentStyle["--ctool-select-left-padding"] = `${selectLeftWidth}px`;
    }
    if (menuTextWidth) {
        componentStyle["--ctool-select-menu-width"] = `${menuTextWidth}px`;
    }

    return (
        <div
            {...containerProps}
            className={["ctool-select", className].filter(Boolean).join(" ")}
            data-size={size}
            data-type={type}
            data-disabled={disabled ? "y" : "n"}
            style={componentStyle}
            ref={containerRef}
        >
            <details ref={detailsRef}>
                <summary
                    id={summaryId}
                    aria-controls={listboxId}
                    aria-disabled={disabled}
                    aria-expanded={!menuHidden}
                    aria-haspopup="listbox"
                    aria-label={hasVisibleLabel || label === "" ? undefined : `${label}: ${placeholderValue}`}
                    aria-labelledby={hasVisibleLabel ? `${labelId} ${summaryId}` : undefined}
                    role="button"
                    tabIndex={disabled ? -1 : undefined}
                    onClick={event => {
                        if (disabled) {
                            event.preventDefault();
                        }
                    }}
                    onKeyDown={event => {
                        if (disabled && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                        }
                    }}
                    onKeyUp={event => {
                        if (disabled && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                        }
                    }}
                    className="ctool-select-summary"
                >
                    {placeholderValue}
                </summary>
                {!dialog && (
                    <ul
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={hasVisibleLabel ? `${labelId} ${summaryId}` : summaryId}
                        className={menuHidden ? "ctool-select-option-hidden" : undefined}
                        ref={optionListRef}
                    >
                        {normalizedOptions.map((item, index) => (
                            <li key={`${item.value}-${index}`} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={value === item.value}
                                    disabled={disabled}
                                    tabIndex={menuHidden || disabled ? -1 : 0}
                                    onClick={() => selectValue(item.value)}
                                >
                                    {item.label}
                                    {item.description !== "" ? ` - ${item.description}` : ""}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </details>
            <div className="ctool-select-left" ref={selectLeftRef}>
                {hasVisibleLabel && (
                    <div id={labelId} className="ctool-select-prepend ctool-input-label">{label}</div>
                )}
            </div>
            <Modal
                value={dialogShow}
                onChange={setDialogShow}
                title={label}
                padding="20px 10px"
                width="85%"
                onClose={close}
            >
                <Align
                    id={listboxId}
                    horizontal="center"
                    role="listbox"
                    aria-labelledby={hasVisibleLabel ? labelId : undefined}
                    aria-label={hasVisibleLabel ? undefined : label || placeholderValue || undefined}
                >
                    {normalizedOptions.map((item, index) => (
                        <Button
                            type={value === item.value ? "primary" : "general"}
                            key={`${item.value}-${index}`}
                            role="option"
                            aria-selected={value === item.value}
                            disabled={disabled}
                            onClick={() => selectValue(item.value)}
                            text={item.label}
                        />
                    ))}
                </Align>
            </Modal>
        </div>
    );
}

export default Select;
