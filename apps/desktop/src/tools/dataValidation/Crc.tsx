import { useEffect, useState } from "react";
import { HelpTip, Select, TextInput } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput } from "@/components/text";
import { crc, result, crcTypeLists } from "./util";
import type { CrcType } from "./util";
import Input from "@/components/text/input";

const initial = await initialize<{ input: Input; type: CrcType }>({
    input: createTextInput("hex", ""),
    type: "crc32",
}, { paste: false });
const outputTypes = ["Hex", "Dec", "Oct", "Bin"];

export default function Crc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;
    const textSnapshot = text.toString();

    useEffect(() => {
        let active = true;
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return () => { active = false; };
        }
        if (text.isEmpty()) return () => { active = false; };
        void crc(text, action.current.type).then((value) => {
            if (!active) return;
            setOutput(value);
            action.save();
        }).catch((caught: unknown) => {
            if (active) setError($error(caught));
        });
        return () => { active = false; };
    }, [text, textSnapshot, action.current.type]);

    const getResult = (type: string) => error !== "" ? error : output === null ? "" : result(output, type);

    return (
        <div className="lumia-validation-page lumia-validation-crc-page">
            <section className="lumia-tester-panel lumia-validation-input-panel" aria-labelledby="lumia-crc-input-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-crc-input-title">{$t("main_ui_input")}</strong>
                    <div className="lumia-validation-config">
                        <Select
                            size="small"
                            options={crcTypeLists}
                            value={action.current.type}
                            onChange={(value: CrcType) => { action.current.type = value; }}
                        />
                        <HelpTip link="https://www.npmjs.com/package/crc" />
                    </div>
                </header>
                <div className="lumia-validation-input">
                    <TextInput
                        value={action.current.input}
                        onChange={(value: Input) => { action.current.input = value; }}
                        upload="file"
                        height="100%"
                    />
                </div>
            </section>
            <section className="lumia-tester-panel lumia-validation-results-panel" aria-labelledby="lumia-crc-output-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-crc-output-title">{$t("main_ui_output")}</strong>
                </header>
                {error !== "" && <p className="lumia-tester-error" role="alert">{error}</p>}
                <div className="lumia-tester-results">
                    {outputTypes.map((type) => {
                        const value = error === "" ? getResult(type) : "";
                        return (
                            <article className="lumia-tester-result" key={type}>
                                <h3 className="lumia-tester-result-name">{type}</h3>
                                <output className="lumia-tester-result-value"><code>{value || "—"}</code></output>
                                {value !== "" && (
                                    <button className="lumia-tester-copy" type="button" onClick={() => $copy(value)}>
                                        {$t("main_ui_copy")}
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
