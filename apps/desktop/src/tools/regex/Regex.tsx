import { useEffect, useState } from "react";
import {
    Button,
    Dropdown,
    Editor,
    ExtendPage,
    Textarea,
} from "@/components";
import { initialize, useAction } from "@/store/action";
import { getCommonExpression } from "@/tools/regex/util";
import Reference from "./Reference";

const initial = await initialize(
    {
        input: "[\\dheo]",
        content: new Date().getFullYear() + " hello WORLD 你好世界",
        replace: "",
        is_global: true,
        is_ignore_case: true,
        is_delete: false,
    },
    { paste: false },
);

export default function Regex() {
    const action = useAction(initial);
    const [output, setOutput] = useState("");
    const [showReference, setShowReference] = useState(false);

    useEffect(() => {
        setOutput("");
        try {
            const current = action.current;
            if (!current.input || !current.content) {
                return;
            }
            const replace =
                !current.is_delete && current.replace === ""
                    ? false
                    : current.is_delete
                      ? ""
                      : current.replace;
            const reg = new RegExp(
                current.input,
                (current.is_ignore_case ? "i" : "") + (current.is_global ? "g" : ""),
            );
            if (replace !== false) {
                setOutput(current.content.replace(reg, replace));
            } else {
                const matches = current.content.match(reg);
                let result = "";
                if (matches) {
                    result += `${$t("regex_output_count", [matches.length])}`;
                    for (let i = 0; i < matches.length; i++) {
                        result += `\n${matches[i]}`;
                    }
                } else {
                    result = $t("regex_output_empty");
                }
                setOutput(result);
            }
            action.save();
        } catch (error) {
            setOutput($error(error));
        }
    }, [
        action,
        action.current.content,
        action.current.input,
        action.current.is_delete,
        action.current.is_global,
        action.current.is_ignore_case,
        action.current.replace,
    ]);

    return (
        <div className="lumia-regex-page">
            <section className="lumia-regex-toolbar" aria-label={$t("main_ui_setting")}>
                <div className="lumia-regex-control">
                    <header className="lumia-regex-control-header">
                        <strong>{$t("regex_expression")}</strong>
                        <div className="lumia-regex-control-actions">
                            <Dropdown
                                size="small"
                                options={getCommonExpression()}
                                placeholder={$t("regex_common")}
                                onSelect={value => {
                                    action.current.input = String(value);
                                }}
                            />
                            <Button
                                size="small"
                                type="primary"
                                onClick={() => setShowReference(current => !current)}
                                text={$t("main_ui_reference")}
                            />
                        </div>
                    </header>
                    <Textarea
                        height="100%"
                        value={action.current.input}
                        onChange={value => {
                            action.current.input = value;
                        }}
                        placeholder={$t("regex_expression")}
                    />
                </div>
                <div className="lumia-regex-control">
                    <header className="lumia-regex-control-header">
                        <strong>{$t("regex_replace_content")}</strong>
                        <label className="lumia-tester-check">
                            <input
                                type="checkbox"
                                checked={action.current.is_delete}
                                onChange={event => {
                                    action.current.is_delete = event.target.checked;
                                }}
                            />
                            <span>{$t("regex_delete")}</span>
                        </label>
                    </header>
                    <Textarea
                        disabled={action.current.is_delete}
                        height="100%"
                        value={action.current.replace}
                        onChange={value => {
                            action.current.replace = value;
                        }}
                        placeholder={$t("regex_replace_content")}
                    />
                </div>
            </section>
            <div className="lumia-regex-workspace">
                <section className="lumia-tester-panel lumia-regex-editor-panel" aria-labelledby="lumia-regex-input-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-regex-input-title">{$t("regex_input")}</strong>
                        <div className="lumia-tester-checks">
                            <label className="lumia-tester-check">
                                <input
                                    type="checkbox"
                                    checked={action.current.is_global}
                                    onChange={event => {
                                        action.current.is_global = event.target.checked;
                                    }}
                                />
                                <span>{$t("regex_global")}</span>
                            </label>
                            <label className="lumia-tester-check">
                                <input
                                    type="checkbox"
                                    checked={action.current.is_ignore_case}
                                    onChange={event => {
                                        action.current.is_ignore_case = event.target.checked;
                                    }}
                                />
                                <span>{$t("regex_ignore_case")}</span>
                            </label>
                        </div>
                    </header>
                    <div className="lumia-regex-editor">
                        <Editor
                            height="100%"
                            value={action.current.content}
                            onChange={value => {
                                action.current.content = value;
                            }}
                            placeholder={$t("regex_input")}
                        />
                    </div>
                </section>
                <section className="lumia-tester-panel lumia-regex-editor-panel" aria-labelledby="lumia-regex-output-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-regex-output-title">{$t("main_ui_output")}</strong>
                    </header>
                    <div className="lumia-regex-editor">
                        <Editor height="100%" value={output} placeholder={$t("main_ui_output")} />
                    </div>
                </section>
            </div>
            <ExtendPage value={showReference} onChange={setShowReference}>
                <Reference />
            </ExtendPage>
        </div>
    );
}
