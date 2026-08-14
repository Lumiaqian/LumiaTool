import { useEffect, useMemo } from "react";
import { Align, HeightResize, Textarea } from "@/components";
import strictUriEncode from "strict-uri-encode";
import { useAction, initialize } from "@/store/action";

const initial = await initialize({ input: "" });

export default function Encoder() {
    const action = useAction(initial);
    const output = useMemo(() => {
        if (action.current.input === "") return "";
        try {
            return strictUriEncode(action.current.input);
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input]);

    useEffect(() => {
        if (action.current.input !== "") action.save();
    }, [action, action.current.input]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <Textarea value={action.current.input} onChange={value => { action.current.input = value; }} height={small} placeholder={$t("main_ui_input")} />
                    <Textarea value={output} height={large} placeholder={$t("main_ui_output")} copy={!!output} />
                </Align>
            )}
        </HeightResize>
    );
}
