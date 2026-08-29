import { useEffect, useMemo } from "react";
import { HeightResize, Textarea } from "@/components";
import decodeUriComponent from "decode-uri-component";
import { useAction, initialize } from "@/store/action";

const initial = await initialize({ input: "" });

export default function Decoder() {
    const action = useAction(initial);
    const output = useMemo(() => {
        if (action.current.input === "") return "";
        try {
            return decodeUriComponent(action.current.input);
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input]);

    useEffect(() => {
        if (action.current.input !== "") action.save();
    }, [action, action.current.input]);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout" reduce={5}>
                {({ small, large }: { small: number; large: number }) => (
                    <div className="lumia-transformer-panes">
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("main_ui_input")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <Textarea value={action.current.input} onChange={value => { action.current.input = value; }} height={small} placeholder={$t("main_ui_input")} />
                            </div>
                        </section>
                        <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={$t("main_ui_output")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <Textarea value={output} height={large} placeholder={$t("main_ui_output")} copy={!!output} />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
