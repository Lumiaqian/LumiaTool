import { useCallback, useMemo, useRef, useEffect } from "react";
import { Align, Bool, Button, Editor, HeightResize, Select } from "@/components";
import { useAction, initialize } from "@/store/action";
import formatter from "./formatter";
import { getInArrayOnlyOneItem } from "@/lib/util";
import { getDisplayName } from "@/lib/code";
import { sqlLanguages } from "./formatter/types";
import type { OptionMap, Languages as FormatterLanguages } from "./formatter/types";

type Languages = Exclude<FormatterLanguages, "json">;
type ActionState = {
    option: { [K in Languages]: OptionMap[K] };
    input: string;
    language: Languages;
};

const languageLists = formatter.allLanguageType.filter((item) => !["json"].includes(item)) as Languages[];

const initial = await initialize<ActionState>({
    input: "",
    language: "javascript",
    option: {
        javascript: { tab: 4 },
        markdown: { tab: 4 },
        typescript: { tab: 4 },
        css: { tab: 4 },
        less: { tab: 4 },
        scss: { tab: 4 },
        yaml: { tab: 4 },
        html: { tab: 4 },
        xml: { tab: 4, collapse_content: true },
        php: { tab: 4 },
        java: { tab: 4 },
        vue: { tab: 4 },
        graphql: { tab: 4 },
        sql: { tab: 4, language: "mysql" },
    },
}, {
    keyword: (str) => {
        const lang = getInArrayOnlyOneItem(str, languageLists);
        return lang === "" ? false : { language: lang };
    },
});

const tabOptions = [
    { label: $t("code_indent_width_null"), value: 0 },
    { label: $t("code_indent_width", [2]), value: 2 },
    { label: $t("code_indent_width", [4]), value: 4 },
    { label: $t("code_indent_width", [6]), value: 6 },
    { label: $t("code_indent_width", [8]), value: 8 },
];

export default function Code() {
    const action = useAction(initial);
    const [editorReload, setEditorReload] = ReactUseState(0);
    const previousSqlLanguage = useRef(action.current.option.sql.language);

    useEffect(() => {
        if (previousSqlLanguage.current !== action.current.option.sql.language) {
            previousSqlLanguage.current = action.current.option.sql.language;
            setEditorReload((value) => value + 1);
        }
    }, [action.current.option.sql.language]);

    const isEnableCompress = useMemo(
        () => formatter.languages[action.current.language].compress,
        [action.current.language],
    );
    const isEnableBeautify = useMemo(
        () => formatter.languages[action.current.language].beautify,
        [action.current.language],
    );

    const editorLanguage = useCallback(() => {
        if (action.current.language !== "sql") return undefined;
        switch (action.current.option.sql.language) {
            case "mysql": return "MySQL";
            case "mariadb": return "MariaDB SQL";
            case "plsql": return "PLSQL";
            case "postgresql": return "PostgreSQL";
            case "sqlite": return "SQLite";
        }
    }, [action.current.language, action.current.option.sql.language]);

    const handle = useCallback(async (type: "beautify" | "compress") => {
        if (action.current.input.trim() === "") return;
        const formatterHandle = await formatter.load(action.current.language);
        const result = await formatterHandle
            .set(action.current.input, action.current.option[action.current.language])
            .format(type);
        if (result === "") throw new Error("result empty");
        action.current.input = result;
        action.success();
    }, [action]);

    return (
        <div className="lumia-generator-editor-family lumia-editor-page lumia-code-formatter-page">
            <header className="lumia-editor-command-toolbar" aria-label={$t("main_ui_setting")}>
                <Align>
                    <Select
                        size="small"
                        dialog
                        value={action.current.language}
                        onChange={(value: Languages) => { action.current.language = value; }}
                        options={languageLists.map((name) => ({ value: name, label: getDisplayName(name) }))}
                    />
                    <Select
                        size="small"
                        value={action.current.option[action.current.language].tab}
                        onChange={(value: number) => { action.current.option[action.current.language].tab = value; }}
                        options={tabOptions}
                    />
                    {action.current.language === "sql" && (
                        <Select
                            size="small"
                            value={action.current.option.sql.language}
                            onChange={(value: OptionMap["sql"]["language"]) => { action.current.option.sql.language = value; }}
                            options={sqlLanguages}
                        />
                    )}
                    {action.current.language === "xml" && (
                        <Bool
                            size="small"
                            value={action.current.option.xml.collapse_content}
                            onChange={(value: boolean) => { action.current.option.xml.collapse_content = value; }}
                            label={$t("code_xml_collapse_content")}
                        />
                    )}
                    {isEnableBeautify && <Button type="primary" size="small" onClick={() => void handle("beautify")}>{$t("code_beautify")}</Button>}
                    {isEnableCompress && <Button size="small" onClick={() => void handle("compress")}>{$t("code_compress")}</Button>}
                </Align>
            </header>
            <section className="lumia-editor-surface">
                <HeightResize>
                    {({ height }) => (
                        <Editor
                            value={action.current.input}
                            onChange={(value: string) => { action.current.input = value; }}
                            langCallback={editorLanguage}
                            reload={editorReload}
                            lang={action.current.language}
                            height={`${height}px`}
                        />
                    )}
                </HeightResize>
            </section>
        </div>
    );
}

function ReactUseState<T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    return useStateImport(initialValue);
}

import { useState as useStateImport } from "react";
import type React from "react";
