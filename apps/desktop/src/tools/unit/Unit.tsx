import { useEffect, useMemo } from "react";
import { Align, Button, Card, HeightResize, InputNumber, Radio, Select } from "@/components";
import { config, getType, getUnit, getGroupByUnit, calculate } from "./util";
import { initialize, useAction } from "@/store/action";
import type { SelectOption } from "@/types";

const initial = await initialize(
    { type: "length", from: "m", to: "all", input: 1 },
    { paste: str => /^[0-9.]+$/.test(str) },
);

const unitName = (key: string, type: string, group: string) =>
    `${group ? `${$t("unit_" + group)} - ` : ""}${$t(`unit_${type}_${key}`)} (${getUnit(type, key).unit})`;

const getUnits = (type: string) => {
    const lists: SelectOption = [];
    getType(type).group.forEach(group => {
        group.list.forEach(unit => lists.push({ value: unit, label: unitName(unit, type, group.key) }));
    });
    return lists;
};

export default function Unit() {
    const action = useAction(initial);
    const units = useMemo(() => getUnits(action.current.type), [action.current.type]);
    const currentUnitName = useMemo(
        () => unitName(action.current.from, action.current.type, getGroupByUnit(action.current.type, action.current.from)),
        [action.current.from, action.current.type],
    );
    const result = useMemo(() => getType(action.current.type).unit.map(unit => ({
        key: unit.key,
        value: calculate(action.current.type, `${action.current.input}`, action.current.from, unit.key),
        name: unitName(unit.key, action.current.type, getGroupByUnit(action.current.type, unit.key)),
    })), [action.current.type, action.current.input, action.current.from]);
    const simple = useMemo(
        () => action.current.to === "all"
            ? null
            : result.find(candidate => action.current.to === candidate.key) ?? null,
        [result, action.current.to],
    );

    useEffect(() => {
        action.current.from = getType(action.current.type).main;
        action.current.to = "all";
    }, [action, action.current.type]);

    useEffect(() => {
        if (action.current.input) action.save();
    }, [action, action.current.type, action.current.from, action.current.to, action.current.input]);

    const exchange = () => {
        if (action.current.to === "all") return;
        const from = action.current.from;
        action.current.from = action.current.to;
        action.current.to = from;
    };

    return (
        <div className="ctool-inspector-utility-family ctool-utility-family-page ctool-unit-page">
            <Align className="ctool-page-option ctool-unit-controls" direction="vertical">
                <Radio
                    value={action.current.type}
                    onChange={value => { action.current.type = value; }}
                    options={config.map(item => ({ value: item.key, label: $t("unit_" + item.key) }))}
                />
                <Align className="ctool-unit-conversion">
                    <InputNumber label={$t("main_ui_input")} min={false} width={170} center value={action.current.input} onChange={value => { action.current.input = value; }} />
                    <Select options={units} value={action.current.from} onChange={value => { action.current.from = value; }} />
                    <Button text="<->" disabled={action.current.to === "all"} onClick={exchange} />
                    <Select options={[{ value: "all", label: $t("unit_all") }, ...units]} value={action.current.to} onChange={value => { action.current.to = value; }} />
                </Align>
            </Align>
            <HeightResize className="ctool-unit-results" append={[".ctool-page-option"]}>
                {({ height }: { height: number }) => (
                    <Card height={height}>
                        {action.current.to === "all" ? (
                            <div className="ctool-unit-all">
                                {result.map(item => (
                                    <button type="button" key={item.key} onClick={() => $copy(item.value)}><span>{item.value}</span><span>{item.name}</span></button>
                                ))}
                            </div>
                        ) : simple ? (
                            <Align horizontal="center" vertical="center">
                                <div className="ctool-unit-simple">
                                    <Align>
                                        <button type="button" className="ctool-unit-simple-value" onClick={() => $copy(`${action.current.input}`)}>{action.current.input}</button>
                                        <span className="ctool-unit-simple-title">{currentUnitName}</span>
                                        <span className="ctool-unit-equals">=</span>
                                        <button type="button" className="ctool-unit-simple-value" onClick={() => $copy(simple.value)}>{simple.value}</button>
                                        <span className="ctool-unit-simple-title">{simple.name}</span>
                                    </Align>
                                </div>
                            </Align>
                        ) : null}
                    </Card>
                )}
            </HeightResize>
        </div>
    );
}
