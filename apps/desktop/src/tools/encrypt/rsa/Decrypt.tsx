import { useEffect, useMemo } from "react";
import { Select, Textarea, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import jsrsasign from "jsrsasign";

const algNames = [
    { value: "RSA", label: "PKCS1" },
    { value: "RSAOAEP", label: "PKCS1_OAEP" },
];

const initial = await initialize({ input: createTextInput("base64"), algName: "RSA", key: "", output: createTextOutput("text") });

function Decrypt() {
    const action = useAction(initial);
    const { input, key, algName } = action.current;
    const output = useMemo(() => {
        if (input.text.isEmpty() || key.trim() === "") return Text.empty();
        if (input.text.isError()) return input.text;
        try {
            return Text.fromString(jsrsasign.KJUR.crypto.Cipher.decrypt(input.text.toHexString(), jsrsasign.KEYUTIL.getKey(key.trim()) as jsrsasign.RSAKey, algName));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [algName, input.text, key]);
    useEffect(() => { if (!output.isEmpty()) action.save(); }, [action, output]);

    return (
        <TransformerPage
            rack={(
                <>
                    <Select size="small" value={algName} onChange={(value) => { action.current.algName = value; }} options={algNames} />
                    <Textarea className="ctool-transformer-rack-key" height="100%" value={key} onChange={(value) => { action.current.key = value; }} placeholder={$t("rsa_private")} />
                </>
            )}
            source={<TextInput value={input} onChange={(value) => { action.current.input = value; }} placeholder={$t("rsa_decrypt_input")} allow={["base64", "hex"]} height="100%" />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} content={output} height="100%" />}
        />
    );
}

export default Decrypt;
