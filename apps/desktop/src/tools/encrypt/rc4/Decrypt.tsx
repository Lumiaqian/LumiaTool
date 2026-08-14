import { useEffect, useMemo } from "react";
import { Align, HeightResize, HelpTip, Input, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { rc4 } from "../cryptoJS";
import type { Option } from "../cryptoJS";

const option: Option = { key: "" };
const initial = await initialize({ input: createTextInput("base64"), option, output: createTextOutput("text") });

function Decrypt() {
    const action = useAction(initial);
    const { input, option: currentOption } = action.current;
    const output = useMemo(() => {
        if (input.text.isEmpty() || currentOption.key === "") return Text.empty();
        try {
            if (input.text.isError()) return input.text;
            return Text.fromBase64(rc4.decrypt(input.text.toBase64(), currentOption));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [input.text, currentOption.key]);
    useEffect(() => { if (!output.isEmpty()) action.save(); }, [action, output]);

    return <HeightResize ignore append={[".ctool-page-option"]} reduce={10}>
        {({ small, large }) => <Align direction="vertical">
            <TextInput value={input} onChange={(value) => { action.current.input = value; }} allow={["base64", "hex"]} height={small} />
            <Input className="ctool-page-option" value={currentOption.key} onChange={(value) => { action.current.option.key = value; }} label="key" suffix={<HelpTip link="https://github.com/brix/crypto-js" />} />
            <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text"]} content={output} height={large} encoding />
        </Align>}
    </HeightResize>;
}

export default Decrypt;
