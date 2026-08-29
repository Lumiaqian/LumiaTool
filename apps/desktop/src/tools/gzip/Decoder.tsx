import { useMemo } from "react";
import { HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import pako from "pako";

const initial = await initialize({
    input: createTextInput("base64"),
    output: createTextOutput("text"),
});

export default function Decoder() {
    const action = useAction(initial);
    const inputText = action.current.input.text;

    const output = useMemo(() => {
        if (inputText.isEmpty()) return Text.empty();
        if (inputText.isError()) return inputText;
        try {
            return Text.fromUint8Array(pako.inflate(inputText.toUint8Array()));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText]);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout" reduce={5}>
                {({ small, large }) => (
                    <div className="lumia-transformer-panes">
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextInput
                                    value={action.current.input}
                                    onChange={(value) => { action.current.input = value; }}
                                    height={small}
                                    upload="file"
                                    allow={["base64", "hex", "upload", "url"]}
                                    encoding
                                />
                            </div>
                        </section>
                        <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextOutput
                                    value={action.current.output}
                                    onChange={(value) => { action.current.output = value; }}
                                    allow={["text"]}
                                    content={output}
                                    height={large}
                                    onSuccess={() => { action.save(); }}
                                    encoding
                                />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
