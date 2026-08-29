import { useMemo } from "react";
import { HeightResize, TextInput, TextOutput } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { toUnicode } from "punycode/";

const initial = await initialize({
    input: createTextInput("text"),
    output: createTextOutput("text"),
});

export default function Decoder(): React.ReactElement {
    const action = useAction(initial);
    const output = useMemo((): Text => {
        if (action.current.input.text.isEmpty()) return Text.empty();
        if (action.current.input.text.isError()) return action.current.input.text;
        try {
            return Text.fromString(toUnicode(action.current.input.text.toString()));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [action.current.input.text]);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout" reduce={5}>
                {({ small, large }: { small: number; large: number }) => (
                    <div className="lumia-transformer-panes">
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} allow={["text"]} height={small} />
                            </div>
                        </section>
                        <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text"]} content={output} height={large} onSuccess={() => action.save()} />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
