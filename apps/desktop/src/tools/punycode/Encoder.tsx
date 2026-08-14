import { useMemo } from "react";
import { Align, HeightResize, TextInput, TextOutput } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { toASCII } from "punycode/";

const initial = await initialize({
    input: createTextInput("text"),
    output: createTextOutput("text"),
});

export default function Encoder(): React.ReactElement {
    const action = useAction(initial);
    const output = useMemo((): Text => {
        if (action.current.input.text.isEmpty()) return Text.empty();
        if (action.current.input.text.isError()) return action.current.input.text;
        try {
            return Text.fromString(toASCII(action.current.input.text.toString()));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [action.current.input.text]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} allow={["text"]} height={small} />
                    <TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text"]} content={output} height={large} onSuccess={() => action.save()} />
                </Align>
            )}
        </HeightResize>
    );
}
