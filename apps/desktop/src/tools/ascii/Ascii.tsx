import { useState } from "react";
import { Button, ExtendPage, HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { convent } from "./util";
import type { ConventType } from "./util";
import Reference from "./Reference";

const initial = await initialize<{ input: string; type: ConventType | "" }>({
    type: "",
    input: "",
}, { paste: false });

const outputTypes: ConventType[] = ["bin", "oct", "dec", "hex"];

export default function Ascii() {
    const action = useAction(initial);
    const [showReference, setShowReference] = useState(false);

    const getHandle = (target: ConventType) => {
        if (action.current.type === "" || action.current.input === "") return "";
        if (action.current.type === target) return action.current.input;
        try {
            return convent(action.current.input, action.current.type, target);
        } catch (error) {
            return $error(error);
        }
    };

    const setHandle = (source: ConventType, value: string) => {
        action.current.input = value;
        action.current.type = source;
        if (value !== "") action.save();
    };

    return (
        <>
            <div className="ctool-inspector-utility-family ctool-inspector-family-page ctool-ascii-page">
                <HeightResize className="ctool-inspector-family-fill">
                    {() => (
                        <div className="ctool-inspector-family-split">
                            <section className="ctool-inspector-family-panel ctool-inspector-family-source">
                                <header className="ctool-inspector-family-panel-header">
                                    <strong>{$t("ascii_input_str")}</strong>
                                    <Button size="small" onClick={() => setShowReference((current) => !current)} text={$t("main_ui_reference")} />
                                </header>
                                <div className="ctool-inspector-family-panel-body">
                                    <Textarea
                                        value={getHandle("str")}
                                        onChange={(next) => setHandle("str", next)}
                                        placeholder={$t("ascii_input_str_prompt")}
                                        height="100%"
                                    />
                                </div>
                            </section>
                            <section className="ctool-inspector-family-panel ctool-inspector-family-result">
                                <header className="ctool-inspector-family-panel-header">
                                    <strong>{$t("main_ui_output")}</strong>
                                </header>
                                <div className="ctool-inspector-family-panel-body ctool-ascii-results">
                                    {outputTypes.map((item) => {
                                        const value = getHandle(item);
                                        return (
                                            <section className="ctool-inspector-family-value" key={item}>
                                                <header>
                                                    <strong>{$t(`ascii_input_${item}`)}</strong>
                                                    <Button size="small" type="primary" onClick={() => $copy(value)} text={$t("main_ui_copy")} />
                                                </header>
                                                <Textarea
                                                    value={value}
                                                    onChange={(next) => setHandle(item, next)}
                                                    placeholder={$t("ascii_input_prompt", [$t(`ascii_input_${item}`)])}
                                                />
                                            </section>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}
                </HeightResize>
            </div>
            <ExtendPage className="ctool-inspector-utility-extend ctool-ascii-reference-page" value={showReference} onChange={setShowReference}>
                <Reference />
            </ExtendPage>
        </>
    );
}
