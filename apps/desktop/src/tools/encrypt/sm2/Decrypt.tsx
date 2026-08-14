import { useEffect, useMemo } from "react";
import { Align, HeightResize, HelpTip, Input, Select, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { sm2 } from "sm-crypto";
import type { CipherMode } from "sm-crypto";

const initial = await initialize({
    input: createTextInput("hex"),
    option: {
        private_key: "",
        cipher_mode: 1,
    },
    output: createTextOutput("text"),
});

export default function Decrypt() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const privateKey = action.current.option.private_key;
    const cipherMode = action.current.option.cipher_mode;

    const output = useMemo(() => {
        if (inputText.isEmpty() || privateKey === "") {
            return Text.empty();
        }
        try {
            if (inputText.isError()) {
                return inputText;
            }
            const decrypt = sm2.doDecrypt as unknown as (
                encrypted: string,
                privateKey: string,
                cipherMode: CipherMode,
                options: { output: "array" },
            ) => number[] | "";
            const result = decrypt(inputText.toHexString(), privateKey, cipherMode as CipherMode, { output: "array" });
            if (result === "") {
                throw new Error("failure");
            }
            return Text.fromArray(result);
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, privateKey, cipherMode]);

    useEffect(() => {
        if (!output.isEmpty()) {
            action.save();
        }
    }, [action, output]);

    return (
        <HeightResize ignore append={[".ctool-page-option"]} reduce={10}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput
                        value={action.current.input}
                        onChange={(value) => { action.current.input = value; }}
                        allow={["base64", "hex"]}
                        height={small}
                    />
                    <Align row="1-auto-auto" className="ctool-page-option">
                        <Input
                            value={action.current.option.private_key}
                            onChange={(value) => { action.current.option.private_key = value; }}
                            label={$t("sm2_private_key")}
                        />
                        <Select
                            options={[{ value: 1, label: "C1-C3-C2" }, { value: 0, label: "C1-C2-C3" }]}
                            value={action.current.option.cipher_mode}
                            onChange={(value) => { action.current.option.cipher_mode = value; }}
                        />
                        <HelpTip link="https://github.com/JuneAndGreen/sm-crypto" />
                    </Align>
                    <TextOutput
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; }}
                        allow={["text", "hex", "base64", "image", "down"]}
                        content={output}
                        height={large}
                    />
                </Align>
            )}
        </HeightResize>
    );
}
