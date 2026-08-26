import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
    Align,
    Bool,
    Button,
    Card,
    Exception,
    InputNumber,
    Select,
    Textarea,
} from "@/components";
import { sizeConvert } from "@/components/util";
import { copyImage as copyImageToClipboard } from "@/lib/clipboard";
import Message from "@/lib/message";
import Text, { encodings } from "@/lib/text";
import type { Encoding } from "@/lib/text";
import { textOutputEncoderLists } from "@/types";
import type { TextOutputEncoderType } from "@/types";
import { createTextOutput } from "./index";
import type { TextOutput as TextOutputModel } from "./index";

export interface TextOutputProps {
    value?: TextOutputModel;
    onChange?: (value: TextOutputModel) => void;
    onSuccess?: () => void;
    height?: string | number;
    placeholder?: string;
    allow?: TextOutputEncoderType[];
    content?: Text;
    encoding?: boolean;
}

export default function TextOutput({
    value,
    onChange,
    onSuccess,
    height = "",
    placeholder = $t("main_ui_output"),
    allow = textOutputEncoderLists,
    content = Text.empty(),
    encoding = false,
}: TextOutputProps) {
    const [defaultValue] = useState<TextOutputModel>(() => createTextOutput());
    const current = value ?? defaultValue;
    const [, forceRender] = useReducer((version: number) => version + 1, 0);
    const [exception, setException] = useState("");
    const [result, setResult] = useState("");
    const [analyseEncoding, setAnalyseEncoding] = useState<Encoding>("utf-8");
    const onChangeRef = useRef(onChange);
    const onSuccessRef = useRef(onSuccess);
    const conversionSequence = useRef(0);

    onChangeRef.current = onChange;
    onSuccessRef.current = onSuccess;

    const optionSignature = JSON.stringify(current.option);
    const typeLists = useMemo(
        () => textOutputEncoderLists.filter(item => allow.includes(item)),
        [allow],
    );

    useEffect(() => {
        const sequence = ++conversionSequence.current;
        const data = content;
        const type = current.type;
        const option = current.option;
        setException("");

        if (data.isError() || data.isEmpty()) {
            setResult("");
            return;
        }

        const convert = async () => {
            try {
                let converted = "";
                switch (type) {
                    case "text": {
                        const detectedEncoding = data.analyseEncoding();
                        if (sequence !== conversionSequence.current) {
                            return;
                        }
                        setAnalyseEncoding(detectedEncoding);
                        converted = encoding
                            ? data.toString(
                                  option.text.encoding === "analyse"
                                      ? detectedEncoding
                                      : option.text.encoding,
                              )
                            : data.toString();
                        break;
                    }
                    case "base64":
                        converted = data.toBase64(
                            option.base64.is_url_safe,
                            option.base64.data_url_show,
                        );
                        break;
                    case "hex":
                        converted = data.toHex(option.hex);
                        break;
                    case "image":
                        if (!data.isImage()) {
                            throw new Error("Not Image File");
                        }
                        await data.calculateImageSize();
                        converted = data.toDataUrl();
                        break;
                }

                if (sequence === conversionSequence.current && converted !== "") {
                    onSuccessRef.current?.();
                    setResult(converted);
                }
            } catch (error: unknown) {
                if (sequence === conversionSequence.current) {
                    setException($error(error));
                }
            }
        };

        void convert();
    }, [content, current.type, optionSignature, encoding]);

    const style = useMemo<CSSProperties>(() => {
        if (!height) {
            return {};
        }
        return { height: sizeConvert(height) };
    }, [height]);

    const error = content.isEmpty()
        ? ""
        : content.isError()
          ? `${content.toString()}`
          : exception !== ""
            ? `${exception}`
            : "";

    const mutateCurrent = (mutation: (model: TextOutputModel) => void) => {
        mutation(current);
        forceRender();
        onChangeRef.current?.(current);
    };

    const copyImage = (base64: string) => {
        copyImageToClipboard(base64, () => {
            Message.success($t("main_ui_copy_image_ok"));
        });
    };

    const down = () => {
        setException("");
        try {
            content.toDown();
            onSuccessRef.current?.();
        } catch (caught: unknown) {
            setException($error(caught));
        }
    };

    const hexType = [
        { value: "hex", label: $t("component_content_output_hex_hex") },
        { value: "dump", label: $t("component_content_output_hex_dump") },
    ];
    const hexCaps = [
        { value: "lower", label: $t("component_content_output_hex_lower") },
        { value: "upper", label: $t("component_content_output_hex_upper") },
    ];
    const hexFormat = [
        { value: "twos", label: $t("component_content_output_hex_dump_format_twos") },
        { value: "fours", label: $t("component_content_output_hex_dump_format_fours") },
        { value: "eights", label: $t("component_content_output_hex_dump_format_eights") },
        { value: "sixteens", label: $t("component_content_output_hex_dump_format_sixteens") },
        { value: "none", label: $t("component_content_output_hex_dump_format_none") },
    ];

    const mainContent =
        error !== "" ? (
            <Textarea value={error} readOnly />
        ) : result === "" ? (
            <div className="ctool-text-output-empty">
                <Exception />
            </div>
        ) : ["text", "base64", "hex", "hex_dump"].includes(current.type) ? (
            <Textarea value={result} readOnly placeholder={placeholder} />
        ) : (
            <Card height="100%">
                <Align direction="vertical" horizontal="center" vertical="center">
                    {current.type === "image" ? (
                        <img
                            onClick={() => copyImage(result)}
                            src={result}
                            alt={content.name() || $t("main_ui_output")}
                            style={{
                                cursor: "pointer",
                                border: "1px dashed color-mix(in srgb, var(--lumia-text) 28%, transparent)",
                                maxWidth: "80%",
                                maxHeight: "80%",
                            }}
                        />
                    ) : null}
                    {["image", "down"].includes(current.type) ? (
                        <>
                            <span
                                style={{
                                    fontSize: "var(--lumia-font-sm)",
                                    color: "var(--lumia-muted)",
                                }}
                            >
                                {content.name()} {content.imageSizeString ? `(${content.imageSizeString})` : ""}
                            </span>
                            <Button size="small" type="primary" onClick={down}>
                                {$t("main_ui_down")}
                            </Button>
                        </>
                    ) : null}
                </Align>
            </Card>
        );

    const extra = (
        <Align>
            {result !== "" && current.type === "base64" ? (
                <>
                    <Bool
                        size="small"
                        value={current.option.base64.is_url_safe}
                        onChange={next =>
                            mutateCurrent(model => (model.option.base64.is_url_safe = Boolean(next)))
                        }
                        border
                        label={$t("component_content_output_url_safe")}
                        disabled={current.option.base64.data_url_show}
                    />
                    <Bool
                        size="small"
                        value={current.option.base64.data_url_show}
                        onChange={next =>
                            mutateCurrent(model => (model.option.base64.data_url_show = Boolean(next)))
                        }
                        border
                        label={$t("component_content_output_data_url")}
                    />
                </>
            ) : null}
            {result !== "" && current.type === "text" && encoding ? (
                <Select
                    size="small"
                    options={[
                        {
                            label: `${$t("component_content_output_analyse_encoding")}: ${analyseEncoding}`,
                            value: "analyse",
                        },
                        ...encodings,
                    ]}
                    value={current.option.text.encoding}
                    onChange={next =>
                        mutateCurrent(
                            model =>
                                (model.option.text.encoding =
                                    next as TextOutputModel["option"]["text"]["encoding"]),
                        )
                    }
                />
            ) : null}
            {result !== "" && current.type === "hex" ? (
                <>
                    {current.option.hex.type === "dump" ? (
                        <>
                            <Select
                                label={$t("component_content_output_hex_dump_format")}
                                size="small"
                                value={current.option.hex.format}
                                onChange={next =>
                                    mutateCurrent(
                                        model =>
                                            (model.option.hex.format =
                                                next as TextOutputModel["option"]["hex"]["format"]),
                                    )
                                }
                                options={hexFormat}
                            />
                            <InputNumber
                                size="small"
                                value={current.option.hex.width}
                                onChange={next =>
                                    mutateCurrent(model => (model.option.hex.width = Number(next)))
                                }
                                max={60}
                                min={1}
                                width={90}
                                label={$t("component_content_output_hex_dump_width")}
                            />
                        </>
                    ) : null}
                    <Select
                        label={$t("component_content_output_hex_caps")}
                        size="small"
                        value={current.option.hex.caps}
                        onChange={next =>
                            mutateCurrent(
                                model =>
                                    (model.option.hex.caps =
                                        next as TextOutputModel["option"]["hex"]["caps"]),
                            )
                        }
                        options={hexCaps}
                    />
                    <Select
                        label={$t("component_content_output_hex_type")}
                        size="small"
                        value={current.option.hex.type}
                        onChange={next =>
                            mutateCurrent(
                                model =>
                                    (model.option.hex.type =
                                        next as TextOutputModel["option"]["hex"]["type"]),
                            )
                        }
                        options={hexType}
                    />
                </>
            ) : null}
            {typeLists.length > 1 ? (
                <Select
                    size="small"
                    value={current.type}
                    onChange={next =>
                        mutateCurrent(model => (model.type = next as TextOutputModel["type"]))
                    }
                    options={typeLists.map(item => ({
                        value: item,
                        label: $t(`component_content_type_${item}`),
                    }))}
                />
            ) : null}
        </Align>
    );

    const hasTypeSelect = typeLists.length > 1;
    const hasResultOptions = result !== "" && (
        current.type === "base64"
        || (current.type === "text" && encoding)
        || current.type === "hex"
    );
    const hasFooter = hasTypeSelect || hasResultOptions;

    return (
        <div
            className={["ctool-text-output-frame", hasFooter ? "" : "ctool-text-output-frame--bare"].filter(Boolean).join(" ")}
            style={style}
        >
            <div className="ctool-text-output-content">{mainContent}</div>
            {hasFooter ? <div className="ctool-text-output-toolbar">{extra}</div> : null}
        </div>
    );
}
