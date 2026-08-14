import { useEffect, useState } from "react";
import { Align, HeightResize, HelpTip, Select, TextInput, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput } from "@/components/text";
import { crc, result, crcTypeLists } from "./util";
import type { CrcType } from "./util";
import Input from "@/components/text/input";

const initial = await initialize<{ input: Input; type: CrcType }>({
    input: createTextInput("hex", ""),
    type: "crc32",
}, { paste: false });
const outputTypes = ["Hex", "Dec", "Oct", "Bin"];

export default function Crc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;
    const textSnapshot = text.toString();

    useEffect(() => {
        let active = true;
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return () => { active = false; };
        }
        if (text.isEmpty()) return () => { active = false; };
        void crc(text, action.current.type).then((value) => {
            if (!active) return;
            setOutput(value);
            action.save();
        }).catch((caught: unknown) => {
            if (active) setError($error(caught));
        });
        return () => { active = false; };
    }, [text, textSnapshot, action.current.type]);

    const getResult = (type: string) => error !== "" ? error : output === null ? "" : result(output, type);

    return (
        <HeightResize style={{ display: "grid", gridTemplateColumns: "10fr 14fr" }}>
            {({ height }) => (
                <>
                    <TextInput value={action.current.input} onChange={(value: Input) => { action.current.input = value; }} upload="file" height={height}>
                        <Align>
                            <Select size="small" options={crcTypeLists} value={action.current.type} onChange={(value: CrcType) => { action.current.type = value; }} />
                            <HelpTip link="https://www.npmjs.com/package/crc" />
                        </Align>
                    </TextInput>
                    <Align direction="vertical">
                        {outputTypes.map((key) => <Textarea key={key} value={getResult(key)} height={(height - 15) / 4} placeholder={`${$t("main_ui_output")} ${key}`} copy={key} />)}
                    </Align>
                </>
            )}
        </HeightResize>
    );
}
