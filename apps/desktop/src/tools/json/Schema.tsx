import { useEffect, useMemo, useState } from "react";
import Ajv from "ajv";
import AjvEn from "ajv-i18n/localize/en";
import AjvZh from "ajv-i18n/localize/zh";
import { Align, Editor, HeightResize, HelpTip } from "@/components";
import Serialize from "@/lib/serialize";
import type { SchemaOptionType } from "@/tools/json/define";
import Json from "@/lib/json";

interface SchemaProps {
    value?: SchemaOptionType;
    onChange?: (value: SchemaOptionType) => void;
    onSuccess?: () => void;
    json?: Serialize;
    height?: number;
}

const defaultOption = (): SchemaOptionType => ({ exp: "", option: {} });

export default function Schema({
    value = defaultOption(),
    onChange,
    onSuccess,
    json = Serialize.empty(),
    height = 0,
}: SchemaProps): React.ReactElement {
    const [output, setOutput] = useState("");
    const ajv = useMemo(() => new Ajv({ allErrors: true, messages: false }), []);

    useEffect(() => {
        if (json.isError()) {
            setOutput(json.error());
            return;
        }
        if (json.isEmpty() || value.exp.trim() === "") {
            setOutput("");
            return;
        }
        try {
            const validate = ajv.compile(Json.parse(value.exp));
            if (validate(json.content())) {
                setOutput("ok ^o^");
            } else {
                ($t("main_locale") === "zh_CN" ? AjvZh : AjvEn)(validate.errors);
                setOutput(ajv.errorsText(validate.errors, { separator: "\n" }));
            }
            onSuccess?.();
        } catch (error) {
            setOutput($error(error));
        }
    }, [ajv, json, value.exp, value.option, onSuccess]);

    return (
        <HeightResize fatherHeight={height} ignore reduce={5} className="lumia-json-schema-workspace">{({ small, large }) => (
            <Align direction="horizontal" width="100%">
                <Editor
                    value={value.exp}
                    onChange={(exp) => onChange?.({ ...value, exp })}
                    disableLineNumbers
                    placeholder={`JSON schema ${$t("main_ui_input")}`}
                    lang="json"
                    height={small}
                />
                <Editor
                    value={output}
                    disableLineNumbers
                    placeholder={`JSON schema validator ${$t("main_ui_output")}`}
                    height={large}
                >
                    <HelpTip link="https://github.com/ajv-validator/ajv" />
                </Editor>
            </Align>
        )}</HeightResize>
    );
}
