import { useEffect, useMemo, useState } from "react";
import { Align, Button, Input, Link, Select, Table } from "@/components";
import { initialize, useAction } from "@/store/action";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Format, transform, InputType } from "./util/timestamp";
import { timezoneOptions } from "./util/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const format = "auto" as Format | "auto";
const initial = await initialize(
    {
        input: "",
        timezone: dayjs.tz.guess(),
        format,
    },
    {
        paste: str =>
            /^\d+-\d+-\d+ \d+:\d+:\d+$/.test(str) ||
            /^\d+-\d+-\d+ \d+:\d+:\d+\.\d+$/.test(str) ||
            /^-?\d{5,}$/.test(str) ||
            /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(str),
    },
);

type ExampleRow = { format: string; value: string };

export default function Timestamp() {
    const action = useAction(initial);
    const [current, setCurrent] = useState(() => dayjs().valueOf());

    const output = useMemo(() => {
        let input = (action.current.input || "").trim();
        if (action.current.input.toLowerCase().includes("e")) {
            input = `${parseFloat(action.current.input)}`;
        }
        return transform(input, action.current.timezone, action.current.format);
    }, [action.current.input, action.current.timezone, action.current.format]);

    useEffect(() => {
        if (output.isValid) {
            action.save();
        }
    }, [action, action.current.input, action.current.timezone, action.current.format, output.isValid, output.format]);

    useEffect(() => {
        const timer = window.setInterval(() => setCurrent(dayjs().valueOf()), 100);
        return () => window.clearInterval(timer);
    }, []);

    const example = useMemo<ExampleRow[]>(() => {
        const day = dayjs(current).tz(action.current.timezone);
        return [
            { format: $t("time_normal_second"), value: day.format("YYYY-MM-DD HH:mm:ss") },
            { format: $t("time_unix_second"), value: day.unix().toString() },
            { format: $t("time_normal_millisecond"), value: day.format("YYYY-MM-DD HH:mm:ss.SSS") },
            { format: $t("time_unix_millisecond"), value: day.valueOf().toString() },
        ];
    }, [current, action.current.timezone]);

    return (
        <div className="lumia-inspector-utility-family lumia-utility-family-page lumia-timestamp-page">
            <section className="lumia-utility-family-value lumia-timestamp-input">
                <header className="lumia-utility-family-value-header">
                    <Select
                        size="small"
                        center={false}
                        label={$t("time_timezone")}
                        value={action.current.timezone}
                        options={timezoneOptions}
                        onChange={value => { action.current.timezone = value; }}
                    />
                    <Align>
                        {output.type === InputType.unix && (
                            <Select
                                value={action.current.format}
                                onChange={value => { action.current.format = value; }}
                                size="small"
                                options={[
                                    { value: "auto", label: `${$t("time_unix_auto")}:${$t(`time_unix_${output.autoFormat}`)}` },
                                    { value: Format.second, label: $t("time_unix_second") },
                                    { value: Format.millisecond, label: $t("time_unix_millisecond") },
                                    { value: Format.nanosecond, label: $t("time_unix_nanosecond") },
                                ]}
                            />
                        )}
                        {action.current.input !== "" && (
                            <Button text={$t("main_ui_clear")} onClick={() => { action.current.input = ""; }} size="small" />
                        )}
                    </Align>
                </header>
                <Input
                    size="large"
                    value={action.current.input}
                    onChange={value => { action.current.input = value; }}
                    label={$t("main_ui_input")}
                    placeholder={$t("time_timestamp_input_placeholder")}
                />
            </section>
            <section className="lumia-timestamp-results">
                <div className="lumia-timestamp-value">
                    <Input readOnly size="large" value={output.second} label={$t("time_second")} />
                    {output.isValid && <Button size="small" type="primary" text={$t("main_ui_copy")} onClick={() => $copy(output.second)} />}
                </div>
                <div className="lumia-timestamp-value">
                    <Input readOnly size="large" value={output.millisecond} label={$t("time_millisecond")} />
                    {output.isValid && <Button size="small" type="primary" text={$t("main_ui_copy")} onClick={() => $copy(output.millisecond)} />}
                </div>
                <div className="lumia-timestamp-value">
                    <Input readOnly size="large" value={output.nanosecond} label={$t("time_nanosecond")} />
                    {output.isValid && <Button size="small" type="primary" text={$t("main_ui_copy")} onClick={() => $copy(output.nanosecond)} />}
                </div>
            </section>
            <div className="lumia-timestamp-examples">
                <Table
                    columns={[{ title: $t("time_format"), key: "format" }, { title: $t("time_value"), key: "value" }]}
                    lists={example}
                    actionWidth={100}
                    border
                    column={({ row }: { row: ExampleRow }) => (
                        <>
                            <td>{row.format}</td>
                            <td><Link onClick={() => $copy(row.value)}>{row.value}</Link></td>
                        </>
                    )}
                >
                    {({ row }: { row: ExampleRow }) => (
                        <Button text={$t("main_ui_load")} onClick={() => { action.current.input = `${row.value}`; }} size="small" />
                    )}
                </Table>
            </div>
        </div>
    );
}
