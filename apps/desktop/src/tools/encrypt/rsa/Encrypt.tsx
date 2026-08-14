import { useEffect, useMemo } from "react";
import { Align, Display, HeightResize, Select, Textarea, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import jsrsasign from "jsrsasign";

const algNames = [
    { value: "RSA", label: "PKCS1" },
    { value: "RSAOAEP", label: "PKCS1_OAEP" },
];

const initial = await initialize({ input: createTextInput("text"), algName: "RSA", key: "", output: createTextOutput("base64") });

function Encrypt() {
    const action = useAction(initial);
    const { input, key, algName } = action.current;
    const output = useMemo(() => {
        if (input.text.isEmpty() || key.trim() === "") return Text.empty();
        if (input.text.isError()) return input.text;
        try {
            if (!input.text.isText()) throw new Error("input content must text / text file");
            return Text.fromHex(jsrsasign.KJUR.crypto.Cipher.encrypt(input.text.toString(), jsrsasign.KEYUTIL.getKey(key.trim()) as jsrsasign.RSAKey, algName));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [algName, input.text, key]);
    useEffect(() => { if (!output.isEmpty()) action.save(); }, [action, output]);

    return <HeightResize ignore reduce={5}>
        {({ small, large }) => <Align direction="vertical">
            <div data-row="1-1">
                <Textarea height={small} value={key} onChange={(value) => { action.current.key = value; }} placeholder={$t("rsa_public")} />
                <TextInput value={input} onChange={(value) => { action.current.input = value; }} placeholder={$t("rsa_encrypt_input")} height={small} />
            </div>
            <Display position="top-right" toggle extra={<Select size="small" value={algName} onChange={(value) => { action.current.algName = value; }} options={algNames} />}>
                <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64", "hex"]} content={output} height={large} />
            </Display>
        </Align>}
    </HeightResize>;
}

export default Encrypt;
