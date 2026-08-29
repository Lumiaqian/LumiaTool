import { useEffect, useMemo } from "react";
import { HeightResize, Select, Textarea } from "@/components";
import { useAction, initialize } from "@/store/action";
import Unicode, { _typeLists } from "./util";
import type { TypeLists } from "./util";

const initial = await initialize({ input: "", type: "unicode_point_default" });

export default function Decoder() {
    const action = useAction(initial);
    const output = useMemo(() => {
        if (action.current.input === "") return undefined;
        try {
            return Unicode.decode(action.current.input, action.current.type as TypeLists);
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input, action.current.type]);

    useEffect(() => {
        if (action.current.input !== "") action.save();
    }, [action, action.current.input, action.current.type]);

    return (
        <div className="lumia-transformer-page lumia-transformer-page--configured">
            <HeightResize className="lumia-transformer-layout" reduce={5}>
                {({ small, large }: { small: number; large: number }) => (
                    <div className="lumia-transformer-stage">
                        <div className="lumia-transformer-rack" role="group" aria-label={$t("main_ui_setting")}>
                            <Select
                                size="small"
                                value={action.current.type}
                                onChange={value => { action.current.type = value; }}
                                options={_typeLists.map(item => ({ value: item, label: $t(`unicode_mode_${item}`) }))}
                            />
                        </div>
                        <div className="lumia-transformer-panes">
                            <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("main_ui_input")}>
                                <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_input")}</strong></header>
                                <div className="lumia-transformer-pane-body">
                                    <Textarea value={action.current.input} onChange={value => { action.current.input = value; }} placeholder={$t("main_ui_input")} height={small} />
                                </div>
                            </section>
                            <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={$t("main_ui_output")}>
                                <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                                <div className="lumia-transformer-pane-body">
                                    <Textarea value={output} placeholder={$t("main_ui_output")} height={large} copy />
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
