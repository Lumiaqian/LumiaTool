import { useMemo } from "react";
import { Align, Bool, Display, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import pako from "pako";

const initial = await initialize({
    input: createTextInput("text"),
    deflate: false,
    output: createTextOutput("base64"),
});

export default function Encoder() {
    const action = useAction(initial);
    const inputText = action.current.input.text;
    const deflate = action.current.deflate;

    const output = useMemo(() => {
        if (inputText.isEmpty()) return Text.empty();
        if (inputText.isError()) return inputText;
        try {
            if (!inputText.isText()) {
                throw new Error("input content must text / text file");
            }
            const bytes = inputText.toUint8Array();
            const result = Text.fromUint8Array(deflate ? pako.deflate(bytes) : pako.gzip(bytes));
            result.setExtension(".gz");
            return result;
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [inputText, deflate]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <Display
                        extra={(
                            <Bool
                                value={action.current.deflate}
                                onChange={(value) => { action.current.deflate = value; }}
                                label="Deflate"
                            />
                        )}
                    >
                        <TextInput
                            value={action.current.input}
                            onChange={(value) => { action.current.input = value; }}
                            height={small}
                            upload="file"
                            encoding
                        />
                    </Display>
                    <TextOutput
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; }}
                        allow={["base64", "hex", "down"]}
                        content={output}
                        height={large}
                        onSuccess={() => { action.save(); }}
                    />
                </Align>
            )}
        </HeightResize>
    );
}
