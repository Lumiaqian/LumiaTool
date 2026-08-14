import { useEffect } from "react";
import { Align, Editor, HeightResize, TextInput } from "@/components";
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
        <HeightResize ignore append={[".ctool-page-option"]} reduce={10}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} placeholder={$t("asn1_input_der_text")} allow={["hex", "base64"]} />
                    <Editor
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; void format(); }}
                        lang={action.current.language}
                        disableLineNumbers
                        height={large}
                        placeholder={$t("asn1_output_result")}
                    />
                </Align>
            )}
        </HeightResize>
    );
}
