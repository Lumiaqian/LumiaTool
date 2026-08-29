import { useEffect, useState } from "react";
import { TextInput } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput } from "@/components/text";
import { bcc, result } from "./util";

const initial = await initialize({ input: createTextInput("hex", "") }, { paste: false });
const outputTypes = ["Hex", "Dec", "Oct", "Bin"];

export default function Bcc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;
    const textSnapshot = text.toString();

    useEffect(() => {
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return;
        }
        if (text.isEmpty()) return;
        try {
            setOutput(bcc(text));
            action.save();
        } catch (caught) {
            setError($error(caught));
        }
    }, [text, textSnapshot]);

    const getResult = (type: string) => error !== "" ? error : output === null ? "" : result(output, type);

    return (
        <div className="lumia-validation-page lumia-validation-bcc-page">
            <section className="lumia-tester-panel lumia-validation-input-panel" aria-labelledby="lumia-bcc-input-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-bcc-input-title">{$t("main_ui_input")}</strong>
                </header>
                <div className="lumia-validation-input">
                    <TextInput
                        value={action.current.input}
                        onChange={(value: typeof action.current.input) => { action.current.input = value; }}
                        upload="file"
                        height="100%"
                    />
                </div>
            </section>
            <section className="lumia-tester-panel lumia-validation-results-panel" aria-labelledby="lumia-bcc-output-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-bcc-output-title">{$t("main_ui_output")}</strong>
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
