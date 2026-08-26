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
        <div className="ctool-validation-page ctool-validation-crc-page">
            <section className="ctool-tester-panel ctool-validation-input-panel" aria-labelledby="ctool-crc-input-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-crc-input-title">{$t("main_ui_input")}</strong>
                    <div className="ctool-validation-config">
                        <Select
                            size="small"
                            options={crcTypeLists}
                            value={action.current.type}
                            onChange={(value: CrcType) => { action.current.type = value; }}
                        />
                        <HelpTip link="https://www.npmjs.com/package/crc" />
                    </div>
                </header>
                <div className="ctool-validation-input">
                    <TextInput
                        value={action.current.input}
                        onChange={(value: Input) => { action.current.input = value; }}
                        upload="file"
                        height="100%"
                    />
                </div>
            </section>
            <section className="ctool-tester-panel ctool-validation-results-panel" aria-labelledby="ctool-crc-output-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-crc-output-title">{$t("main_ui_output")}</strong>
                </header>
                {error !== "" && <p className="ctool-tester-error" role="alert">{error}</p>}
                <div className="ctool-tester-results">
                    {outputTypes.map((type) => {
                        const value = error === "" ? getResult(type) : "";
                        return (
                            <article className="ctool-tester-result" key={type}>
                                <h3 className="ctool-tester-result-name">{type}</h3>
                                <output className="ctool-tester-result-value"><code>{value || "—"}</code></output>
                                {value !== "" && (
                                    <button className="ctool-tester-copy" type="button" onClick={() => $copy(value)}>
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
