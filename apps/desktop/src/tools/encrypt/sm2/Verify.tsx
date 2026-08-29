import { useEffect, useMemo } from "react";
import { HelpTip, Input, TextInput, TextOutput } from "@/components";
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
        <div className="lumia-transformer-page lumia-transformer-page--configured">
            <div className="lumia-transformer-layout">
                <div className="lumia-transformer-stage lumia-transformer-stage--verify">
                    <div className="lumia-transformer-rack" role="group" aria-label={$t("main_ui_setting")}>
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
                        <HelpTip link="https://github.com/JuneAndGreen/sm-crypto" />
                    </div>
                    <div className="lumia-transformer-panes">
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("sm2_source_data")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("sm2_source_data")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextInput
                                    value={action.current.sourceData}
                                    onChange={(value) => { action.current.sourceData = value; }}
                                    height="100%"
                                    placeholder={$t("sm2_source_data")}
                                    upload="file"
                                />
                            </div>
                        </section>
                        <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={$t("sm2_sign_value")}>
                            <header className="lumia-transformer-pane-header"><strong>{$t("sm2_sign_value")}</strong></header>
                            <div className="lumia-transformer-pane-body">
                                <TextInput
                                    value={action.current.signValue}
                                    onChange={(value) => { action.current.signValue = value; }}
                                    height="100%"
                                    placeholder={$t("sm2_sign_value")}
                                    allow={["hex", "base64"]}
                                />
                            </div>
                        </section>
                    </div>
                    <section className="lumia-transformer-pane lumia-transformer-pane--result lumia-transformer-result-band" aria-label={$t("main_ui_output")}>
                        <header className="lumia-transformer-pane-header"><strong>{$t("main_ui_output")}</strong></header>
                        <div className="lumia-transformer-pane-body">
                            <TextOutput
                                value={action.current.output}
                                onChange={(value) => { action.current.output = value; }}
                                allow={["hex"]}
                                content={output}
                                height="100%"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
