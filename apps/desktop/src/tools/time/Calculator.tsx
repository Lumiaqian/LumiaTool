import { useEffect, useMemo } from "react";
import { Align, Button, Input, InputNumber, Select } from "@/components";
import { initialize, useAction } from "@/store/action";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import type { ManipulateType, QUnitType } from "dayjs";

dayjs.extend(quarterOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);

const current = dayjs();
const initial = await initialize({
    poor: {
        input1: current.format("YYYY-MM-DD HH:mm:ss"),
        input2: current.add(1, "d").format("YYYY-MM-DD HH:mm:ss"),
        unit: "seconds",
    },
    operation: { input: current.format("YYYY-MM-DD HH:mm:ss"), unit: "days", type: "+", length: 1 },
    analyze: { type: "year", input: current.format("YYYY-MM-DD HH:mm:ss") },
});

const unit = [
    { value: "years", label: $t("time_year"), rate: 0 },
    { value: "months", label: $t("time_month"), rate: 0 },
    { value: "weeks", label: $t("time_week"), rate: 1000 * 60 * 60 * 24 * 7 },
    { value: "days", label: $t("time_day"), rate: 1000 * 60 * 60 * 24 },
    { value: "hours", label: $t("time_hour"), rate: 1000 * 60 * 60 },
    { value: "minutes", label: $t("time_minute"), rate: 1000 * 60 },
    { value: "seconds", label: $t("time_second"), rate: 1000 },
] as const;

type UnitValue = (typeof unit)[number]["value"];

function getRate(value: string) {
    return unit.find(item => item.value === value)?.rate ?? 0;
}

