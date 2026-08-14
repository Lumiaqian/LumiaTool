import { useEffect, useState } from "react";
import {
    Align,
    Bool,
    Button,
    Display,
    Dropdown,
    Editor,
    ExtendPage,
    HeightResize,
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
        <>
            <div
                className="ctool-page-option"
                style={{
                    marginBottom: 5,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                <Display
                    extra={
                        <Align>
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
                        </Align>
                    }
                >
                    <Textarea
                        height={80}
                        value={action.current.input}
                        onChange={value => {
                            action.current.input = value;
                        }}
                        placeholder={$t("regex_expression")}
                    />
                </Display>
                <Display
                    extra={
                        <Bool
                            border
                            size="small"
                            value={action.current.is_delete}
                            onChange={value => {
                                action.current.is_delete = value;
                            }}
                            label={$t("regex_delete")}
                        />
                    }
                >
                    <Textarea
                        disabled={action.current.is_delete}
                        height={80}
                        value={action.current.replace}
                        onChange={value => {
                            action.current.replace = value;
                        }}
                        placeholder={$t("regex_replace_content")}
                    />
                </Display>
            </div>
            <HeightResize append={[".ctool-page-option"]} style={{ gridTemplateColumns: "1fr 1fr" }}>
                {({ height }) => (
                    <>
                        <Display
                            extra={
                                <Align>
                                    <Bool
                                        border
                                        size="small"
                                        value={action.current.is_global}
                                        onChange={value => {
                                            action.current.is_global = value;
                                        }}
                                        label={$t("regex_global")}
                                    />
                                    <Bool
                                        border
                                        size="small"
                                        value={action.current.is_ignore_case}
                                        onChange={value => {
                                            action.current.is_ignore_case = value;
                                        }}
                                        label={$t("regex_ignore_case")}
                                    />
                                </Align>
                            }
                        >
                            <Editor
                                height={height}
                                value={action.current.content}
                                onChange={value => {
                                    action.current.content = value;
                                }}
                                placeholder={$t("regex_input")}
                            />
                        </Display>
                        <Editor height={height} value={output} placeholder={$t("main_ui_output")} />
                    </>
                )}
            </HeightResize>
            <ExtendPage value={showReference} onChange={setShowReference}>
                <Reference />
            </ExtendPage>
        </>
    );
}
