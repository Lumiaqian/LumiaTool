import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Align, Bool, Editor, Input, Select, Textarea } from "@/components";
import { sizeConvert } from "@/components/util";
import { getDisplayName } from "@/lib/code";
import Serialize from "@/lib/serialize";
import { serializeInputEncoderLists } from "@/types";
import type { SerializeInputEncoderType } from "@/types";
import { csvTableKeyedType } from "./input";
import { createSerializeInput } from "./index";
import type { SerializeInput as SerializeInputModel } from "./index";

export interface SerializeInputProps {
    value?: SerializeInputModel;
    onChange?: (value: SerializeInputModel) => void;
    height?: string | number;
    placeholder?: string;
    allow?: SerializeInputEncoderType[];
}

function getFirstRecordKeys(content: unknown): string[] {
    if (!Array.isArray(content)) {
        return [];
    }
    const first: unknown = content[0];
    if (typeof first !== "object" || first === null) {
        return [];
    }
    return Object.keys(first);
}

export default function SerializeInput({
    value,
    onChange,
    height = "",
    placeholder = "",
    allow = serializeInputEncoderLists,
}: SerializeInputProps) {
    const [defaultValue] = useState<SerializeInputModel>(() => createSerializeInput());
    const [current, setCurrent] = useState<SerializeInputModel>(() => value ?? defaultValue);
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
            const assignSerialization = (serialization: Serialize) => {
                if (sequence !== transformSequence.current) {
                    return;
                }
                target.serialization = serialization;
                if (currentRef.current === target) {
                    forceRender();
                }
                onChangeRef.current?.(target);
            };

            if (target.value === "") {
                assignSerialization(Serialize.empty());
                return;
            }

            try {
                switch (target.type) {
                    case "json":
                        assignSerialization(Serialize.formJson(target.value));
                        return;
                    case "http_query_string":
                        assignSerialization(Serialize.formQueryString(target.value));
                        return;
                    case "csv":
                        assignSerialization(Serialize.formCsv(target.value, target.option.csv));
                        return;
                    case "html_table":
                        assignSerialization(Serialize.formTable(target.value, target.option.html_table));
                        return;
                    case "xml":
                        assignSerialization(Serialize.formXml(target.value, target.option.xml));
                        return;
                    case "yaml":
                        assignSerialization(Serialize.formYaml(target.value));
                        return;
                    case "php_array":
                        assignSerialization(Serialize.formPhpArray(target.value));
                        return;
                    case "php_serialize":
                        assignSerialization(Serialize.formPhpSerialize(target.value));
                        return;
                    case "toml":
                        assignSerialization(Serialize.formToml(target.value));
                        return;
                    case "properties":
                        assignSerialization(
                            Serialize.formProperties(target.value, target.option.properties),
                        );
                        return;
                }
                throw new Error("error type");
            } catch (error: unknown) {
                assignSerialization(Serialize.fromError($error(error)));
            }
        }, 200);

        return () => window.clearTimeout(timer);
    }, [current, current.type, current.value, optionSignature]);

    const typeLists = useMemo(
        () => serializeInputEncoderLists.filter(item => allow.includes(item)),
        [allow],
    );

    const getPlaceholder =
        placeholder !== "" ? placeholder : `${$t("main_ui_input")} ${getDisplayName(current.type)}`;

    const csvKeyedKey = useMemo(() => {
        if (
            current.type !== "csv" ||
            current.option.csv.type !== "keyed" ||
            current.serialization.isError() ||
            current.serialization.isEmpty()
        ) {
            return [];
        }
        return getFirstRecordKeys(current.serialization.content());
    }, [current.type, current.serialization, optionSignature]);

    const tableKeyedKey = useMemo(() => {
        if (
            current.type !== "html_table" ||
            current.option.html_table.type !== "keyed" ||
            current.serialization.isError() ||
            current.serialization.isEmpty()
        ) {
            return [];
        }
        return getFirstRecordKeys(current.serialization.content());
    }, [current.type, current.serialization, optionSignature]);

    const style = useMemo<CSSProperties>(() => {
        if (!height) {
            return {};
        }
        return { height: sizeConvert(height) };
    }, [height]);

    const mutateCurrent = (mutation: (model: SerializeInputModel) => void, emitImmediately = false) => {
        mutation(current);
        forceRender();
        if (emitImmediately) {
            onChangeRef.current?.(current);
        }
    };

    const inputExtra = (
        <>
            {current.type === "csv" ? (
                <Align>
                    {csvKeyedKey.length > 0 ? (
                        <Select
                            size="small"
                            value={current.option.csv.keyed_key}
                            onChange={next =>
                                mutateCurrent(
                                    model =>
                                        (model.option.csv.keyed_key =
                                            next as SerializeInputModel["option"]["csv"]["keyed_key"]),
                                )
                            }
                            options={csvKeyedKey.map((label, index) => ({ value: index, label }))}
                        />
                    ) : null}
                    <Select
                        size="small"
                        value={current.option.csv.type}
                        onChange={next =>
                            mutateCurrent(
                                model =>
                                    (model.option.csv.type =
                                        next as SerializeInputModel["option"]["csv"]["type"]),
                            )
                        }
                        options={csvTableKeyedType.map(item => ({
                            value: item,
                            label: $t(`component_serialize_csv_table_${item}`),
                        }))}
                    />
                </Align>
            ) : null}
            {current.type === "html_table" ? (
                <Align>
                    {tableKeyedKey.length > 0 ? (
                        <Select
                            size="small"
                            value={current.option.html_table.keyed_key}
                            onChange={next =>
                                mutateCurrent(
                                    model =>
                                        (model.option.html_table.keyed_key =
                                            next as SerializeInputModel["option"]["html_table"]["keyed_key"]),
                                )
                            }
                            options={tableKeyedKey.map((label, index) => ({ value: index, label }))}
                        />
                    ) : null}
                    <Select
                        size="small"
                        value={current.option.html_table.type}
                        onChange={next =>
                            mutateCurrent(
                                model =>
                                    (model.option.html_table.type =
                                        next as SerializeInputModel["option"]["html_table"]["type"]),
                            )
                        }
                        options={csvTableKeyedType.map(item => ({
                            value: item,
                            label: $t(`component_serialize_csv_table_${item}`),
                        }))}
                    />
                </Align>
            ) : null}
            {current.type === "properties" ? (
                <Bool
                    size="small"
                    value={current.option.properties.convertToJsonTree}
                    onChange={next =>
                        mutateCurrent(
                            model =>
                                (model.option.properties.convertToJsonTree = Boolean(next)),
                        )
                    }
                    border
                    label={$t("component_serialize_properties_convert_to_json_tree")}
                />
            ) : null}
            {current.type === "xml" ? (
                <Input
                    size="small"
                    value={current.option.xml.attribute_prefix}
                    onChange={next =>
                        mutateCurrent(model => (model.option.xml.attribute_prefix = String(next)))
                    }
                    label={$t("component_serialize_xml_attribute_prefix")}
                />
            ) : null}
        </>
    );

    const typeSelector =
        typeLists.length > 1 ? (
            <Select
                size="small"
                value={current.type}
                onChange={next =>
                    mutateCurrent(
                        model => {
                            model.type = next as SerializeInputModel["type"];
                            model.value = "";
                            model.serialization = Serialize.empty();
                        },
                        true,
                    )
                }
                options={typeLists.map(item => ({
                    value: item,
                    label: getDisplayName(item),
                }))}
            />
        ) : null;

    return (
        <div className="lumia-serialize-input" style={style}>
            {typeSelector ? <div className="lumia-serialize-toolbar lumia-serialize-toolbar--top">{typeSelector}</div> : null}
            <div className="lumia-serialize-body">
                {["http_query_string", "csv"].includes(current.type) ? (
                    <Textarea
                        value={current.value}
                        onChange={next => mutateCurrent(model => (model.value = String(next)))}
                        placeholder={getPlaceholder}
                    />
                ) : (
                    <Editor
                        disableLineNumbers
                        value={current.value}
                        onChange={next => mutateCurrent(model => (model.value = next))}
                        lang={current.type}
                        height="100%"
                        placeholder={getPlaceholder}
                    />
                )}
            </div>
            {["csv", "html_table", "properties", "xml"].includes(current.type) ? (
                <div className="lumia-serialize-toolbar lumia-serialize-toolbar--bottom">{inputExtra}</div>
            ) : null}
        </div>
    );
}
