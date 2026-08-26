import { useEffect, useMemo } from "react";
import { HelpTip, Input, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { rabbit } from "../cryptoJS";
import type { Option } from "../cryptoJS";

const option: Option = { key: "" };
const initial = await initialize({ input: createTextInput("base64"), option, output: createTextOutput("text") });

function Decrypt() {
    const action = useAction(initial);
    const { input, option: currentOption } = action.current;
    const output = useMemo(() => {
        if (input.text.isEmpty() || currentOption.key === "") return Text.empty();
        if (input.text.isError()) return input.text;
        try {
            return Text.fromBase64(rabbit.decrypt(input.text.toBase64(), currentOption));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [input.text, currentOption.key]);
    useEffect(() => { if (!output.isEmpty()) action.save(); }, [action, output]);

    return (
        <TransformerPage
            rack={<Input value={currentOption.key} onChange={(value) => { action.current.option.key = value; }} label="key" suffix={<HelpTip link="https://github.com/brix/crypto-js" />} />}
            source={<TextInput value={input} onChange={(value) => { action.current.input = value; }} allow={["base64", "hex"]} height="100%" />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text"]} content={output} height="100%" encoding />}
        />
    );
}

export default Decrypt;
