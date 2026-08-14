import { Align, HeightResize, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: createTextInput("base64"),
    output: createTextOutput(),
});

export default function Decoder() {
    const action = useAction(initial);
    return (
        <HeightResize reduce={5}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput allow={["base64"]} value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} />
                    <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text", "hex", "image", "down"]} content={action.current.input.text} height={large} onSuccess={() => action.save()} encoding />
                </Align>
            )}
        </HeightResize>
    );
}
