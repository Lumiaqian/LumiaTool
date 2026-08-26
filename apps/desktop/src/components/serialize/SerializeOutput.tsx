import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Align, Bool, Editor, Input, Select, Textarea } from "@/components";
import { sizeConvert } from "@/components/util";
import { getDisplayName } from "@/lib/code";
import Serialize from "@/lib/serialize";
import formatter from "@/tools/code/formatter";
import { serializeOutputEncoderLists } from "@/types";
import type { SerializeOutputEncoderType } from "@/types";
import { createSerializeOutput } from "./index";
import type { SerializeOutput as SerializeOutputModel } from "./index";

export interface SerializeOutputProps {
    value?: SerializeOutputModel;
    onChange?: (value: SerializeOutputModel) => void;
    onSuccess?: () => void;
    height?: string | number;
    placeholder?: string;
    disabledBorder?: boolean;
    allow?: SerializeOutputEncoderType[];
    content?: Serialize;
    children?: ReactNode;
}

const defaultAllow = serializeOutputEncoderLists.filter(item => item !== "text");

export default function SerializeOutput({
    value,
    onChange,
    onSuccess,
    height = "",
    placeholder = $t("main_ui_output"),
    disabledBorder = false,
    allow = defaultAllow,
    content = Serialize.empty(),
    children,
}: SerializeOutputProps) {
    const [defaultValue] = useState<SerializeOutputModel>(() => createSerializeOutput());
    const current = value ?? defaultValue;
    const [, forceRender] = useReducer((version: number) => version + 1, 0);
    const [result, setResult] = useState("");
    const onChangeRef = useRef(onChange);
    const onSuccessRef = useRef(onSuccess);
    const conversionSequence = useRef(0);

    onChangeRef.current = onChange;
    onSuccessRef.current = onSuccess;

    const optionSignature = JSON.stringify(current.option);
    const typeLists = useMemo(
        () => serializeOutputEncoderLists.filter(item => allow.includes(item)),
        [allow],
    );

    const getPlaceholder =
        placeholder !== "" ? placeholder : `${$t("main_ui_output")} ${getDisplayName(current.type)}`;

    useEffect(() => {
        const sequence = ++conversionSequence.current;
        const data = content;
        const type = current.type;
        const option = current.option;
        setResult("");

        if (data.isError()) {
            setResult(data.error());
            return;
        }
        if (data.isEmpty()) {
            return;
        }

        const convert = async () => {
            try {
                let converted = "";
                switch (type) {
                    case "json":
                        converted = data.toJson();
                        break;
                    case "http_query_string":
                        converted = data.toQueryString();
                        break;
                    case "csv":
                        converted = data.toCsv(option.csv);
                        break;
                    case "html_table":
                        converted = data.toTable(option.html_table);
                        break;
                    case "xml":
                        converted = data.toXml(option.xml);
                        break;
                    case "yaml":
                        converted = data.toYaml();
                        break;
                    case "php_array":
                        converted = data.toPhpArray();
                        break;
                    case "php_serialize":
                        converted = data.toPhpSerialize();
                        break;
                    case "toml":
                        converted = data.toToml();
                        break;
                    case "text":
                        converted = data.toText(option.text);
                        break;
                    case "properties":
                        converted = data.toProperties();
                        break;
                }

                if (converted !== "") {
                    onSuccessRef.current?.();
                    const formatted = await formatter.simple(type, "beautify", converted);
                    if (sequence === conversionSequence.current) {
                        setResult(formatted);
                    }
                }
            } catch (error: unknown) {
                console.error(error);
                if (sequence === conversionSequence.current) {
                    setResult($error(error));
                }
            }
        };

        void convert();
    }, [content, current.type, optionSignature]);

    const style = useMemo<CSSProperties>(() => {
        if (!height) {
            return {};
        }
        return { height: sizeConvert(height) };
    }, [height]);

    const mutateCurrent = (mutation: (model: SerializeOutputModel) => void) => {
        mutation(current);
        forceRender();
        onChangeRef.current?.(current);
    };

    const innerExtra = (
        <>
            {current.type === "csv" ? (
                <Align>
                    <Bool
                        size="small"
                        value={current.option.csv.quoted}
                        onChange={next =>
                            mutateCurrent(model => (model.option.csv.quoted = Boolean(next)))
                        }
                        border
                        label={$t("component_serialize_csv_quoted")}
                    />
                    <Bool
                        size="small"
                        value={current.option.csv.header}
                        onChange={next =>
                            mutateCurrent(model => (model.option.csv.header = Boolean(next)))
                        }
                        border
                        label={$t("component_serialize_csv_table_header")}
                    />
                </Align>
            ) : null}
            {current.type === "html_table" ? (
                <Bool
                    size="small"
                    value={current.option.html_table.header}
                    onChange={next =>
                        mutateCurrent(model => (model.option.html_table.header = Boolean(next)))
                    }
                    border
                    label={$t("component_serialize_csv_table_header")}
                />
            ) : null}
            {current.type === "xml" ? (
                <Input
                    size="small"
                    value={current.option.xml.attribute_prefix}
                    onChange={next =>
                        mutateCurrent(model => (model.option.xml.attribute_prefix = String(next)))
                    }
                    width={180}
                    label={$t("component_serialize_xml_attribute_prefix")}
                />
            ) : null}
            {current.type === "text" ? (
                <Align>
                    <Bool
                        size="small"
                        border
                        value={current.option.text.is_add_quote}
                        onChange={next =>
                            mutateCurrent(model => (model.option.text.is_add_quote = Boolean(next)))
                        }
                        label={$t("component_serialize_text_add_quote")}
                    />
                    <Input
                        size="small"
                        value={current.option.text.delimiter}
                        onChange={next =>
                            mutateCurrent(model => (model.option.text.delimiter = String(next)))
                        }
                        width={120}
                        label={$t("component_serialize_text_delimiter")}
                    />
                </Align>
            ) : null}
        </>
    );

    const outerExtra = (
        <Align>
            {typeLists.length > 1 ? (
                <Select
                    size="small"
                    value={current.type}
                    onChange={next =>
                        mutateCurrent(model => (model.type = next as SerializeOutputModel["type"]))
                    }
                    options={typeLists.map(item => ({
                        value: item,
                        label: getDisplayName(item),
                    }))}
                />
            ) : null}
            {children}
        </Align>
    );

    const className = disabledBorder
        ? "ctool-serialize-output ctool-serialize-output-disabled-border"
        : "ctool-serialize-output";
    const hasInner = ["csv", "html_table", "xml", "text"].includes(current.type);

    return (
        <div className={className} style={style}>
            <div className="ctool-serialize-toolbar ctool-serialize-toolbar--top">{outerExtra}</div>
            <div className="ctool-serialize-body">
                {["http_query_string", "csv"].includes(current.type) ? (
                    <Textarea value={result} placeholder={getPlaceholder} />
                ) : (
                    <Editor
                        disableLineNumbers
                        value={result}
                        lang={current.type}
                        height="100%"
                        placeholder={getPlaceholder}
                    />
                )}
            </div>
            {hasInner ? <div className="ctool-serialize-toolbar ctool-serialize-toolbar--bottom">{innerExtra}</div> : null}
        </div>
    );
}
