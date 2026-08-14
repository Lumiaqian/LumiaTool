import { useEffect, useMemo } from "react";
import { Align, HeightResize, Input, SerializeOutput, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { createSerializeOutput } from "@/components/serialize";
import Serialize from "@/lib/serialize";

const initial = await initialize(
    { input: "", querySerializeOption: createSerializeOutput("json") },
    { paste: item => item.includes("://") },
);

export default function UrlParse() {
    const action = useAction(initial);
    const output = useMemo(() => {
        const input = action.current.input.trim();
        if (input === "") {
            return { base: "", path: "", query: Serialize.formQueryString(""), hash: "" };
        }
        try {
            const url = new URL(action.current.input);
            return {
                base: url.origin,
                path: url.pathname,
                query: Serialize.formQueryString((url.search.startsWith("?") ? url.search.substring(1) : url.search) || ""),
                hash: url.hash,
            };
        } catch (error) {
            return { base: $error(error), path: "", query: Serialize.formQueryString(""), hash: "" };
        }
    }, [action.current.input]);

    useEffect(() => {
        try {
            new URL(action.current.input);
            action.save();
        } catch {
            // Invalid URLs are intentionally not saved.
        }
    }, [action, action.current.input]);

    return (
        <HeightResize reduce={5} ignore>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <Textarea height={small} placeholder={$t("main_ui_input")} value={action.current.input} onChange={value => { action.current.input = value; }} />
                    <div style={{ height: `${large}px`, display: "grid", gridTemplateRows: "auto minmax(0,1fr)", gap: "5px" }}>
                        <Align direction="vertical">
                            <Input label="Base" value={output.base} />
                            <Input label="Path" value={output.path} />
                            <Input label="Hash" value={output.hash} />
                        </Align>
                        <SerializeOutput
                            placeholder="Query"
                            content={output.query}
                            value={action.current.querySerializeOption}
                            onChange={value => { action.current.querySerializeOption = value; }}
                            onSuccess={() => action.save()}
                        />
                    </div>
                </Align>
            )}
        </HeightResize>
    );
}
