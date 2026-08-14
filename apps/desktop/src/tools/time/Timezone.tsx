import { useEffect, useMemo, useState } from "react";
import { Align, Button, Display, ExtendPage, Input, Select } from "@/components";
import { initialize, useAction } from "@/store/action";
import type { ComponentSizeType } from "@/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { timezoneOptions } from "./util/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const size: ComponentSizeType = "large";
const defaultTimezoneLists = [
    "Asia/Shanghai", "Europe/London", "Asia/Tokyo", "America/Chicago",
    "Europe/Berlin", "Africa/Cairo", "Asia/Calcutta",
];
const initial = await initialize(
    {
        type: "",
        input: "",
        timezone: [...new Set([dayjs.tz.guess(), ...defaultTimezoneLists])].slice(0, 7),
    },
    { paste: false },
);

const check = (value: string) =>
    /^\d+-\d+-\d+ \d+:\d+:\d+$/.test(value.trim()) ||
    /^\d+-\d+-\d+ \d+:\d+:\d+\.\d+$/.test(value.trim());

const convert = (input: string, source: string, target: string) => {
    if (input.includes(".")) {
        return dayjs.tz(dayjs.tz(input, source), target).format("YYYY-MM-DD HH:mm:ss.SSS");
    }
    return dayjs.tz(dayjs.tz(input, source), target).format("YYYY-MM-DD HH:mm:ss");
};

export default function Timezone() {
    const action = useAction(initial);
    const [isMore, setIsMore] = useState(false);
    const isValid = useMemo(() => check(action.current.input.trim()), [action.current.input]);

    const getHandle = (target: string) => {
        if (!action.current.type || action.current.input.trim() === "") return "";
        if (action.current.type === target) return action.current.input;
        try {
            if (!isValid) throw new Error($t("time_error_format"));
            return convert(action.current.input, action.current.type, target);
        } catch (error) {
            return $error(error);
        }
    };

    const setHandle = (source: string, value: string) => {
        action.current.input = value;
        action.current.type = source;
    };

    useEffect(() => {
        if (check(action.current.input) && action.current.type !== "") action.save();
    }, [action, action.current.input, action.current.type, ...action.current.timezone]);

    const setCurrent = () => {
        action.current.type = action.current.timezone[0];
        action.current.input = dayjs.tz(dayjs(), action.current.type).format("YYYY-MM-DD HH:mm:ss");
    };

    return (
        <>
            <Align direction="vertical">
                {Array.from({ length: 7 }, (_, i) => (
                    <Display
                        key={i}
                        position="right-center"
                        extra={
                            <Align>
                                <Select
                                    value={action.current.timezone[i]}
                                    onChange={value => { action.current.timezone[i] = value; }}
                                    options={timezoneOptions}
                                    size="small"
                                    disabled={isValid && action.current.timezone[i] === action.current.type}
                                />
                                {isValid && (
                                    <Button text={$t("main_ui_copy")} onClick={() => $copy(getHandle(action.current.timezone[i]))} size="small" type="primary" />
                                )}
                            </Align>
                        }
                    >
                        <Input
                            value={getHandle(action.current.timezone[i])}
                            onChange={value => setHandle(action.current.timezone[i], value)}
                            placeholder={$t("time_timezone_input_placeholder")}
                            size={size}
                        />
                    </Display>
                ))}
                {!isValid ? (
                    <Button size={size} text={$t("time_current_time")} onClick={setCurrent} />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 100px" }}>
                        <Button size={size} onClick={() => setIsMore(true)} text={$t("main_ui_more")} />
                        <Button size={size} onClick={() => { action.current.input = ""; }} text={$t("main_ui_clear")} />
                    </div>
                )}
            </Align>
            <ExtendPage value={isMore} onChange={setIsMore}>
                <Align direction="vertical">
                    {timezoneOptions.map(item => (
                        <Display
                            key={item.value}
                            position="right-center"
                            text={item.label}
                            type={item.value === action.current.type ? "danger" : "general"}
                            onClick={() => $copy(convert(action.current.input, action.current.type, item.value))}
                        >
                            <Input value={convert(action.current.input, action.current.type, item.value)} size={size} />
                        </Display>
                    ))}
                </Align>
            </ExtendPage>
        </>
    );
}
