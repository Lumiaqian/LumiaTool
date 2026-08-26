import { useEffect, useMemo } from "react";
import { HeightResize, Textarea } from "@/components";
import strictUriEncode from "strict-uri-encode";
import { useAction, initialize } from "@/store/action";

const initial = await initialize({ input: "" });

export default function Encoder() {
    const action = useAction(initial);
    const output = useMemo(() => {
        if (action.current.input === "") return "";
        try {
            return strictUriEncode(action.current.input);
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input]);

    useEffect(() => {
        if (action.current.input !== "") action.save();
    }, [action, action.current.input]);

    return (
        <div className="ctool-transformer-page ctool-transformer-page--paired">
            <HeightResize className="ctool-transformer-layout" reduce={5}>
                {({ small, large }: { small: number; large: number }) => (
                    <div className="ctool-transformer-panes">
                        <section className="ctool-transformer-pane ctool-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="ctool-transformer-pane-body">
                                <Textarea value={action.current.input} onChange={value => { action.current.input = value; }} height={small} placeholder={$t("main_ui_input")} />
                            </div>
                        </section>
                        <section className="ctool-transformer-pane ctool-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="ctool-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="ctool-transformer-pane-body">
                                <Textarea value={output} height={large} placeholder={$t("main_ui_output")} copy={!!output} />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
