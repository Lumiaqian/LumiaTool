import { useEffect, useState } from "react";
import { Align, HeightResize, TextInput, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput } from "@/components/text";
import { bcc, result } from "./util";

const initial = await initialize({ input: createTextInput("hex", "") }, { paste: false });
const outputTypes = ["Hex", "Dec", "Oct", "Bin"];

export default function Bcc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;
    const textSnapshot = text.toString();

    useEffect(() => {
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return;
        }
        if (text.isEmpty()) return;
        try {
            setOutput(bcc(text));
            action.save();
        } catch (caught) {
            setError($error(caught));
        }
    }, [text, textSnapshot]);

    const getResult = (type: string) => error !== "" ? error : output === null ? "" : result(output, type);

    return (
        <HeightResize style={{ display: "grid", gridTemplateColumns: "10fr 14fr" }}>
            {({ height }) => (
                <>
                    <TextInput value={action.current.input} onChange={(value: typeof action.current.input) => { action.current.input = value; }} upload="file" height={height} />
                    <Align direction="vertical">
                        {outputTypes.map((key) => <Textarea key={key} value={getResult(key)} height={(height - 15) / 4} placeholder={`${$t("main_ui_output")} ${key}`} copy={key} />)}
                    </Align>
                </>
            )}
        </HeightResize>
    );
}
