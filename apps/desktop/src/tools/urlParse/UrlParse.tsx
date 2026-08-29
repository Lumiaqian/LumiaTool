import { useEffect, useMemo } from "react";
import { HeightResize, Input, SerializeOutput, Textarea } from "@/components";
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
            return { base: "", path: "", query: Serialize.formQueryString(""), hash: "", error: "" };
        }
        try {
            const url = new URL(action.current.input);
            return {
                base: url.origin,
                path: url.pathname,
                query: Serialize.formQueryString((url.search.startsWith("?") ? url.search.substring(1) : url.search) || ""),
                hash: url.hash,
                error: "",
            };
        } catch (error) {
            return { base: "", path: "", query: Serialize.formQueryString(""), hash: "", error: $error(error) };
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
        <div className="lumia-inspector-utility-family lumia-inspector-family-page lumia-url-parse-page">
            <HeightResize className="lumia-inspector-family-fill" ignore>
                {() => (
                    <div className="lumia-inspector-family-split">
                        <section className="lumia-inspector-family-panel lumia-inspector-family-source">
                            <header className="lumia-inspector-family-panel-header">
                                <strong>{$t("main_ui_input")}</strong>
                            </header>
                            <div className="lumia-inspector-family-panel-body">
                                <Textarea height="100%" placeholder={$t("main_ui_input")} value={action.current.input} onChange={value => { action.current.input = value; }} />
                            </div>
                        </section>
                        <section className="lumia-inspector-family-panel lumia-inspector-family-result">
                            <header className="lumia-inspector-family-panel-header">
                                <strong>{$t("main_ui_output")}</strong>
                            </header>
                            <div className="lumia-inspector-family-panel-body lumia-url-parse-result">
                                {output.error !== "" && <p className="lumia-inspector-family-error">{output.error}</p>}
                                <div className="lumia-url-parse-parts">
                                    <Input readOnly label="Base" value={output.base} />
                                    <Input readOnly label="Path" value={output.path} />
                                    <Input readOnly label="Hash" value={output.hash} />
                                </div>
                                <SerializeOutput
                                    placeholder="Query"
                                    content={output.query}
                                    disabledBorder
                                    height="100%"
                                    value={action.current.querySerializeOption}
                                    onChange={value => { action.current.querySerializeOption = value; }}
                                    onSuccess={() => action.save()}
                                />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
