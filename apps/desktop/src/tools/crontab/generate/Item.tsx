import { useEffect, useMemo, useRef, useState } from "react";
import { range } from "lodash";
import { Align, Checkbox, Input, InputNumber } from "@/components";
import Option from "./Option";
import type { ItemType, OptionType, OptionValue } from "./type";

type Props = {
    value?: string;
    onChange?: (value: string) => void;
    type?: ItemType;
};

export default function Item({ onChange = () => undefined, type = "minute" }: Props) {
    const [optionType, setOptionType] = useState<OptionType>(type === "second" ? "ignore" : "any");
    const [optionValue, setOptionValue] = useState<OptionValue>({
        any: "*",
        scope: { start: 2, end: 5 },
        interval: { start: "*", step: 5 },
        list: [],
    });
    const firstRun = useRef(true);

    const scope = useMemo<[number, number]>(() => {
        if (type === "hour") return [0, 23];
        if (type === "day") return [1, 31];
        if (type === "month") return [1, 12];
        if (type === "week") return [0, 7];
        return [0, 59];
    }, [type]);
    const interval = useMemo<[number, number]>(() => {
        if (type === "hour") return [2, 23];
        if (type === "day") return [2, 31];
        if (type === "month") return [2, 12];
        if (type === "week") return [2, 7];
        return [0, 59];
    }, [type]);
    const list = useMemo<(number | string)[]>(() => {
        if (type === "hour") return range(0, 24);
        if (type === "day") return [...range(1, 32), "L"];
        if (type === "month") return range(1, 13);
        if (type === "week") return [...range(0, 8), ...range(1, 8).map((item) => `${item}L`)];
        return range(0, 60);
    }, [type]);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if (optionType === "ignore") return onChange("");
        if (optionType === "scope") return onChange(`${optionValue.scope.start}-${optionValue.scope.end}`);
        if (optionType === "interval") {
            const start = optionValue.interval.start.trim();
            return onChange(`${["0", "*", ""].includes(start) ? "*" : optionValue.interval.start}/${optionValue.interval.step}`);
        }
        if (optionType === "list" && optionValue.list.length > 0) return onChange(optionValue.list.join(","));
        onChange("*");
    }, [optionType, optionValue]);

    return (
        <Align direction="vertical" gap="large">
            {type === "second" && <Option value={optionType} name="ignore" onSelect={(value) => setOptionType(value as OptionType)} />}
            <Option value={optionType} name="any" onSelect={(value) => setOptionType(value as OptionType)}><code>*</code></Option>
            <Option value={optionType} name="scope" onSelect={(value) => setOptionType(value as OptionType)}>
                <Align>
                    <InputNumber size="small" value={optionValue.scope.start} onChange={(start: number) => setOptionValue((value) => ({ ...value, scope: { ...value.scope, start } }))} min={scope[0]} max={scope[1]} step={1} />
                    <code>-</code>
                    <InputNumber size="small" value={optionValue.scope.end} onChange={(end: number) => setOptionValue((value) => ({ ...value, scope: { ...value.scope, end } }))} min={scope[0]} max={scope[1]} step={1} />
                </Align>
            </Option>
            <Option value={optionType} name="interval" onSelect={(value) => setOptionType(value as OptionType)}>
                <Align>
                    <Input size="small" value={optionValue.interval.start} onChange={(start: string) => setOptionValue((value) => ({ ...value, interval: { ...value.interval, start } }))} />
                    <code>/</code>
                    <InputNumber size="small" value={optionValue.interval.step} onChange={(step: number) => setOptionValue((value) => ({ ...value, interval: { ...value.interval, step } }))} min={interval[0]} max={interval[1]} step={1} />
                </Align>
            </Option>
            <Option value={optionType} name="list" onSelect={(value) => setOptionType(value as OptionType)}>
                <Checkbox options={list} value={optionValue.list} onChange={(selected: OptionValue["list"]) => setOptionValue((value) => ({ ...value, list: selected }))} />
            </Option>
        </Align>
    );
}
