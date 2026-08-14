import { useEffect, useState } from "react";
import { JSONPath } from "jsonpath-plus";
import jmespath from "jmespath";
import { isObject } from "lodash";
import { Align, Editor, HeightResize, HelpTip, Input } from "@/components";
import type { PathOptionType } from "./define";
import formatter from "../code/formatter";
import Serialize from "@/lib/serialize";

interface PathProps {
    value?: PathOptionType;
    onChange?: (value: PathOptionType) => void;
    onSuccess?: () => void;
    json?: Serialize;
    height?: number;
}

const defaultOption = (): PathOptionType => ({ type: "json_path", json_path: "", jmes_path: "" });

export default function Path({
    value = defaultOption(),
    onChange,
    onSuccess,
    json = Serialize.empty(),
    height = 0,
}: PathProps): React.ReactElement {
    const [output, setOutput] = useState("");
    const [editorHeight, setEditorHeight] = useState(100);

    useEffect(() => {
        let active = true;
        const calculate = async (): Promise<void> => {
            if (json.isError()) {
                setOutput(json.error());
                return;
            }
            if (json.isEmpty()) {
                setOutput("");
                return;
            }
            const jsonPathExp = value.json_path.trim() || "";
            const jmesPathExp = value.jmes_path.trim() || "";
            try {
                let result: unknown;
                if (value.type === "json_path" && jsonPathExp !== "") {
                    result = JSONPath({ path: jsonPathExp, json: json.content() });
                } else if (value.type === "jmes_path" && jmesPathExp !== "") {
                    result = jmespath.search(json.content(), jmesPathExp);
                } else {
                    setOutput("");
                    return;
                }
                const nextOutput = isObject(result)
                    ? await formatter.simple("json", "beautify", result)
                    : String(result);
                if (active) {
                    setOutput(nextOutput);
                    onSuccess?.();
                }
            } catch (error) {
                if (active) setOutput($error(error));
            }
        };
        void calculate();
        return () => { active = false; };
    }, [json, value.type, value.json_path, value.jmes_path, onSuccess]);

    return (
        <div>
            <Align direction="vertical" className="ctool-json-path" bottom="default">
                {value.type === "json_path" && (
                    <Input
                        value={value.json_path}
                        onChange={(json_path) => onChange?.({ ...value, json_path })}
                        label={$t("json_json_path")}
                        append={<HelpTip link="https://www.npmjs.com/package/jsonpath-plus" />}
                    />
                )}
                {value.type === "jmes_path" && (
                    <Input
                        value={value.jmes_path}
                        onChange={(jmes_path) => onChange?.({ ...value, jmes_path })}
                        label={$t("json_jmes_path")}
                        append={<HelpTip link="https://www.npmjs.com/package/jmespath" />}
                    />
                )}
            </Align>
            <HeightResize fatherHeight={height} append={[".ctool-json-path"]} onResize={setEditorHeight}>
                <Editor
                    value={output}
                    placeholder={`${$t(`json_${value.type}`)} ${$t("main_ui_output")}`}
                    lang="json"
                    height={`${editorHeight}px`}
                />
            </HeightResize>
        </div>
    );
}
