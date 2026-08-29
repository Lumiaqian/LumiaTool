import { useEffect, useState } from "react";
import { TextInput } from "@/components";
import { createTextInput } from "@/components/text";
import { initialize, useAction } from "@/store/action";
import { lrc, result } from "./util";

const initial = await initialize(
    {
        input: createTextInput("hex", ""),
    },
    { paste: false },
);

function Lrc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;

    useEffect(() => {
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return;
        }
        if (text.isEmpty()) {
            return;
        }
        try {
            setOutput(lrc(text));
            action.save();
        } catch (caught) {
            setError($error(caught));
        }
    }, [action, text]);

    const getResult = (type: string) => {
        if (error !== "") {
            return error;
        }
        if (output === null) {
            return "";
        }
        return result(output, type);
    };

    return (
        <div className="lumia-validation-page lumia-validation-lrc-page">
            <section className="lumia-tester-panel lumia-validation-input-panel" aria-labelledby="lumia-lrc-input-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-lrc-input-title">{$t("main_ui_input")}</strong>
                </header>
                <div className="lumia-validation-input">
                    <TextInput
                        value={action.current.input}
                        onChange={(value) => {
                            action.current.input = value;
                        }}
                        upload="file"
                        height="100%"
                    />
                </div>
            </section>
            <section className="lumia-tester-panel lumia-validation-results-panel" aria-labelledby="lumia-lrc-output-title">
                <header className="lumia-tester-panel-header">
                    <strong id="lumia-lrc-output-title">{$t("main_ui_output")}</strong>
                </header>
                {error !== "" && <p className="lumia-tester-error" role="alert">{error}</p>}
                <div className="lumia-tester-results">
                    {(["Hex", "Dec", "Oct", "Bin"] as const).map((type) => {
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

export default Lrc;
