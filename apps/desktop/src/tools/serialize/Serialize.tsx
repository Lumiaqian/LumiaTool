import { HeightResize, SerializeInput, SerializeOutput } from "@/components";
import { createSerializeInput, createSerializeOutput } from "@/components/serialize";
import { initialize, useAction } from "@/store/action";

const initial = await initialize(
    {
        input: createSerializeInput("json"),
        output: createSerializeOutput("xml"),
    },
    { paste: false },
);

export default function Serialize() {
    const action = useAction(initial);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout">
                {({ small, large }) => (
                    <div className="lumia-transformer-panes">
                        <section
                            className="lumia-transformer-pane lumia-transformer-pane--source"
                            aria-label={$t("main_ui_input")}
                        >
                            <header className="lumia-transformer-pane-header">
                                <strong>{$t("main_ui_input")}</strong>
                            </header>
                            <div className="lumia-transformer-pane-body">
                                <SerializeInput
                                    value={action.current.input}
                                    onChange={value => {
                                        action.current.input = value;
                                    }}
                                    height={small}
                                />
                            </div>
                        </section>
                        <section
                            className="lumia-transformer-pane lumia-transformer-pane--result"
                            aria-label={$t("main_ui_output")}
                        >
                            <header className="lumia-transformer-pane-header">
                                <strong>{$t("main_ui_output")}</strong>
                            </header>
                            <div className="lumia-transformer-pane-body">
                                <SerializeOutput
                                    value={action.current.output}
                                    onChange={value => {
                                        action.current.output = value;
                                    }}
                                    height={large}
                                    content={action.current.input.serialization}
                                    onSuccess={() => action.save()}
                                />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
