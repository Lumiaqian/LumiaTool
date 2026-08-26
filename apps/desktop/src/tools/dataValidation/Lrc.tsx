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
        <div className="ctool-validation-page ctool-validation-lrc-page">
            <section className="ctool-tester-panel ctool-validation-input-panel" aria-labelledby="ctool-lrc-input-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-lrc-input-title">{$t("main_ui_input")}</strong>
                </header>
                <div className="ctool-validation-input">
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
            <section className="ctool-tester-panel ctool-validation-results-panel" aria-labelledby="ctool-lrc-output-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-lrc-output-title">{$t("main_ui_output")}</strong>
                </header>
                {error !== "" && <p className="ctool-tester-error" role="alert">{error}</p>}
                <div className="ctool-tester-results">
                    {(["Hex", "Dec", "Oct", "Bin"] as const).map((type) => {
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

export default Lrc;
