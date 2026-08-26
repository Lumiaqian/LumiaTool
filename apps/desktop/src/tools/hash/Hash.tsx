import { useEffect, useMemo } from "react";
import { Dropdown, Input, TextInput } from "@/components";
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

    const saltExp = useMemo(
        () => (!isSalt || fileInput ? "" : configuredSaltExp || ""),
        [isSalt, fileInput, configuredSaltExp],
    );
    const isAllowMultiple = inputType === "text";

    const calculation = useMemo(() => {
        const values: Record<methodType, string> = {
            md5: "",
            sha1: "",
            sha256: "",
            sha512: "",
            sm3: "",
        };
        const errors: Partial<Record<methodType, string>> = {};
        if (!inputText.isEmpty()) {
            for (const type of methods) {
                try {
                    if (inputText.isError()) throw new Error(inputText.toString());
                    const value = hash(type, inputText, salt, saltExp, isAllowMultiple && multiple);
                    values[type] = isUppercase ? value.toUpperCase() : value.toLowerCase();
                } catch (error) {
                    errors[type] = $error(error);
                }
            }
        }
        const firstError = Object.values(errors)[0] ?? "";
        return {
            values,
            errors,
            firstError,
            shouldSave: !inputText.isEmpty() && firstError === "",
        };
    }, [inputText, salt, saltExp, isAllowMultiple, multiple, isUppercase]);
    useEffect(() => {
        if (calculation.shouldSave) action.save();
    }, [calculation]);

    return (
        <div className="ctool-inspector-utility-family ctool-inspector-family-page">
            <div className="ctool-inspector-family-split">
            <section className="ctool-inspector-family-panel ctool-inspector-family-source" aria-labelledby="ctool-hash-input-title">
                <header className="ctool-inspector-family-panel-header">
                    <strong id="ctool-hash-input-title">{$t("main_ui_input")}</strong>
                </header>

                <div className="ctool-inspector-family-panel-body">
                    <TextInput
                        value={action.current.input}
                        onChange={(value) => { action.current.input = value; }}
                        height="100%"
                        upload="file"
                        encoding
                    />
                </div>

                <fieldset className="ctool-tester-options" aria-label={$t("main_ui_setting")}>
                    <label className="ctool-tester-check">
                        <input
                            type="checkbox"
                            checked={isSalt}
                            disabled={fileInput}
                            onChange={(event) => { action.current.is_salt = event.target.checked; }}
                        />
                        <span>{$t("hash_salt")}</span>
                    </label>
                    <label className="ctool-tester-check">
                        <input
                            type="checkbox"
                            checked={isUppercase}
                            onChange={(event) => { action.current.is_uppercase = event.target.checked; }}
                        />
                        <span>{$t("hash_uppercase")}</span>
                    </label>
                    <label className="ctool-tester-check">
                        <input
                            type="checkbox"
                            checked={multiple}
                            disabled={!isAllowMultiple}
                            onChange={(event) => { action.current.multiple = event.target.checked; }}
                        />
                        <span>{$t("hash_multiple")}</span>
                    </label>
                </fieldset>

                {isSalt && !fileInput && (
                    <div className="ctool-utility-inline-fields" role="group" aria-label={$t("hash_salt")}>
                        <Input
                            value={action.current.salt}
                            onChange={(value) => { action.current.salt = value; }}
                            label={$t("hash_salt_value")}
                        />
                        <Input
                            value={action.current.salt_exp}
                            onChange={(value) => { action.current.salt_exp = value; }}
                            label={$t("hash_salt_mode")}
                        />
                        <Dropdown
                            label={$t("hash_salt_select")}
                            onSelect={(value) => { action.current.salt_exp = String(value); }}
                            options={saltExpLists}
                        />
                    </div>
                )}
            </section>

            <section className="ctool-inspector-family-panel" aria-labelledby="ctool-hash-results-title">
                <header className="ctool-inspector-family-panel-header">
                    <strong id="ctool-hash-results-title">{$t("main_ui_output")}</strong>
                </header>
                {calculation.firstError !== "" && (
                    <p className="ctool-tester-error" role="alert">{calculation.firstError}</p>
                )}
                <div className="ctool-tester-results">
                    {methods.map((method) => {
                        const value = calculation.values[method];
                        const error = calculation.errors[method];
                        const labelId = `ctool-hash-${method}-label`;
                        return (
                            <article className={`ctool-tester-result${error ? " is-error" : ""}`} key={method} aria-labelledby={labelId}>
                                <h3 className="ctool-tester-result-name" id={labelId}>{method.toUpperCase()}</h3>
                                <output className="ctool-tester-result-value" aria-labelledby={labelId}>
                                    <code>{error || value || "—"}</code>
                                </output>
                                {value !== "" && !error && (
                                    <button
                                        className="ctool-tester-copy"
                                        type="button"
                                        onClick={() => $copy(value)}
                                        aria-label={`${$t("main_ui_copy")} ${method}`}
                                    >
                                        {$t("main_ui_copy")}
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>
            </div>
        </div>
    );
}
