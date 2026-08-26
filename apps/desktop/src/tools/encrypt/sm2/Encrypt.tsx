import { useEffect, useMemo } from "react";
import { Align, Button, HelpTip, Input, Select, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { sm2 } from "sm-crypto";
import type { CipherMode } from "sm-crypto";

const initial = await initialize({
    input: createTextInput("text"),
    option: {
        public_key: "",
        private_key: "",
        cipher_mode: 1,
    },
    output: createTextOutput("hex"),
});

export default function Encrypt() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const publicKeyValue = action.current.option.public_key;
    const cipherMode = action.current.option.cipher_mode;

    const output = useMemo(() => {
        if (inputText.isEmpty() || publicKeyValue === "") {
            return Text.empty();
        }
        if (inputText.isError()) {
            return inputText;
        }
        try {
            let publicKey = publicKeyValue;
            if (publicKey.length === 128) {
                publicKey = `04${publicKey}`;
            } else if (publicKey.length !== 130 || !publicKey.startsWith("04")) {
                return Text.fromError($error($t("public_key_error")));
            }
            const result = sm2.doEncrypt(inputText.toArray(), publicKey, cipherMode as CipherMode);
            return Text.fromHex(result);
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, publicKeyValue, cipherMode]);

    useEffect(() => {
        if (!output.isEmpty()) {
            action.save();
        }
    }, [action, output]);

    const generateKeypair = () => {
        const keypair = sm2.generateKeyPairHex();
        action.current.option.public_key = keypair.publicKey;
        action.current.option.private_key = keypair.privateKey;
    };

    return (
        <TransformerPage
            rack={(
                <>
                    <Input
                        value={action.current.option.public_key}
                        onChange={(value) => { action.current.option.public_key = value; }}
                        label={$t("sm2_public_key")}
                    />
                    <Input
                        value={action.current.option.private_key}
                        onChange={(value) => { action.current.option.private_key = value; }}
                        label={$t("sm2_private_key")}
                    />
                    <Align>
                        <Select
                            size="small"
                            options={[{ value: 1, label: "C1-C3-C2" }, { value: 0, label: "C1-C2-C3" }]}
                            value={action.current.option.cipher_mode}
                            onChange={(value) => { action.current.option.cipher_mode = value; }}
                        />
                        <Button type="primary" size="small" text={$t("sm2_generate_keypair")} onClick={generateKeypair} />
                        <HelpTip link="https://github.com/JuneAndGreen/sm-crypto" />
                    </Align>
                </>
            )}
            source={<TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} height="100%" upload="file" />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64", "hex"]} content={output} height="100%" />}
        />
    );
}
