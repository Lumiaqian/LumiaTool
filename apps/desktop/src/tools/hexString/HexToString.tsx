import { Align, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: createTextInput("hex"),
    output: createTextOutput("text"),
});

export default function HexToString() {
    const action = useAction(initial);

    return (
        <HeightResize reduce={5}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput
                        allow={["hex"]}
                        value={action.current.input}
                        onChange={(value) => { action.current.input = value; }}
                        height={small}
                        upload="file"
                    />
                    <TextOutput
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; }}
                        allow={["text", "base64"]}
                        content={action.current.input.text}
                        height={large}
                        onSuccess={() => { action.save(); }}
                        encoding
                    />
                </Align>
            )}
        </HeightResize>
    );
}
