import { useEffect, useState } from "react";
import { Tabs } from "@/components";
import Item from "./Item";
import type { ItemType } from "./type";
import "./style.css";

type Props = {
    value?: string;
    onChange?: (value: string) => void;
    height?: number;
};

type Items = Record<ItemType, string>;

export default function Generate({ onChange = () => undefined, height }: Props) {
    const [current, setCurrent] = useState<ItemType>("minute");
    const [items, setItems] = useState<Items>({ second: "", minute: "*", hour: "*", day: "*", month: "*", week: "*" });

    useEffect(() => {
        onChange([
            ...(items.second !== "" ? [items.second] : []),
            items.minute, items.hour, items.day, items.month, items.week,
        ].join(" "));
    }, [items.second, items.minute, items.hour, items.day, items.month, items.week]);

    const setItem = (type: ItemType, value: string) => setItems((currentItems) => ({ ...currentItems, [type]: value }));

    return (
        <Tabs
            value={current}
            onChange={(value: ItemType) => setCurrent(value)}
            height={height}
            padding="20px 10px 0 20px"
            lists={[
                { name: "second", label: $t("crontab_generate_second") },
                { name: "minute", label: $t("crontab_generate_minute") },
                { name: "hour", label: $t("crontab_generate_hour") },
                { name: "day", label: $t("crontab_generate_day") },
                { name: "month", label: $t("crontab_generate_month") },
                { name: "week", label: $t("crontab_generate_week") },
            ]}
        >
            <Item type="second" value={items.second} onChange={(value) => setItem("second", value)} />
            <Item type="minute" value={items.minute} onChange={(value) => setItem("minute", value)} />
            <Item type="hour" value={items.hour} onChange={(value) => setItem("hour", value)} />
            <Item type="day" value={items.day} onChange={(value) => setItem("day", value)} />
            <Item type="month" value={items.month} onChange={(value) => setItem("month", value)} />
            <Item type="week" value={items.week} onChange={(value) => setItem("week", value)} />
        </Tabs>
    );
}
