import { useEffect, useMemo } from "react";
import { HelpTip, Input, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { sm2 } from "sm-crypto";

const initial = await initialize({
    input: createTextInput("text"),
    option: {
        private_key: "",
        user_id: "1234567812345678",
    },
    output: createTextOutput("hex"),
});

export default function Sign() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const privateKey = action.current.option.private_key;
    const userId = action.current.option.user_id;

    const output = useMemo(() => {
        if (inputText.isEmpty() || privateKey === "") {
            return Text.empty();
        }
        if (inputText.isError()) {
            return inputText;
        }
        try {
            const sign = sm2.doSignature as unknown as (
                message: number[],
                privateKey: string,
                options: { hash: boolean; userId: string },
            ) => string;
            return Text.fromHex(sign(inputText.toArray(), privateKey, { hash: true, userId }));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, privateKey, userId]);

    useEffect(() => {
        if (!output.isEmpty()) {
            action.save();
        }
    }, [action, output]);

    return (
        <TransformerPage
            rack={(
                <>
                    <Input
                        value={action.current.option.private_key}
                        onChange={(value) => { action.current.option.private_key = value; }}
                        label={$t("sm2_private_key")}
                    />
                    <Input
                        value={action.current.option.user_id}
                        onChange={(value) => { action.current.option.user_id = value; }}
                        label={$t("sm2_userId")}
                    />
                    <HelpTip link="https://github.com/JuneAndGreen/sm-crypto" />
                </>
            )}
            source={<TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} height="100%" upload="file" />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64", "hex"]} content={output} height="100%" />}
        />
    );
}
