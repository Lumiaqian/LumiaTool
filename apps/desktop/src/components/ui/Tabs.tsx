import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type {
    ComponentPropsWithoutRef,
    CSSProperties,
    ReactNode,
} from "react";
import type { TabsListsType } from "@/types";
import { heightResizeDispatch } from "@/event";
import { sizeConvert } from "../util";

const EMPTY_LISTS: TabsListsType = [];

type ChangeHandler<T> = { bivarianceHack(value: T): void }["bivarianceHack"];

export interface TabsProps<T extends string = string>
    extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
    value?: T;
    lists?: TabsListsType;
    padding?: string;
    height?: number | string;
    extra?: ReactNode;
    children?: ReactNode;
    onChange?: ChangeHandler<T>;
}

function Tabs<T extends string = string>({
    value = "" as T,
    lists = EMPTY_LISTS,
    padding = "5px",
    height = "",
    extra,
    children,
    onChange,
    className,
    style: externalStyle,
    ...restProps
}: TabsProps<T>) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const latestListsRef = useRef(lists);
    latestListsRef.current = lists;

    const [current, setCurrent] = useState(value);
    const [currentIndex, setCurrentIndex] = useState(-1);

    useLayoutEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const currentLists = latestListsRef.current;
        let index = 0;

        for (let itemIndex = 0; itemIndex < currentLists.length; itemIndex += 1) {
            if (currentLists[itemIndex].name === current) {
                index = itemIndex;
                break;
            }
        }

        setCurrentIndex(index);
    }, [current]);

    useEffect(() => {
        if (containerRef.current) {
            heightResizeDispatch();
        }
    }, [current]);

    const select = useCallback(
        (name: string) => {
            if (name === current) {
                return;
            }

            setCurrent(name as T);
            onChange?.(name as T);
        },
        [current, onChange],
    );

    const tabsStyle: CSSProperties = {
        ...(height ? { height: sizeConvert(height) } : {}),
        ...externalStyle,
    };

    return (
        <div
            {...restProps}
            ref={containerRef}
            className={className ? `lumia-tabs ${className}` : "lumia-tabs"}
            style={tabsStyle}
        >
            <div className="lumia-tabs-header">
                <div className="lumia-tabs-header-item">
                    {lists.map((item, index) => (
                        <span
                            key={item.name}
                            className={
                                index === currentIndex
                                    ? "lumia-tabs-current"
                                    : undefined
                            }
                            onClick={() => select(item.name)}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>
                <div className="lumia-tabs-header-fill">{extra}</div>
            </div>
            {currentIndex !== -1 && (
                <div
                    className={`lumia-tabs-body lumia-tabs-current-${currentIndex}`}
                    style={{ padding: `${padding}` }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export default Tabs;
