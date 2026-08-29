import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon, Input } from "@/components";
import { toolKeywords } from "@/generated/data";
import { getTool } from "@/config";
import type { FeatureInterface } from "@/config";
import useOperate from "@/store/operate";
import useSetting from "@/store/setting";

type SearchItem = {
    label: string;
    tool: string;
    feature: string;
};

export default function Search() {
    const setting = useSetting();
    const operate = useOperate();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const listboxId = "lumia-search-listbox";
    const [input, setInput] = useState("");
    const [isInput, setIsInput] = useState(false);
    const [selectIndex, setSelectIndex] = useState(0);

    const items = useMemo<SearchItem[]>(() => {
        let lists: FeatureInterface[];
        if (input === "") {
            lists = [...new Set<FeatureInterface>([
                ...operate.getRecently(),
                ...setting.items.common.map((name) => getTool(name).firstFeature()),
            ])];
        } else {
            lists = toolKeywords
                .filter((item) => item.search.join(",").includes(input.toLowerCase()))
                .map((item) => getTool(item.name).getFeature(item.feature));
        }
        if (lists.length === 0) {
            return [{ label: $t("main_ui_null"), tool: "", feature: "" }];
        }
        return lists.slice(0, 15).map((feature) => {
            const tool = feature.tool;
            return {
                label: `${$t(`tool_${tool.name}`)}${tool.isSimple() ? "" : ` - ${$t(`tool_${tool.name}_${feature.name}`)}`}`,
                tool: tool.name,
                feature: feature.name,
            };
        });
    }, [input, operate, setting.items.common]);

    const close = () => {
        setInput("");
        setIsInput(false);
        setSelectIndex(0);
    };

    useEffect(() => {
        setSelectIndex(0);
    }, [input]);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Node && wrapperRef.current?.contains(target)) {
                return;
            }
            close();
        };
        document.addEventListener("click", handleDocumentClick);
        return () => document.removeEventListener("click", handleDocumentClick);
    }, []);

    const select = (index: number) => {
        if (items.length === 0 || index < 0 || index >= items.length) {
            return;
        }
        const { tool, feature } = items[index];
        const keyword = input;
        if (tool !== "") {
            operate.redirectTool(tool, feature, "", "", keyword);
        }
        wrapperRef.current?.querySelector("input")?.blur();
        close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            select(selectIndex);
        } else if (event.key === "ArrowUp" && items.length > 0) {
            event.preventDefault();
            setSelectIndex((index) => index === 0 ? items.length - 1 : index - 1);
        } else if (event.key === "ArrowDown" && items.length > 0) {
            event.preventDefault();
            setSelectIndex((index) => index === items.length - 1 ? 0 : index + 1);
        } else if (event.key === "Escape") {
            event.preventDefault();
            close();
        }
    };

    return (
        <div ref={wrapperRef} className="lumia-search" style={{ display: "inline-flex" }}>
            <Input
                role="combobox"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded={isInput}
                aria-activedescendant={isInput ? `${listboxId}-option-${selectIndex}` : undefined}
                aria-label={$t("main_search_placeholder")}
                autoComplete="off"
                size="small"
                width={150}
                placeholder={$t("main_search_placeholder")}
                value={input}
                onChange={(value: string) => setInput(value)}
                onFocus={() => {
                    setIsInput(true);
                    setSelectIndex(0);
                }}
                onKeyDown={handleKeyDown}
                suffix={<Icon name="search" size={12} />}
            />
            {isInput && (
                <ul id={listboxId} className="lumia-search-block" role="listbox">
                    {items.map((item, index) => (
                        <li
                            className={index === selectIndex ? "lumia-search-active" : ""}
                            key={`${item.tool}-${item.feature}`}
                            role="presentation"
                        >
                            <button
                                id={`${listboxId}-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={index === selectIndex}
                                tabIndex={-1}
                                onClick={() => select(index)}
                                onMouseOver={() => setSelectIndex(index)}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
