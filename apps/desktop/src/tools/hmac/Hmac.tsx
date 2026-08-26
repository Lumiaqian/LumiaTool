import { useEffect, useMemo } from "react";
import { TextInput } from "@/components";
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

    const calculation = useMemo(() => {
        const values: Record<methodType, string> = {
            md5: "",
            sha1: "",
            sha256: "",
            sha512: "",
            sm3: "",
            ripemd160: "",
        };
        const errors: Partial<Record<methodType, string>> = {};
        if (action.current.input.text.isEmpty() || action.current.secret.text.isEmpty()) {
            return { values, errors, firstError: "", shouldSave: false };
        }

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
                errors[type] = $error(error);
            }
        }
        const firstError = Object.values(errors)[0] ?? "";
        return { values, errors, firstError, shouldSave: firstError === "" };
    }, [
        action.current.input.text,
        action.current.secret.text,
        action.current.is_uppercase,
        action.current.multiple,
        isAllowMultiple,
    ]);

    useEffect(() => {
        if (calculation.shouldSave) {
            action.save();
        }
    }, [action, calculation]);

    return (
        <div className="ctool-hmac-page">
            <section className="ctool-tester-panel ctool-hmac-input-panel" aria-labelledby="ctool-hmac-input-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-hmac-input-title">{$t("main_ui_input")}</strong>
                </header>
                <div className="ctool-hmac-inputs">
                    <section className="ctool-tester-editor-group" aria-labelledby="ctool-hmac-secret-title">
                        <header className="ctool-tester-editor-header">
                            <strong id="ctool-hmac-secret-title">{$t("hmac_secret")}</strong>
                        </header>
                        <div className="ctool-tester-editor-body">
                            <TextInput
                                value={action.current.secret}
                                onChange={(value) => { action.current.secret = value; }}
                                height="100%"
                                allow={["text", "hex", "base64"]}
                            />
                        </div>
                    </section>
                    <section className="ctool-tester-editor-group" aria-labelledby="ctool-hmac-content-title">
                        <header className="ctool-tester-editor-header">
                            <strong id="ctool-hmac-content-title">{$t("main_ui_input")}</strong>
                        </header>
                        <div className="ctool-tester-editor-body">
                            <TextInput
                                value={action.current.input}
                                onChange={(value) => { action.current.input = value; }}
                                height="100%"
                                upload="file"
                                encoding
                            />
                        </div>
                    </section>
                </div>
                <fieldset className="ctool-tester-options" aria-label={$t("main_ui_setting")}>
                    <label className="ctool-tester-check">
                        <input
                            type="checkbox"
                            checked={action.current.is_uppercase}
                            onChange={(event) => { action.current.is_uppercase = event.target.checked; }}
                        />
                        <span>{$t("hmac_uppercase")}</span>
                    </label>
                    <label className="ctool-tester-check" title={$t("hmac_multiple_tooltip")}>
                        <input
                            type="checkbox"
                            checked={action.current.multiple}
                            disabled={!isAllowMultiple}
                            onChange={(event) => { action.current.multiple = event.target.checked; }}
                        />
                        <span>{$t("hmac_multiple")}</span>
                    </label>
                </fieldset>
            </section>

            <section className="ctool-tester-panel ctool-hmac-results-panel" aria-labelledby="ctool-hmac-results-title">
                <header className="ctool-tester-panel-header">
                    <strong id="ctool-hmac-results-title">{$t("main_ui_output")}</strong>
                </header>
                {calculation.firstError !== "" && (
                    <p className="ctool-tester-error" role="alert">{calculation.firstError}</p>
                )}
                <div className="ctool-tester-results">
                    {methods.map((method) => {
                        const value = calculation.values[method];
                        const error = calculation.errors[method];
                        const labelId = `ctool-hmac-${method}-label`;
                        return (
                            <article
                                className={`ctool-tester-result${error ? " is-error" : ""}`}
                                key={method}
                                aria-labelledby={labelId}
                            >
                                <h3 className="ctool-tester-result-name" id={labelId}>
                                    HMAC-{method.toUpperCase()}
                                </h3>
                                <output className="ctool-tester-result-value" aria-labelledby={labelId}>
                                    <code>{error || value || "—"}</code>
                                </output>
                                {value !== "" && !error && (
                                    <button
                                        className="ctool-tester-copy"
                                        type="button"
                                        onClick={() => $copy(value)}
                                        aria-label={`${$t("main_ui_copy")} HMAC-${method}`}
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
    );
}
