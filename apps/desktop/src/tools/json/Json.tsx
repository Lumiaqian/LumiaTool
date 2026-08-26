import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
    Align,
    Bool,
    Button,
    Dropdown,
    Editor,
    ExtendPage,
    HeightResize,
    HelpTip,
    Select,
    SerializeInput,
    SerializeOutput,
    Tabs,
} from "@/components";
import JsonHelper from "@/lib/json";
import { initialize, useAction } from "@/store/action";
import { actionType, pathLists, tabOptions } from "./define";
import type { TabsType } from "./define";
import { createSerializeInput, createSerializeOutput } from "@/components/serialize";
import Schema from "./Schema";
import { serializeInputEncoderLists, serializeOutputEncoderLists } from "@/types";
import type { ComponentSizeType } from "@/types";
import Path from "./Path";
import Serialize from "@/lib/serialize";
import { typeLists as renameTypeLists } from "@/lib/nameConvert";
import type { TypeLists as RenameType } from "@/lib/nameConvert";
import util from "./util";
import { getDisplayName } from "@/lib/code";
import { jsonrepair } from "jsonrepair";
import ToObject from "./toObject/ToObject";
import { getOption as getToObjectOption, languages as toObjectLangLists } from "./toObject";

const initial = await initialize<actionType>(
    {
        input: "",
        tabs: "common",
        expand_type: "",
        option: {
            info: { line: true },
            schema: { exp: "", option: {} },
            path: { type: "json_path", json_path: "", jmes_path: "" },
            tab: 4,
            from: createSerializeInput("csv"),
            to: createSerializeOutput("xml"),
            to_object: getToObjectOption(""),
        },
    },
    { paste: false },
);

const size: ComponentSizeType = "default";

