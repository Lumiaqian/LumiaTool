import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Align, Card, Icon, Input, Select, Textarea, UploadFile } from "@/components";
import { sizeConvert } from "@/components/util";
import Bool from "@/components/ui/Bool";
import Text, { encodings } from "@/lib/text";
import type { TextInputEncoderType, TextInputUpload } from "@/types";
import { isString } from "lodash";
import { createTextInput } from "./index";
import type { TextInput as TextInputModel } from "./index";

export interface TextInputProps {
    value?: TextInputModel;
    onChange?: (value: TextInputModel) => void;
    height?: number | string;
    placeholder?: string;
    disabled?: boolean;
    allow?: TextInputEncoderType[];
    upload?: TextInputUpload;
    encoding?: boolean;
    useInput?: boolean | string;
    children?: ReactNode;
    className?: string;
}

export default function TextInput({
    value,
    onChange,
    height = "",
    placeholder = $t("main_ui_input"),
    disabled = false,
    allow = textInputEncoderLists,
    upload = "none",
    encoding = false,
    useInput = false,
    children,
    className,
}: TextInputProps) {
    const [defaultValue] = useState<TextInputModel>(() => createTextInput());
    const [current, setCurrent] = useState<TextInputModel>(() => value ?? defaultValue);
    const [, forceRender] = useReducer((version: number) => version + 1, 0);
    const currentRef = useRef(current);
    const onChangeRef = useRef(onChange);
    const transformSequence = useRef(0);

    currentRef.current = current;
    onChangeRef.current = onChange;

    const externalOptionSignature = JSON.stringify(value?.option ?? null);
    const optionSignature = JSON.stringify(current.option);

    useEffect(() => {
        if (value && value !== currentRef.current) {
            setCurrent(value);
        }
    }, [value, value?.type, value?.value, externalOptionSignature]);

    useEffect(() => {
        onChangeRef.current?.(currentRef.current);
    }, []);

    useEffect(() => {
        const target = current;
        const sequence = ++transformSequence.current;
        const timer = window.setTimeout(() => {
            const assignText = (text: Text) => {
                if (sequence !== transformSequence.current) {
                    return;
                }
                target.text = text;
                if (currentRef.current === target) {
                    forceRender();
                }
                onChangeRef.current?.(target);
            };

            const transform = async () => {
                if (target.value === "") {
                    assignText(Text.empty());
                    return;
                }

                try {
                    if (target.type === "upload") {
                        if (!(target.value instanceof File)) {
                            throw new Error("error data");
                        }
                        const text = (await Text.fromBlob(target.value)).setFileName(target.value.name);
                        await text.calculateImageSize();
                        assignText(text);
                        return;
                    }

                    if (!isString(target.value)) {
                        throw new Error("error data");
                    }

                    switch (target.type) {
                        case "text":
                            assignText(Text.fromString(target.value, target.option.text.encoding));
                            return;
                        case "base64":
                            assignText(Text.fromBase64(target.value));
                            return;
                        case "hex":
                            assignText(
                                Text.fromHex(target.value, {
                                    preserve_line_breaks: target.option.hex.preserve_line_breaks,
                                }),
                            );
                            return;
                        case "url":
                            assignText(await Text.fromUrl(target.value));
                            return;
                    }
                    throw new Error("error type");
                } catch (error: unknown) {
                    assignText(Text.fromError($error(error)));
                }
            };

            void transform();
        }, 200);

        return () => window.clearTimeout(timer);
    }, [current, current.type, current.value, optionSignature]);

    const typeLists = useMemo(
        () =>
            textInputEncoderLists.filter(
                item => (upload !== "none" || item !== "upload") && allow.includes(item),
            ),
        [allow, upload],
    );

    const style = useMemo<CSSProperties>(() => {
        if (!height) {
            return {};
        }
        return { height: sizeConvert(height) };
    }, [height]);

    const mutateCurrent = (mutation: (model: TextInputModel) => void, emitImmediately = false) => {
        mutation(current);
        forceRender();
        if (emitImmediately) {
            onChangeRef.current?.(current);
        }
    };

    const content =
        current.type !== "upload" ? (
            !useInput ? (
                <Textarea
                    value={current.value}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={next => mutateCurrent(model => (model.value = next as TextInputModel["value"]))}
                />
            ) : (
                <Input
                    value={current.value}
                    placeholder={placeholder}
                    disabled={disabled}
                    label={useInput === true ? "" : useInput}
                    onChange={next => mutateCurrent(model => (model.value = next as TextInputModel["value"]))}
                />
            )
        ) : (
            <Card style={{ height: "100%" }}>
                <Align direction="vertical" horizontal="center" vertical="center">
                    <UploadFile
                        value={current.value}
                        onChange={next => mutateCurrent(model => (model.value = next as TextInputModel["value"]))}
                        buttonType="text"
                        type={upload === "none" ? undefined : upload}
                    />
                    <div
                        style={{
                            fontSize: "var(--lumia-font-sm)",
                            color: "var(--lumia-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--lumia-space-2)",
                        }}
                    >
                        {current.type === "upload" && !current.text.isEmpty() ? (
                            <>
                                <Icon name="right" size={14} />
                                {current.text.name() || ""}
                                {current.text.isImage()
                                    ? current.text.imageSizeString
                                        ? `(${current.text.imageSizeString})`
                                        : ""
                                    : null}
                            </>
                        ) : (
                            $t("component_upload_support_paste")
                        )}
                    </div>
                </Align>
            </Card>
        );

    const extra = (
        <Align>
            {encoding && current.type === "text" ? (
                <Select
                    size="small"
                    disabled={disabled}
                    options={encodings}
                    value={current.option.text.encoding}
                    onChange={next =>
                        mutateCurrent(
                            model =>
                                (model.option.text.encoding =
                                    next as TextInputModel["option"]["text"]["encoding"]),
                        )
                    }
                />
            ) : null}
            {current.type === "hex" && isString(current.value) && current.value.includes("\n") ? (
                <Bool
                    size="small"
                    value={current.option.hex.preserve_line_breaks}
                    onChange={next =>
                        mutateCurrent(model => (model.option.hex.preserve_line_breaks = Boolean(next)))
                    }
                    label={$t("component_content_type_hex_preserve_line_breaks")}
                />
            ) : null}
            {typeLists.length > 1 ? (
                <Select
                    size="small"
                    disabled={disabled}
                    value={current.type}
                    onChange={next =>
                        mutateCurrent(
                            model => {
                                model.type = next as TextInputModel["type"];
                                model.value = "";
                                model.text = Text.empty();
                            },
                            true,
                        )
                    }
                    options={typeLists.map(item => ({
                        value: item,
                        label: $t(`component_content_type_${item}`),
                    }))}
                />
            ) : null}
            {children}
        </Align>
    );

    const hasEncoding = encoding && current.type === "text";
    const hasHexBreaks = current.type === "hex" && isString(current.value) && current.value.includes("\n");
    const hasTypeSelect = typeLists.length > 1;
    const hasToolbar = hasEncoding || hasHexBreaks || hasTypeSelect || Boolean(children);

    if (useInput) {
        return (
            <div className={["ctool-text-input-inline", className].filter(Boolean).join(" ")} style={style}>
                {content}
                {hasToolbar ? extra : null}
            </div>
        );
    }


    return (
        <div
            className={["ctool-text-input-frame", hasToolbar ? "" : "ctool-text-input-frame--bare", className]
                .filter(Boolean)
                .join(" ")}
            style={style}
        >
            {hasToolbar ? <div className="ctool-text-input-toolbar">{extra}</div> : null}
            <div className="ctool-text-input-content">{content}</div>
        </div>
    );
}

const textInputEncoderLists: TextInputEncoderType[] = [
    "text",
    "base64",
    "hex",
    "url",
    "upload",
];
