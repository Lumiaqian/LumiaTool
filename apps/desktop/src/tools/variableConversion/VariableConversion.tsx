import { useEffect, useMemo } from "react";
import { HeightResize, Textarea } from "@/components";
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
        <HeightResize ignore reduce={5} row="1-1-1-1">
            {({ height }: { height: number }) => (
                <>
                    <Textarea
                        height={height / 2}
                        value={action.current.input}
                        onChange={value => { action.current.input = value; }}
                        placeholder={$t("variableConversion_input_placeholder")}
                        floatText={$t("variableConversion_input")}
                    />
                    {output.map(item => (
                        <Textarea
                            key={item.key}
                            value={item.value}
                            copy={item.label}
                            height={height / 2}
                            floatType="general"
                            placeholder={item.label}
                        />
                    ))}
                </>
            )}
        </HeightResize>
    );
}
