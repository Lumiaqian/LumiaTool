import { useEffect, useState } from "react";
import { Align, Card, Exception, HeightResize, Textarea, TextInput } from "@/components";
import { createTextInput } from "@/components/text";
import { initialize, useAction } from "@/store/action";
import { parser } from "./util";

const initial = await initialize(
    {
        input: createTextInput("upload"),
    },
    { paste: false },
);

export default function Parse() {
    const action = useAction(initial);
    const [output, setOutput] = useState("");
    const text = action.current.input.text;

    useEffect(() => {
        if (text.isEmpty() || text.isError()) {
            setOutput(text.toString());
            return;
        }
        if (!text.isImage()) {
            setOutput($t("qrCode_reader_parsing_failure"));
            return;
        }
        parser(text)
            .then(data => {
                setOutput(data);
                action.save();
            })
            .catch(error => {
                setOutput($error(error));
            });
    }, [action, text]);

    return (
        <HeightResize reduce={5} ignore className="lumia-generator-editor-family lumia-qr-parser-page">{({ height, small, large }) => (
            <>
                <Align direction="vertical">
                    <TextInput
                        allow={["base64", "hex", "upload", "url"]}
                        value={action.current.input}
                        onChange={value => {
                            action.current.input = value;
                        }}
                        height={small}
                        upload="image"
                    />
                    <Textarea value={output} placeholder={$t("main_ui_output")} height={large} />
                </Align>
                <Card height={height + 5}>
                    <Align horizontal="center" vertical="center">
                        {text.isImage() ? (
                            <img
                                style={{ maxWidth: "90%", maxHeight: "90%" }}
                                src={text.toDataUrl()}
                            />
                        ) : (
                            <Exception />
                        )}
                    </Align>
                </Card>
            </>
        )}</HeightResize>
    );
}
