import { useEffect, useMemo } from "react";
import { Align, Bool, HelpTip, Input, Select, Tabs, TextInput, TextOutput, Tooltip } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import TransformerPage from "@/design-system/TransformerPage";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { aes, keySizeLists, modeLists, paddingLists } from "../cryptoJS";
import type { Option } from "../cryptoJS";

const option: Option = {
    iv: "",
    type: "advanced",
    key: "",
    fill: true,
    mode: "CBC",
    padding: "Pkcs7",
    key_size: "128",
};

const initial = await initialize({
    input: createTextInput("base64"),
    option,
    output: createTextOutput("text"),
});

function Decrypt() {
    const action = useAction(initial);
    const { input, option: currentOption } = action.current;

    const output = useMemo(() => {
        if (
            input.text.isEmpty() ||
            currentOption.key === "" ||
            (currentOption.type === "advanced" && currentOption.mode !== "ECB" && currentOption.iv === "")
        ) {
            return Text.empty();
        }
        if (input.text.isError()) {
            return input.text;
        }
        try {
            return Text.fromBase64(aes.decrypt(input.text.toBase64(), currentOption));
        } catch (caught) {
            return Text.fromError($error(caught));
        }
    }, [input.text, currentOption.fill, currentOption.iv, currentOption.key, currentOption.key_size, currentOption.mode, currentOption.padding, currentOption.type]);

    useEffect(() => {
        if (!output.isEmpty()) {
            action.save();
        }
    }, [action, output]);

    return (
        <TransformerPage
            rack={(
                <Tabs
                    value={currentOption.type}
                    onChange={(value) => { action.current.option.type = value; }}
                    lists={[{ name: "advanced", label: $t("main_ui_advanced") }, { name: "simple", label: $t("main_ui_simple") }]}
                    extra={<HelpTip link="https://github.com/brix/crypto-js" />}
                    padding="0"
                >
                    <Align>
                        <Select value={currentOption.mode} onChange={(value) => { action.current.option.mode = value; }} options={modeLists} />
                        <Select value={currentOption.key_size} onChange={(value) => { action.current.option.key_size = value; }} options={keySizeLists} />
                        <Select value={currentOption.padding} onChange={(value) => { action.current.option.padding = value; }} options={paddingLists} />
                        <Input value={currentOption.key} onChange={(value) => { action.current.option.key = value; }} width={220} label="key" />
                        <Input
                            value={currentOption.iv}
                            onChange={(value) => { action.current.option.iv = value; }}
                            width={220}
                            label="iv"
                            disabled={currentOption.mode === "ECB"}
                            append={<Tooltip content={$t("aes_iv_auto_fill")}><Bool value={currentOption.fill} onChange={(value) => { action.current.option.fill = value; }} disabled={currentOption.mode === "ECB"} /></Tooltip>}
                        />
                    </Align>
                    <Input value={currentOption.key} onChange={(value) => { action.current.option.key = value; }} label="key" />
                </Tabs>
            )}
            source={<TextInput value={input} onChange={(value) => { action.current.input = value; }} allow={["base64", "hex"]} height="100%" />}
            result={<TextOutput value={action.current.output} onChange={(value) => { action.current.output = value; }} allow={["text"]} content={output} height="100%" encoding />}
        />
    );
}

export default Decrypt;
