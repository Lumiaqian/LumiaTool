import { useMemo } from "react";
import { Align, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import pako from "pako";

const initial = await initialize({
    input: createTextInput("base64"),
    output: createTextOutput("text"),
});

export default function Decoder() {
    const action = useAction(initial);
    const inputText = action.current.input.text;

    const output = useMemo(() => {
        if (inputText.isEmpty()) return Text.empty();
        if (inputText.isError()) return inputText;
        try {
            return Text.fromUint8Array(pako.inflate(inputText.toUint8Array()));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput
                        value={action.current.input}
                        onChange={(value) => { action.current.input = value; }}
                        height={small}
                        upload="file"
                        allow={["base64", "hex", "upload", "url"]}
                        encoding
                    />
                    <TextOutput
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; }}
                        allow={["text"]}
                        content={output}
                        height={large}
                        onSuccess={() => { action.save(); }}
                        encoding
                    />
                </Align>
            )}
        </HeightResize>
    );
}
