import { useEffect, useMemo } from "react";
import { Button, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { convent, typeLists } from "@/lib/nameConvert";
import type { TypeLists } from "@/lib/nameConvert";

const initial = await initialize({ input: "" });

const batchConvent = (str: string, type: TypeLists) => str.split("\n").map(source => {
    const line = source.trim();
    return line === "" ? "" : convent(line, type);
}).join("\n");

export default function VariableConversion() {
    const action = useAction(initial);
    const output = useMemo(() => {
        const input = action.current.input.trim();
        const result = typeLists.map(({ value, label }) => ({ key: value, label, value: "" }));
        if (input === "") return result;
        return result.map(item => ({ ...item, value: batchConvent(input, item.key as TypeLists) }));
    }, [action.current.input]);

    useEffect(() => {
        if (action.current.input.trim() !== "") action.save();
    }, [action, action.current.input]);

    return (
        <div className="lumia-inspector-utility-family lumia-variable-page">
            <section className="lumia-inspector-family-panel lumia-inspector-family-source">
                <header className="lumia-inspector-family-panel-header">
                    <strong>{$t("variableConversion_input")}</strong>
                </header>
                <div className="lumia-inspector-family-panel-body">
                    <Textarea
                        height="100%"
                        value={action.current.input}
                        onChange={value => { action.current.input = value; }}
                        placeholder={$t("variableConversion_input_placeholder")}
                    />
                </div>
            </section>
            <div className="lumia-variable-grid">
                {output.map(item => (
                    <section className="lumia-inspector-family-panel" key={item.key}>
                        <header className="lumia-inspector-family-panel-header">
                            <strong>{item.label}</strong>
                            {item.value !== "" ? (
                                <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(item.value)} />
                            ) : null}
                        </header>
                        <div className="lumia-inspector-family-panel-body">
                            <Textarea height="100%" value={item.value} placeholder={item.label} readOnly />
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
