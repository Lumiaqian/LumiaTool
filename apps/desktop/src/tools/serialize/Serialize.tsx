import { HeightResize, SerializeInput, SerializeOutput } from "@/components";
import { createSerializeInput, createSerializeOutput } from "@/components/serialize";
import { initialize, useAction } from "@/store/action";

const initial = await initialize(
    {
        input: createSerializeInput("json"),
        output: createSerializeOutput("xml"),
    },
    { paste: false },
);

export default function Serialize() {
    const action = useAction(initial);

    return (
        <HeightResize className="lumia-transformer-page lumia-transformer-page--legacy" style={{ gridTemplateColumns: "1fr 1fr" }}>{({ height }) => (
            <>
                <SerializeInput
                    value={action.current.input}
                    onChange={value => {
                        action.current.input = value;
                    }}
                    height={height}
                />
                <SerializeOutput
                    value={action.current.output}
                    onChange={value => {
                        action.current.output = value;
                    }}
                    height={height}
                    content={action.current.input.serialization}
                    onSuccess={() => action.save()}
                />
            </>
        )}</HeightResize>
    );
}
