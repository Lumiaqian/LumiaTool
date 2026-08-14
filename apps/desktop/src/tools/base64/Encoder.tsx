import { Align, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: createTextInput(),
    output: createTextOutput("base64"),
});

export default function Encoder() {
    const action = useAction(initial);
    return (
        <HeightResize reduce={5}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput allow={["text", "hex", "upload", "url"]} value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} upload="file" encoding />
                    <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["base64"]} content={action.current.input.text} height={large} onSuccess={() => action.save()} />
                </Align>
            )}
        </HeightResize>
    );
}
