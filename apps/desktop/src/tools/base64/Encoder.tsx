import { HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: createTextInput(),
    output: createTextOutput("base64"),
});

export default function Encoder() {
    const action = useAction(initial);
    return (
        <div className="ctool-transformer-page ctool-transformer-page--paired">
            <HeightResize className="ctool-transformer-layout" reduce={5}>
                {({ small, large }) => (
                    <div className="ctool-transformer-panes">
                        <section className="ctool-transformer-pane ctool-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="ctool-transformer-pane-body">
                                <TextInput allow={["text", "hex", "upload", "url"]} value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} upload="file" encoding />
                            </div>
                        </section>
                        <section className="ctool-transformer-pane ctool-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="ctool-transformer-pane-body">
                                <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64"]} content={action.current.input.text} height={large} onSuccess={() => action.save()} />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
