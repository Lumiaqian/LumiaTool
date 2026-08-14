import { useMemo } from "react";
import { Align, Bool, Display, HeightResize, Textarea, TextInput, Tooltip } from "@/components";
import { createTextInput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import handle, { methods } from "./util";
import type { methodType } from "./util";

const initial = await initialize({
    input: createTextInput(),
    secret: createTextInput("text"),
    is_uppercase: false,
    multiple: false,
});

const hmac = (type: methodType, content: Text, secret: Text, multiple: boolean): string => {
    if (!multiple) {
        return handle(type, content, secret);
    }
    return content.toString().split("\n").map((item) => {
        return handle(type, Text.fromString(item, content.encoding()), secret);
    }).join("\n");
};

export default function Hmac() {
    const action = useAction(initial);
    const isAllowMultiple = ["text"].includes(action.current.input.type);

    const result = useMemo<Record<methodType, string>>(() => {
        const values: Record<methodType, string> = {
            md5: "",
            sha1: "",
            sha256: "",
            sha512: "",
            sm3: "",
            ripemd160: "",
        };
        if (action.current.input.text.isEmpty() || action.current.secret.text.isEmpty()) {
            return values;
        }

        let isError = false;
        for (const type of methods) {
            try {
                if (action.current.input.text.isError()) {
                    throw new Error(`input:${action.current.input.text.toString()}`);
                }
                if (action.current.secret.text.isError()) {
                    throw new Error(`secret:${action.current.secret.text.toString()}`);
                }
                const temporary = hmac(
                    type,
                    action.current.input.text as Text,
                    action.current.secret.text as Text,
                    isAllowMultiple && action.current.multiple,
                );
                values[type] = action.current.is_uppercase ? temporary.toUpperCase() : temporary.toLowerCase();
            } catch (error: unknown) {
                isError = true;
                values[type] = $error(error);
            }
        }
        if (!isError) {
            action.save();
        }
        return values;
    }, [
        action,
        action.current.input.text,
        action.current.secret.text,
        action.current.is_uppercase,
        action.current.multiple,
        isAllowMultiple,
    ]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "10fr 14fr" }}>
            <Align direction="vertical">
                <TextInput
                    className="ctool-page-option"
                    value={action.current.secret}
                    onChange={(value) => { action.current.secret = value; }}
                    useInput={$t("hmac_secret")}
                    allow={["text", "hex", "base64"]}
                />
                <Display
                    extra={(
                        <Align>
                            <Bool
                                size="small"
                                value={action.current.is_uppercase}
                                onChange={(value) => { action.current.is_uppercase = value; }}
                                border
                                label={$t("hmac_uppercase")}
                            />
                            <Tooltip content={$t("hmac_multiple_tooltip")}>
                                <Bool
                                    disabled={!isAllowMultiple}
                                    size="small"
                                    value={action.current.multiple}
                                    onChange={(value) => { action.current.multiple = value; }}
                                    border
                                    label={$t("hmac_multiple")}
                                />
                            </Tooltip>
                        </Align>
                    )}
                >
                    <HeightResize append={[".ctool-page-option"]} reduce={5}>
                        {({ height }) => (
                            <TextInput
                                value={action.current.input}
                                onChange={(value) => { action.current.input = value; }}
                                height={height}
                                upload="file"
                                encoding
                            />
                        )}
                    </HeightResize>
                </Display>
            </Align>
            <HeightResize>
                {({ height }) => (
                    <Align direction="vertical">
                        {methods.map((item) => (
                            <Textarea
                                key={item}
                                value={result[item]}
                                height={(height - 20) / methods.length}
                                placeholder={`HMAC-${item}`}
                                copy={`HMAC-${item}`}
                            />
                        ))}
                    </Align>
                )}
            </HeightResize>
        </div>
    );
}
