import { useEffect, useState } from "react";
import { Align, HeightResize, Textarea, TextInput } from "@/components";
import { createTextInput } from "@/components/text";
import { initialize, useAction } from "@/store/action";
import { lrc, result } from "./util";

const initial = await initialize(
    {
        input: createTextInput("hex", ""),
    },
    { paste: false },
);

function Lrc() {
    const action = useAction(initial);
    const [output, setOutput] = useState<number | null>(null);
    const [error, setError] = useState("");
    const text = action.current.input.text;

    useEffect(() => {
        setError("");
        setOutput(null);
        if (text.isError()) {
            setError(text.toString());
            return;
        }
        if (text.isEmpty()) {
            return;
        }
        try {
            setOutput(lrc(text));
            action.save();
        } catch (caught) {
            setError($error(caught));
        }
    }, [action, text]);

    const getResult = (type: string) => {
        if (error !== "") {
            return error;
        }
        if (output === null) {
            return "";
        }
        return result(output, type);
    };

    return (
        <HeightResize row="10-14">
            {({ height }) => (
                <>
                    <TextInput
                        value={action.current.input}
                        onChange={(value) => {
                            action.current.input = value;
                        }}
                        upload="file"
                        height={height}
                    />
                    <Align direction="vertical">
                        {(["Hex", "Dec", "Oct", "Bin"] as const).map((key) => (
                            <Textarea
                                key={key}
                                value={getResult(key)}
                                onChange={() => undefined}
                                height={(height - 15) / 4}
                                placeholder={`${$t("main_ui_output")} ${key}`}
                                copy={key}
                            />
                        ))}
                    </Align>
                </>
            )}
        </HeightResize>
    );
}

export default Lrc;
