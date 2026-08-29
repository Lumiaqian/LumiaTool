import { useEffect, useMemo, useState } from "react";
import { Align, Editor, HeightResize, HelpTip, Select } from "@/components";
import { initialize, useAction } from "@/store/action";
import { range } from "lodash";
import { generate, getTarget, targets } from "./util";

const initial = await initialize({
    input: "",
    source: "cURL",
    target: "javascript-|-axios",
}, { paste: false });

export default function HttpSnippet() {
    const action = useAction(initial);
    const [selected, setSelected] = useState(0);

    const targetInfo = useMemo(
        () => getTarget(action.current.target),
        [action.current.target],
    );

    const output = useMemo(() => {
        if (action.current.input === "") {
            return [{ value: "", url: "" }];
        }
        try {
            const result = generate(action.current.input, action.current.source, action.current.target);
            action.save();
            return result;
        } catch (error: unknown) {
            console.log(error);
            return [{ value: $error(error), url: "" }];
        }
    }, [action, action.current.input, action.current.source, action.current.target]);

    useEffect(() => {
        setSelected(0);
    }, [output]);

    const selectedOutput = output[selected] ?? output[0];

    return (
        <div className="lumia-generator-editor-family lumia-editor-page lumia-http-snippet-page">
            <header className="lumia-editor-command-toolbar lumia-http-snippet-toolbar" aria-label={$t("main_ui_setting")}>
                <Align>
                    <HelpTip
                        link={action.current.source === "cURL"
                            ? "https://everything.curl.dev/usingcurl/copyas"
                            : "http://www.softwareishard.com/blog/har-12-spec/#request"}
                    />
                    <Select
                        size="small"
                        options={["cURL", "HAR"]}
                        value={action.current.source}
                        onChange={(value) => { action.current.source = value; }}
                    />
                </Align>
                <Align>
                    {targetInfo.url !== "" && <HelpTip link={targetInfo.url} />}
                    <Select
                        dialog
                        size="small"
                        options={targets}
                        value={action.current.target}
                        onChange={(value) => { action.current.target = value; }}
                    />
                    {output.length > 1 && (
                        <Select
                            size="small"
                            options={range(0, output.length).map((index) => ({
                                value: index,
                                label: `Entry ${index + 1}`,
                                description: output[index].url,
                            }))}
                            value={selected}
                            onChange={(value) => setSelected(Number(value))}
                        />
                    )}
                </Align>
            </header>
            <HeightResize>
                {({ height }) => (
                    <div className="lumia-editor-pair">
                        <Editor
                            lang={action.current.source === "cURL" ? "shell" : "json"}
                            value={action.current.input}
                            onChange={(value) => { action.current.input = value; }}
                            height={height}
                            placeholder={$t("main_ui_input")}
                        />
                        <Editor
                            lang={targetInfo.targetId}
                            value={selectedOutput.value}
                            height={height}
                            placeholder={$t("main_ui_output")}
                        />
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
