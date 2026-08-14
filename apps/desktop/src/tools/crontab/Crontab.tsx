import { useCallback, useEffect, useState } from "react";
import { Align, Button, HeightResize, HelpTip, Input, Link, Table, Tabs, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import cronstrue from "cronstrue/i18n";
import parser from "cron-parser";
import dayjs from "dayjs";
import Generate from "./generate/Generate";
import crontabImage from "@/assets/tools/crontab/crontab.png";

const initial = await initialize({ input: "2,3 */5 * * 2-5" }, {
    paste: (str) => [5, 6].includes(str.trim().split(" ").length),
});

const example = [
    "* * * * *", "*/5 */5 * * *", "* 10/5 * * *", "1 1-10 * * *", "0 1,2 * * *",
    "1 2 3 4,6,10 *", "0 * L * *", "0 1 * * 0", "0 1 * * 7", "0 1 * * 1",
    "0 1 * * 2-5", "0 1 * * 2,5", "0 1 * * 1L", "0 1 * * 1L,2L", "*/5 1-10,17,22 L 1-2,3/2 1L,2L",
];

export default function Crontab() {
    const action = useAction(initial);
    const [isGenerate, setIsGenerate] = useState(false);
    const [output, setOutput] = useState("");
    const locale = $t("main_locale");
    const conversion = (exp: string) => cronstrue.toString(exp, { locale, use24HourTimeFormat: true });

    useEffect(() => {
        let input = action.current.input.trim();
        if (input === "") {
            setOutput("");
            return;
        }
        const list: string[] = [];
        try {
            const message = conversion(input);
            if (input.includes("L")) list.push($t("crontab_l_prompt"), "");
            if (input.split(" ").length > 5) list.push($t("crontab_second_prompt"), "");
            list.push(message, "", $t("crontab_execute_time_list"));
            const interval = parser.parseExpression(input);
            for (let i = 1; i <= 10; i++) {
                list.push($t("crontab_no", [i, dayjs(interval.next().toString()).format("YYYY-MM-DD HH:mm:ss")]));
            }
            action.save();
        } catch (error) {
            list.push($error(error));
        }
        setOutput(list.join("\n"));
    }, [action.current.input]);

    const changeInput = useCallback((value: string) => { action.current.input = value; }, [action]);
    const symbol = [
        { name: "*", text: $t("crontab_symbol_description_1") },
        { name: ",", text: $t("crontab_symbol_description_2") },
        { name: "-", text: $t("crontab_symbol_description_3") },
        { name: "/n", text: $t("crontab_symbol_description_4") },
    ];

    return (
        <Align direction="vertical">
            <Input
                value={action.current.input}
                onChange={changeInput}
                className="ctool-crontab-input"
                label={$t("crontab_expression")}
                suffix={<Align><HelpTip link="https://www.npmjs.com/package/cron-parser" /><Button size="small" type="primary" text={$t("crontab_generate")} onClick={() => setIsGenerate((value) => !value)} /></Align>}
            />
            <HeightResize append={[".ctool-crontab-input"]} reduce={5} style={{ display: "grid", gridTemplateColumns: "10fr 14fr" }}>
                {({ height }) => (
                    <>
                        <Textarea value={output} height={height} placeholder={$t("crontab_execute_time")} />
                        {!isGenerate ? (
                            <Tabs value="example" lists={[
                                { name: "example", label: $t("crontab_example") },
                                { name: "format", label: $t("crontab_format") },
                                { name: "symbol", label: $t("crontab_symbol") },
                            ]} height={height} padding="0">
                                <Table columns={[{ key: "exp", title: $t("crontab_example"), width: 150 }, { key: "text", title: $t("crontab_description") }]} lists={example.map((item) => ({ exp: item, text: conversion(item) }))} />
                                <Link href="https://www.npmjs.com/package/cron-parser" style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <img src={crontabImage} style={{ maxWidth: "95%", maxHeight: "95%" }} alt="crontab" />
                                </Link>
                                <Table height={height - 40} columns={[{ key: "name", title: $t("crontab_symbol"), width: 100 }, { key: "text", title: $t("crontab_description") }]} lists={symbol} />
                            </Tabs>
                        ) : <Generate height={height} value={action.current.input} onChange={changeInput} />}
                    </>
                )}
            </HeightResize>
        </Align>
    );
}
