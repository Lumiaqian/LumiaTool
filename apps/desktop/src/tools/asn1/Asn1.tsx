import { useEffect } from "react";
import { Editor, HeightResize, TextInput } from "@/components";
import { createTextInput } from "@/components/text";
import { initialize, useAction } from "@/store/action";
import formatter from "../code/formatter";
import ASN1 from "./lib/asn1.js";
import ASN1TOXML from "./lib/asn1toxml.js";

const initial = await initialize({
    input: createTextInput("hex"),
    output: "",
    language: "xml",
    formatOption: { tab: 2, collapse_content: true },
});

export default function Asn1() {
    const action = useAction(initial);

    useEffect(() => {
        if (action.current.input.text.isEmpty()) {
            action.current.output = "";
        } else if (action.current.input.text.isError()) {
            action.current.output = "error";
        } else {
            try {
                const asn1 = ASN1.decode(action.current.input.text.toUint8Array());
                action.current.output = ASN1TOXML.decode2Xml(asn1);
            } catch {
                action.current.output = "";
            }
        }
        action.save();
    }, [action.current.input]);

    const format = async () => {
        if (action.current.output !== "") {
            const handle = await formatter.load("xml");
            const result = await handle.set(action.current.output, action.current.formatOption).format("beautify");
            if (result === "") throw new Error("result empty");
            action.current.output = result;
        }
    };

    return (
        <div className="lumia-inspector-utility-family lumia-inspector-family-page lumia-asn1-page">
            <HeightResize className="lumia-inspector-family-fill" ignore>
                {() => (
                    <div className="lumia-inspector-family-split">
                        <section className="lumia-inspector-family-panel lumia-inspector-family-source">
                            <header className="lumia-inspector-family-panel-header">
                                <strong>{$t("asn1_input_der_text")}</strong>
                            </header>
                            <div className="lumia-inspector-family-panel-body">
                                <TextInput
                                    value={action.current.input}
                                    onChange={(value) => { action.current.input = value; }}
                                    height="100%"
                                    placeholder={$t("asn1_input_der_text")}
                                    allow={["hex", "base64"]}
                                />
                            </div>
                        </section>
                        <section className="lumia-inspector-family-panel lumia-inspector-family-result">
                            <header className="lumia-inspector-family-panel-header">
                                <strong>{$t("asn1_output_result")}</strong>
                            </header>
                            <div className="lumia-inspector-family-panel-body">
                                <Editor
                                    value={action.current.output}
                                    onChange={(value) => { action.current.output = value; void format(); }}
                                    lang={action.current.language}
                                    disableLineNumbers
                                    height="100%"
                                    placeholder={$t("asn1_output_result")}
                                />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
