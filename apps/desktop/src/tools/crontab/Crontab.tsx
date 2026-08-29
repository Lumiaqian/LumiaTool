import { useCallback, useEffect, useState } from "react";
import { Button, HelpTip, Input, Link, Table, Tabs } from "@/components";
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
    const [description, setDescription] = useState("");
    const [schedule, setSchedule] = useState<string[]>([]);
    const [isError, setIsError] = useState(false);
    const locale = $t("main_locale");
    const conversion = (exp: string) => cronstrue.toString(exp, { locale, use24HourTimeFormat: true });

    useEffect(() => {
        const input = action.current.input.trim();
        setDescription("");
        setSchedule([]);
        setIsError(false);
        if (input === "") {
            return;
        }

        const descriptionLines: string[] = [];
        try {
            if (input.includes("L")) descriptionLines.push($t("crontab_l_prompt"));
            if (input.split(" ").length > 5) descriptionLines.push($t("crontab_second_prompt"));
            descriptionLines.push(conversion(input));

            const interval = parser.parseExpression(input);
            const nextSchedule: string[] = [];
            for (let i = 1; i <= 10; i++) {
                nextSchedule.push($t("crontab_no", [i, dayjs(interval.next().toString()).format("YYYY-MM-DD HH:mm:ss")]));
            }
            setDescription(descriptionLines.join("\n\n"));
            setSchedule(nextSchedule);
            action.save();
        } catch (error) {
            setIsError(true);
            setDescription($error(error));
        }
    }, [action.current.input]);

    const changeInput = useCallback((value: string) => { action.current.input = value; }, [action]);
    const symbol = [
        { name: "*", text: $t("crontab_symbol_description_1") },
        { name: ",", text: $t("crontab_symbol_description_2") },
        { name: "-", text: $t("crontab_symbol_description_3") },
        { name: "/n", text: $t("crontab_symbol_description_4") },
    ];

    return (
        <div className="lumia-crontab-page">
            <section className="lumia-crontab-toolbar" aria-label={$t("crontab_expression")}>
                <Input
                    value={action.current.input}
                    onChange={changeInput}
                    label={$t("crontab_expression")}
                />
                <div className="lumia-crontab-actions">
                    <HelpTip link="https://www.npmjs.com/package/cron-parser" />
                    <Button
                        type="primary"
                        text={$t("crontab_generate")}
                        onClick={() => setIsGenerate((value) => !value)}
                    />
                </div>
            </section>
            <div className="lumia-crontab-workspace">
                <div className="lumia-crontab-summary">
                    <section className="lumia-tester-panel lumia-crontab-description" aria-labelledby="lumia-crontab-description-title">
                        <header className="lumia-tester-panel-header">
                            <strong id="lumia-crontab-description-title">{$t("crontab_description")}</strong>
                        </header>
                        <output className={isError ? "lumia-crontab-output is-error" : "lumia-crontab-output"}>
                            <pre>{description || "—"}</pre>
                        </output>
                    </section>
                    <section className="lumia-tester-panel lumia-crontab-schedule" aria-labelledby="lumia-crontab-schedule-title">
                        <header className="lumia-tester-panel-header">
                            <strong id="lumia-crontab-schedule-title">{$t("crontab_execute_time_list")}</strong>
                        </header>
                        {schedule.length === 0 ? (
                            <div className="lumia-tester-empty">—</div>
                        ) : (
                            <ol className="lumia-crontab-schedule-list">
                                {schedule.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
                            </ol>
                        )}
                    </section>
                </div>
                <section className="lumia-tester-panel lumia-crontab-reference" aria-labelledby="lumia-crontab-reference-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-crontab-reference-title">
                            {isGenerate ? $t("crontab_generate") : $t("main_ui_reference")}
                        </strong>
                    </header>
                    <div className="lumia-crontab-reference-body">
                        {!isGenerate ? (
                            <Tabs value="example" lists={[
                                { name: "example", label: $t("crontab_example") },
                                { name: "format", label: $t("crontab_format") },
                                { name: "symbol", label: $t("crontab_symbol") },
                            ]} padding="0">
                                <Table
                                    columns={[
                                        { key: "exp", title: $t("crontab_example"), width: 150 },
                                        { key: "text", title: $t("crontab_description") },
                                    ]}
                                    lists={example.map((item) => ({ exp: item, text: conversion(item) }))}
                                />
                                <Link href="https://www.npmjs.com/package/cron-parser" className="lumia-crontab-format-link">
                                    <img src={crontabImage} alt="crontab" />
                                </Link>
                                <Table
                                    columns={[
                                        { key: "name", title: $t("crontab_symbol"), width: 100 },
                                        { key: "text", title: $t("crontab_description") },
                                    ]}
                                    lists={symbol}
                                />
                            </Tabs>
                        ) : (
                            <Generate value={action.current.input} onChange={changeInput} />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
