import { useEffect, useMemo } from "react";
import { HelpTip, Input, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { rabbit } from "../cryptoJS";
import type { Option } from "../cryptoJS";

const option: Option = { key: "" };
const initial = await initialize({ input: createTextInput("text"), option, output: createTextOutput("base64") });

function Encrypt() {
    const action = useAction(initial);
    const { input, option: currentOption } = action.current;
    const output = useMemo<Text>(() => {
        if (input.text.isEmpty() || currentOption.key === "") return Text.empty();
        if (input.text.isError()) return input.text;
        try {
            if (!input.text.isText()) throw new Error("input content must text / text file");
            return Text.fromBase64(rabbit.encrypt(input.text.toBase64(), currentOption));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [input.text, currentOption.key]);
    useEffect(() => { if (!output.isEmpty()) action.save(); }, [action, output]);

    return (
        <TransformerPage
            rack={<Input value={currentOption.key} onChange={(value) => { action.current.option.key = value; }} label="key" suffix={<HelpTip link="https://github.com/brix/crypto-js" />} />}
            source={<TextInput value={input} onChange={(value) => { action.current.input = value; }} height="100%" upload="file" encoding />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64", "hex"]} content={output} height="100%" />}
        />
    );
}

export default Encrypt;
