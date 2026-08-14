import { useEffect, useMemo } from "react";
import { Align, Bool, HeightResize, HelpTip, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { sm4 } from "sm-crypto";

const initial = await initialize({
    input: createTextInput("hex"),
    option: {
        key: createTextInput("hex"),
        padding: true,
        is_cbc: false,
        iv: createTextInput("hex"),
    },
    output: createTextOutput("text"),
});

export default function Decrypt() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const keyText = action.current.option.key.text;
    const ivText = action.current.option.iv.text;
    const padding = action.current.option.padding;
    const isCbc = action.current.option.is_cbc;

    const output = useMemo(() => {
        if (inputText.isEmpty() || keyText.isEmpty() || (isCbc && ivText.isEmpty())) {
            return Text.empty();
        }
        if (inputText.isError()) return inputText;
        if (keyText.isError()) return keyText;
        if (isCbc && ivText.isError()) return ivText;
        try {
            const result = sm4.decrypt(inputText.toHexString(), keyText.toHexString(), {
                padding: padding ? "pkcs#5" : "none",
                mode: isCbc ? "cbc" : undefined,
                iv: isCbc ? ivText.toHexString() : undefined,
            });
            if (result === "") throw new Error("Decrypt Failure");
            return Text.fromString(result);
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, keyText, ivText, padding, isCbc]);

    useEffect(() => {
        if (!output.isEmpty()) action.save();
    }, [action, output]);

    return (
        <HeightResize ignore append={[".ctool-page-option"]} reduce={10}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} allow={["hex", "base64"]} />
                    <Align row="1-auto-auto-1-auto" className="ctool-page-option">
                        <TextInput value={action.current.option.key} onChange={(value) => { action.current.option.key = value; }} useInput="Key" allow={["text", "hex", "base64"]} />
                        <Bool value={action.current.option.padding} onChange={(value) => { action.current.option.padding = value; }} label="Padding" border />
                        <Bool value={action.current.option.is_cbc} onChange={(value) => { action.current.option.is_cbc = value; }} label="CBC" border />
                        <TextInput disabled={!action.current.option.is_cbc} value={action.current.option.iv} onChange={(value) => { action.current.option.iv = value; }} useInput="IV" allow={["text", "hex", "base64"]} />
                        <HelpTip link="https://github.com/JuneAndGreen/sm-crypto" />
                    </Align>
                    <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64", "hex", "text"]} content={output} height={large} />
                </Align>
            )}
        </HeightResize>
    );
}