export default function Json(): React.ReactElement {
    const action = useAction(initial);
    const [toObjectOpen, setToObjectOpen] = useState(false);

    const layoutStyle = useMemo<CSSProperties>(() => {
        if (["from", "object", "to", "path", "json_schema"].includes(action.current.expand_type)) {
            return {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                columnGap: "5px",
            };
        }
        return {};
    }, [action.current.expand_type]);

    const getInput = (code?: string): string => (code || action.current.input).trim();

    const beautify = async (code?: string, copy = true): Promise<void> => {
        action.current.input = await util.beautify(getInput(code), { tab: action.current.option.tab });
        if (!copy) {
            action.save();
            return;
        }
        action.success({ copy_text: action.current.input });
    };

    const compress = async (): Promise<void> => {
        action.current.input = await util.compress(getInput());
        action.success({ copy_text: action.current.input });
    };

    const rename = (type: RenameType): void => {
        const code = getInput();
        if (code !== "") {
            void beautify(JsonHelper.stringify(util.rename(JsonHelper.parse(code), type)));
        }
    };

    const sort = (type: "asc" | "desc"): void => {
        const code = getInput();
        if (code !== "") {
            void beautify(JsonHelper.stringify(util[type === "asc" ? "sortAsc" : "sortDesc"](JsonHelper.parse(code))));
        }
    };

    const transformInput = (transform: (code: string) => string): void => {
        const code = getInput();
        if (code !== "") {
            action.current.input = transform(code);
            action.success({ copy_text: action.current.input });
        }
    };

    const repair = (): void => {
        const code = getInput();
        if (code !== "") {
            void beautify(jsonrepair(code));
        }
    };

    const inputSerialize = useMemo((): Serialize => {
        try {
            const code = action.current.input.trim();
            return code === "" ? Serialize.empty() : Serialize.formJson(code);
        } catch (error) {
            return Serialize.fromError($error(error));
        }
    }, [action.current.input]);

    const serialization = action.current.option.from.serialization;
    useEffect(() => {
        if (serialization.isEmpty() || action.current.expand_type !== "from") {
            return;
        }
        if (serialization.isError()) {
            action.current.input = serialization.error();
            return;
        }
        void beautify(serialization.toJson(), false);
    }, [serialization, action.current.expand_type]);

    const setExpandType = (value: string): void => {
        action.current.expand_type = value !== "" && action.current.expand_type === value ? "" : value;
    };

    useEffect(() => {
        const tabs = action.current.tabs;
        setExpandType(["from", "to", "path"].includes(tabs) ? tabs : "");
    }, [action.current.tabs]);

    const selectGeneralTransform = (value: string): void => {
        if (value === "escape") transformInput(util.escape);
        if (value === "clearEscape") transformInput(util.clearEscape);
        if (value === "unicode2zh") transformInput(util.unicode2zh);
        if (value === "zh2unicode") transformInput(util.zh2unicode);
    };

    return (<div className="ctool-generator-editor-family ctool-editor-page ctool-json-editor-page ctool-json-workspace"><div>
            <Tabs
                value={action.current.tabs}
                onChange={(value) => { action.current.tabs = value; }}
                lists={[
                    { label: $t("json_common"), name: "common" },
                    { label: "Path", name: "path" },
                    { label: $t("json_object"), name: "object" },
                    { label: $t("json_from"), name: "from" },
                    { label: $t("json_to"), name: "to" },
                ]}
            >
                <Align>
                    <Bool
                        size="small"
                        border
                        value={action.current.option.info.line}
                        onChange={(value) => { action.current.option.info.line = value; }}
                        label={$t("json_line_info")}
                    />
                    <Button onClick={repair} type="primary" size="small" text={$t("json_repair")} />
                    <HelpTip link="https://www.npmjs.com/package/jsonrepair" />
                    <span>|</span>
                    <Button onClick={() => { void beautify(); }}>{$t("json_format")}</Button>
                    <Select
                        value={action.current.option.tab}
                        onChange={(value: TabsType) => {
                            action.current.option.tab = value;
                            void beautify();
                        }}
                        placeholder={$t("json_format")}
                        options={tabOptions}
                    />
                    <Button onClick={() => { void compress(); }}>{$t("json_compress")}</Button>
                    <span>|</span>
                    <Dropdown
                        onSelect={selectGeneralTransform}
                        placeholder={$t("json_escape")}
                        options={[
                            { label: $t("json_add_escape"), value: "escape" },
                            { label: $t("json_clear_escape"), value: "clearEscape" },
                        ]}
                    />
                    <Dropdown
                        onSelect={selectGeneralTransform}
                        placeholder="Unicode"
                        options={[
                            { label: $t("json_unicode_to_zh"), value: "unicode2zh" },
                            { label: $t("json_zh_to_unicode"), value: "zh2unicode" },
                        ]}
                    />
                    <span>|</span>
                    <Dropdown
                        onSelect={(value: "asc" | "desc") => sort(value)}
                        placeholder={$t("json_key_sort")}
                        options={[
                            { label: $t("json_asc"), value: "asc" },
                            { label: $t("json_desc"), value: "desc" },
                        ]}
                    />
                    <Dropdown onSelect={(value: RenameType) => rename(value)} placeholder={$t("json_key_rename")} options={renameTypeLists} />
                    <span>|</span>
                    <Button onClick={() => setExpandType("json_schema")}>Schema</Button>
                </Align>
                <Align>
                    {pathLists.map((item) => (
                        <Button
                            key={item.value}
                            size={size}
                            text={item.label}
                            type={item.value === action.current.option.path.type ? "primary" : "general"}
                            onClick={() => { action.current.option.path.type = item.value; }}
                        />
                    ))}
                </Align>
                <Align>
                    {[...toObjectLangLists].sort().map((item) => (
                        <Button
                            key={item}
                            size={size}
                            text={getDisplayName(item)}
                            type={item === action.current.option.to_object.lang ? "primary" : "general"}
                            onClick={() => {
                                action.current.option.to_object.lang = item;
                                setToObjectOpen(true);
                            }}
                        />
                    ))}
                </Align>
                <Align>
                    {serializeInputEncoderLists.filter((item) => item !== "json").map((item) => (
                        <Button
                            key={item}
                            size={size}
                            type={item === action.current.option.from.type ? "primary" : "general"}
                            text={getDisplayName(item)}
                            onClick={() => {
                                action.current.option.from.value = "";
                                action.current.option.from.type = item;
                            }}
                        />
                    ))}
                </Align>
                <Align>
                    {serializeOutputEncoderLists.filter((item) => item !== "json").map((item) => (
                        <Button
                            key={item}
                            size={size}
                            type={item === action.current.option.to.type ? "primary" : "general"}
                            text={getDisplayName(item)}
                            onClick={() => { action.current.option.to.type = item; }}
                        />
                    ))}
                </Align>
            </Tabs>
        <HeightResize append={[".ctool-page-option"]}>
            {({ height }: { height: number }) => (
                <div style={layoutStyle}>
                    {action.current.expand_type === "from" && (
                        <SerializeInput
                            allow={[action.current.option.from.type]}
                            height={height}
                            value={action.current.option.from}
                            onChange={(value) => { action.current.option.from = value; }}
                        />
                    )}
                    <Editor
                        value={action.current.input}
                        onChange={(value) => { action.current.input = value; }}
                        lineInfo={action.current.option.info.line}
                        placeholder={`Json ${$t("main_ui_input")}`}
                        lang="json"
                        height={`${height}px`}
                    />
                    {action.current.expand_type === "to" && (
                        <SerializeOutput
                            allow={[action.current.option.to.type]}
                            content={inputSerialize}
                            height={height}
                            onSuccess={() => action.save()}
                            value={action.current.option.to}
                            onChange={(value) => { action.current.option.to = value; }}
                        />
                    )}
                    {action.current.expand_type === "path" && (
                        <Path
                            height={height}
                            json={inputSerialize}
                            value={action.current.option.path}
                            onChange={(value) => { action.current.option.path = value; }}
                            onSuccess={() => action.save()}
                        />
                    )}
                    {action.current.expand_type === "json_schema" && (
                        <Schema
                            height={height}
                            json={inputSerialize}
                            value={action.current.option.schema}
                            onChange={(value) => { action.current.option.schema = value; }}
                            onSuccess={() => action.save()}
                        />
                    )}
                </div>
            )}
        </HeightResize>
    </div>
    <ExtendPage value={toObjectOpen} onChange={setToObjectOpen}>
        <ToObject
            value={action.current.option.to_object}
            onChange={(value) => { action.current.option.to_object = value; }}
            json={inputSerialize}
            onSuccess={() => action.save()}
        />
    </ExtendPage></div>)
}
