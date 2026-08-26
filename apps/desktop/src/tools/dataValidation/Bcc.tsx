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
        <div className="ctool-validation-page ctool-validation-bcc-page">
            <section className="ctool-tester-panel ctool-validation-input-panel" aria-labelledby="ctool-bcc-input-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-bcc-input-title">{$t("main_ui_input")}</strong>
                </header>
                <div className="ctool-validation-input">
                    <TextInput
                        value={action.current.input}
                        onChange={(value: typeof action.current.input) => { action.current.input = value; }}
                        upload="file"
                        height="100%"
                    />
                </div>
            </section>
            <section className="ctool-tester-panel ctool-validation-results-panel" aria-labelledby="ctool-bcc-output-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-bcc-output-title">{$t("main_ui_output")}</strong>
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
