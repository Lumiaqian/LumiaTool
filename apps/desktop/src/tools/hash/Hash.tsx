import { useEffect, useMemo } from "react";
import { Align, Bool, Display, Dropdown, HeightResize, Input, Textarea, TextInput, Tooltip } from "@/components";
import { createTextInput } from "@/components/text";
import Text from "@/lib/text";
import { initialize, useAction } from "@/store/action";
import handle, { methods } from "./util";
import type { methodType } from "./util";

const initial = await initialize({
    input: createTextInput(),
    salt: "",
    salt_exp: "",
    is_salt: false,
    is_uppercase: false,
    multiple: false,
});

const saltExpLists = [
    "hash(hash($input))",
    "hash($input.$salt)",
    "hash(hash($input).$salt)",
    "hash($input).hash($salt)",
    "hash(hash(hash($input)))",
    "hash($salt.$input.$salt)",
    "hash(hash($input.$salt).$salt)",
    "hash($salt.hash($input.$salt).$salt)",
    "hash($salt.hash($salt.$input.$salt).$salt)",
];

function hash(type: methodType, content: Text, salt: string, exp: string, multiple: boolean) {
    if (!multiple) return handle(type, content, salt, exp);
    return content.toString().split("\n").map((item) => (
        handle(type, Text.fromString(item, content.encoding()), salt, exp)
    )).join("\n");
}

export default function Hash() {
    const action = useAction(initial);
    const input = action.current.input;
    const inputText = input.text;
    const inputType = input.type;
    const salt = action.current.salt;
    const configuredSaltExp = action.current.salt_exp;
    const isSalt = action.current.is_salt;
    const isUppercase = action.current.is_uppercase;
    const multiple = action.current.multiple;
    const fileInput = ["upload", "url"].includes(inputType);

    const saltExp = useMemo(() => (!isSalt || fileInput ? "" : configuredSaltExp || ""), [isSalt, fileInput, configuredSaltExp]);
    const isAllowMultiple = useMemo(() => inputType === "text", [inputType]);

    const calculation = useMemo(() => {
        const values: Record<methodType, string> = { md5: "", sha1: "", sha256: "", sha512: "", sm3: "" };
        let hasError = false;
        if (!inputText.isEmpty()) {
            for (const type of methods) {
                try {
                    if (inputText.isError()) throw new Error(inputText.toString());
                    const value = hash(type, inputText, salt, saltExp, isAllowMultiple && multiple);
                    values[type] = isUppercase ? value.toUpperCase() : value.toLowerCase();
                } catch (error) {
                    hasError = true;
                    values[type] = $error(error);
                }
            }
        }
        return { values, shouldSave: !inputText.isEmpty() && !hasError };
    }, [inputText, salt, saltExp, isAllowMultiple, multiple, isUppercase]);

    useEffect(() => {
        if (calculation.shouldSave) action.save();
    }, [action, calculation]);

    return (
        <div className="ctool-hash-workspace">
            <Align direction="vertical">
                <Display
                    extra={(
                        <Align>
                            <Bool size="small" value={action.current.is_salt} onChange={(value) => { action.current.is_salt = value; }} border disabled={fileInput} label={$t("hash_salt")} />
                            <Bool size="small" value={action.current.is_uppercase} onChange={(value) => { action.current.is_uppercase = value; }} border label={$t("hash_uppercase")} />
                            <Tooltip content={$t("hash_multiple_tooltip")}>
                                <Bool disabled={!isAllowMultiple} size="small" value={action.current.multiple} onChange={(value) => { action.current.multiple = value; }} border label={$t("hash_multiple")} />
                            </Tooltip>
                        </Align>
                    )}
                >
                    <HeightResize append={isSalt ? [".ctool-hash-salt"] : []} reduce={isSalt ? 5 : 0}>
                        {({ height }) => (
                            <TextInput value={action.current.input} onChange={(value) => { action.current.input = value; }} height={height} upload="file" encoding />
                        )}
                    </HeightResize>
                </Display>
                {isSalt && (
                    <Align direction="vertical" className="ctool-hash-salt">
                        <Input value={action.current.salt} onChange={(value) => { action.current.salt = value; }} label={$t("hash_salt_value")} disabled={fileInput} />
                        <Input
                            value={action.current.salt_exp}
                            onChange={(value) => { action.current.salt_exp = value; }}
                            label={$t("hash_salt_mode")}
                            disabled={fileInput}
                            append={(
                                <Dropdown
                                    disabled={fileInput}
                                    onSelect={(value) => { action.current.salt_exp = String(value); }}
                                    placeholder={$t("hash_salt_select")}
                                    options={saltExpLists}
                                />
                            )}
                        />
                    </Align>
                )}
            </Align>
            <HeightResize>
                {({ height }) => (
                    <Align direction="vertical">
                        {methods.map((item) => (
                            <Textarea key={item} value={calculation.values[item]} height={(height - 20) / methods.length} placeholder={item} copy={item} />
                        ))}
                    </Align>
                )}
            </HeightResize>
        </div>
    );
}
