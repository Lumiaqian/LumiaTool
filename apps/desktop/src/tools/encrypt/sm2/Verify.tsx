import { useEffect, useMemo } from "react";
import { Align, Card, HeightResize, HelpTip, Input, TextInput, TextOutput } from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import { sm2 } from "sm-crypto";

const initial = await initialize({
    sourceData: createTextInput("text"),
    signValue: createTextInput("hex"),
    option: {
        public_key: "",
        user_id: "1234567812345678",
    },
    output: createTextOutput("text"),
});

export default function Verify() {
    const action = useAction(initial);
    const sourceText = action.current.sourceData.text;
    const signatureText = action.current.signValue.text;
    const publicKeyValue = action.current.option.public_key;
    const userId = action.current.option.user_id;

    const output = useMemo(() => {
        if (sourceText.isEmpty() || signatureText.isEmpty() || publicKeyValue === "") {
            return Text.empty();
        }
        if (sourceText.isError()) {
            return sourceText;
        }
        if (signatureText.isError()) {
            return signatureText;
        }
        try {
            let publicKey = publicKeyValue;
            if (publicKey.length === 128) {
                publicKey = `04${publicKey}`;
            } else if (publicKey.length !== 130 || !publicKey.startsWith("04")) {
                return Text.fromError($error($t("public_key_error")));
            }
            const verify = sm2.doVerifySignature as unknown as (
                message: number[],
                signature: string,
                publicKey: string,
                options: { hash: boolean; userId: string },
            ) => boolean;
            const valid = verify(sourceText.toArray(), signatureText.toHexString(), publicKey, { hash: true, userId });
            return Text.fromString($t(valid ? "sign_verify_ok" : "sign_verify_fail"));
        } catch (error) {
            return Text.fromError($error(error));
        }
    }, [sourceText, signatureText, publicKeyValue, userId]);

    useEffect(() => {
        if (!output.isEmpty()) {
            action.save();
        }
    }, [action, output]);

    return (
        <HeightResize ignore append={[".ctool-page-option"]} reduce={10}>
            {({ small, large }) => (
                <Align direction="vertical">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        <TextInput
                            value={action.current.sourceData}
                            onChange={(value) => { action.current.sourceData = value; }}
                            height={large}
                            placeholder={$t("sm2_source_data")}
                            upload="file"
                        />
                        <TextInput
                            value={action.current.signValue}
                            onChange={(value) => { action.current.signValue = value; }}
                            height={large}
                            placeholder={$t("sm2_sign_value")}
                            allow={["hex", "base64"]}
                        />
                    </div>
                    <Card
                        title={$t("main_ui_config")}
                        className="ctool-page-option"
                        extra={<Align><HelpTip link="https://github.com/JuneAndGreen/sm-crypto" /></Align>}
                    >
                        <Align horizontal="center">
                            <Input
                                value={action.current.option.public_key}
                                onChange={(value) => { action.current.option.public_key = value; }}
                                label={$t("sm2_public_key")}
                            />
                            <Input
                                value={action.current.option.user_id}
                                onChange={(value) => { action.current.option.user_id = value; }}
                                label={$t("sm2_userId")}
                            />
                        </Align>
                    </Card>
                    <TextOutput
                        value={action.current.output}
                        onChange={(value) => { action.current.output = value; }}
                        allow={["hex"]}
                        content={output}
                        height={small}
                    />
                </Align>
            )}
        </HeightResize>
    );
}
