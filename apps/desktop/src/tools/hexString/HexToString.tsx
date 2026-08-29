import { HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: createTextInput("hex"),
    output: createTextOutput("text"),
});

export default function HexToString() {
    const action = useAction(initial);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout" reduce={5}>
                {({ small, large }) => (
                    <div className="lumia-transformer-panes">
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextInput
                                    allow={["hex"]}
                                    value={action.current.input}
                                    onChange={(value) => { action.current.input = value; }}
                                    height={small}
                                    upload="file"
                                />
                            </div>
                        </section>
                        <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextOutput
                                    value={action.current.output}
                                    onChange={(value) => { action.current.output = value; }}
                                    allow={["text", "base64"]}
                                    content={action.current.input.text}
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
