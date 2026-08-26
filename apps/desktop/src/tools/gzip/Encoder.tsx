import { useMemo } from "react";
import { Bool, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import pako from "pako";

const initial = await initialize({
    input: createTextInput("text"),
    deflate: false,
    output: createTextOutput("base64"),
});

export default function Encoder() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const deflate = action.current.deflate;

    const output = useMemo(() => {
        if (inputText.isEmpty()) return Text.empty();
        if (inputText.isError()) return inputText;
        try {
            if (!inputText.isText()) {
                throw new Error("input content must text / text file");
            }
            const bytes = inputText.toUint8Array();
            const result = Text.fromUint8Array(deflate ? pako.deflate(bytes) : pako.gzip(bytes));
            result.setExtension(".gz");
            return result;
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, deflate]);

    return (
        <div className="ctool-transformer-page ctool-transformer-page--configured">
            <HeightResize className="ctool-transformer-layout" reduce={5}>
                {({ small, large }) => (
                    <div className="ctool-transformer-stage">
                        <div className="ctool-transformer-rack" role="group" aria-label={$t("main_ui_setting")}>
                            <Bool
                                value={action.current.deflate}
                                onChange={(value) => { action.current.deflate = value; }}
                                label="Deflate"
                            />
                        </div>
                        <div className="ctool-transformer-panes">
                            <section className="ctool-transformer-pane ctool-transformer-pane--source" aria-label={$t("main_ui_input")}>
                                <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                                <div className="ctool-transformer-pane-body">
                                    <TextInput
                                        value={action.current.input}
                                        onChange={(value) => { action.current.input = value; }}
                                        height={small}
                                        upload="file"
                                        encoding
                                    />
                                </div>
                            </section>
                            <section className="ctool-transformer-pane ctool-transformer-pane--result" aria-label={$t("main_ui_output")}>
                                <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                                <div className="ctool-transformer-pane-body">
                                    <TextOutput
                                        value={action.current.output}
                                        onChange={(value) => { action.current.output = value; }}
                                        allow={["base64", "hex", "down"]}
                                        content={output}
                                        height={large}
                                        onSuccess={() => { action.save(); }}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