export default function Calculator() {
    const action = useAction(initial);
    const poorState = action.current.poor;
    const operationState = action.current.operation;
    const analyzeState = action.current.analyze;
    const unitOptions = useMemo(() => unit.map(({ value, label }) => ({ value, label })), []);

    const poor = useMemo(
        () => dayjs(poorState.input2).diff(dayjs(poorState.input1), poorState.unit as QUnitType),
        [poorState.input1, poorState.input2, poorState.unit],
    );

    const operation = useMemo(() => {
        if (!operationState.length) return "";
        const rate = getRate(operationState.unit);
        if (rate === 0) {
            return operationState.type === "+"
                ? dayjs(operationState.input)
                      .add(operationState.length, operationState.unit as ManipulateType)
                      .format("YYYY-MM-DD HH:mm:ss")
                : dayjs(operationState.input)
                      .subtract(operationState.length, operationState.unit as ManipulateType)
                      .format("YYYY-MM-DD HH:mm:ss");
        }
        return dayjs(
            dayjs(operationState.input).unix() * 1000 +
                rate * operationState.length * (operationState.type === "+" ? 1 : -1),
        ).format("YYYY-MM-DD HH:mm:ss");
    }, [operationState.input, operationState.length, operationState.type, operationState.unit]);

    const analyze = useMemo(() => {
        const input = dayjs(analyzeState.input);
        const year = input.year();
        const quarter = input.quarter();
        if (analyzeState.type === "quarter") {
            const quarterDate = dayjs(`${input.year()}-${(quarter - 1) * 3 + 1}-01`);
            return $t("time_analyze_quarter_output", {
                quarter,
                weekOfQuarter: Math.ceil((input.unix() - quarterDate.unix()) / (86400 * 7)),
                dayOfQuarter: Math.ceil((input.unix() - quarterDate.unix()) / 86400),
                hourOfQuarter: Math.ceil((input.unix() - quarterDate.unix()) / 3600),
                minuteOfQuarter: Math.ceil((input.unix() - quarterDate.unix()) / 60),
                secondOfQuarter: input.unix() - quarterDate.unix(),
            });
        }
        if (analyzeState.type === "month") {
            const month = input.month() + 1;
            const monthDate = dayjs(`${input.year()}-${month}-01`);
            return $t("time_analyze_month_output", {
                month,
                weekOfMonth: Math.ceil((input.unix() - monthDate.unix()) / (86400 * 7)),
                hourOfMonth: Math.ceil((input.unix() - monthDate.unix()) / 3600),
                minuteOfMonth: Math.ceil((input.unix() - monthDate.unix()) / 60),
                secondOfMonth: input.unix() - monthDate.unix(),
            });
        }
        const yearDate = dayjs(`${input.year()}-01-01`);
        return $t("time_analyze_year_output", {
            year,
            quarter,
            weekOfYear: input.isoWeek(),
            dayOfYear: input.dayOfYear(),
            hourOfYear: Math.ceil((input.unix() - yearDate.unix()) / 3600),
            minuteOfYear: Math.ceil((input.unix() - yearDate.unix()) / 60),
            secondOfYear: input.unix() - yearDate.unix(),
        });
    }, [analyzeState.input, analyzeState.type]);

    useEffect(() => {
        action.save();
    }, [
        poorState.input1,
        poorState.input2,
        poorState.unit,
        operationState.input,
        operationState.length,
        operationState.type,
        operationState.unit,
        analyzeState.input,
        analyzeState.type,
    ]);

    return (
        <Align
            className="lumia-inspector-utility-family lumia-utility-family-page lumia-time-calculator-page"
            direction="vertical"
        >
            <section className="lumia-inspector-family-panel lumia-time-calculator-section">
                <header className="lumia-inspector-family-panel-header">
                    <strong>{$t("time_diff_tool")}</strong>
                </header>
                <div className="lumia-inspector-family-panel-body">
                    <Align className="lumia-time-calculator-row">
                        <Input
                            center
                            value={poorState.input1}
                            onChange={(value: string) => {
                                poorState.input1 = value;
                            }}
                            width={170}
                        />
                        <span>与</span>
                        <Input
                            center
                            value={poorState.input2}
                            onChange={(value: string) => {
                                poorState.input2 = value;
                            }}
                            width={170}
                        />
                        <span>相差</span>
                        <InputNumber
                            center
                            value={poor}
                            width={160}
                            append={
                                <Select
                                    value={poorState.unit}
                                    onChange={(value: UnitValue) => {
                                        poorState.unit = value;
                                    }}
                                    options={unitOptions}
                                />
                            }
                        />
                    </Align>
                </div>
            </section>
            <section className="lumia-inspector-family-panel lumia-time-calculator-section">
                <header className="lumia-inspector-family-panel-header">
                    <strong>{$t("time_operation")}</strong>
                </header>
                <div className="lumia-inspector-family-panel-body">
                    <Align className="lumia-time-calculator-row">
                        <Input
                            center
                            value={operationState.input}
                            onChange={(value: string) => {
                                operationState.input = value;
                            }}
                            width={170}
                        />
                        <Select
                            value={operationState.type}
                            onChange={(value: string) => {
                                operationState.type = value;
                            }}
                            options={[
                                { value: "+", label: $t("time_add") },
                                { value: "-", label: $t("time_reduce") },
                            ]}
                        />
                        <InputNumber
                            center
                            value={operationState.length}
                            onChange={(value: number) => {
                                operationState.length = value;
                            }}
                            width={160}
                            append={
                                <Select
                                    value={operationState.unit}
                                    onChange={(value: UnitValue) => {
                                        operationState.unit = value;
                                    }}
                                    options={unitOptions}
                                />
                            }
                        />
                        <span>
                            {$t("time_after")}, {$t("time_is")}{" "}
                            <Button onClick={() => $copy(operation)} type="dotted" text={operation} />
                        </span>
                    </Align>
                </div>
            </section>
            <section className="lumia-inspector-family-panel lumia-time-calculator-section">
                <header className="lumia-inspector-family-panel-header">
                    <strong>{$t("time_analyze")}</strong>
                </header>
                <div className="lumia-inspector-family-panel-body">
                    <Align className="lumia-time-calculator-row">
                        <Input
                            center
                            value={analyzeState.input}
                            onChange={(value: string) => {
                                analyzeState.input = value;
                            }}
                            width={170}
                        />
                        <Select
                            value={analyzeState.type}
                            onChange={(value: string) => {
                                analyzeState.type = value;
                            }}
                            options={[
                                { value: "year", label: $t("time_analyze_year") },
                                { value: "quarter", label: $t("time_analyze_quarter") },
                                { value: "month", label: $t("time_analyze_month") },
                            ]}
                        />
                        <Button onClick={() => $copy(analyze)} type="dotted" text={analyze} />
                    </Align>
                </div>
            </section>
        </Align>
    );
}
