import { useCallback, useMemo, useState } from "react";
import {
    Align,
    Bool,
    Button,
    Checkbox,
    Dropdown,
    Editor,
    HeightResize,
    Modal,
    Table,
    Tabs,
    Textarea,
} from "@/components";
import { initialize, useAction } from "@/store/action";
import type { CheckboxOption, ComponentSizeType } from "@/types";
import { typeLists as renameTypeLists } from "@/lib/nameConvert";
import TextHandle, { escapeChars } from "./util";
import type { EscapeCharsType } from "./util";
import { getCommonExpression } from "../regex/util";

const initial = await initialize({
    input: "",
    replace: { search: "", replace: "", regular: false },
    escapeChars: Object.keys(escapeChars) as EscapeCharsType[],
});

const size: ComponentSizeType = "small";
type HandleOption = Record<string, unknown>;
type TransformMethod =
    | "upper"
    | "lower"
    | "upperLineStart"
    | "lowerLineStart"
    | "upperStart"
    | "lowerStart"
    | "replacePunctuation"
    | "zhTran"
    | "lineRemoveRepeat"
    | "rename"
    | "addLineIndex"
    | "removeLineIndex"
    | "sort"
    | "lineTrim"
    | "filterBlankLine"
    | "filterAllBr"
    | "escape"
    | "unescape"
    | "regularReplace"
    | "replace";
type TextTransformer = Record<TransformMethod, (option: HandleOption) => string>;

export default function Text() {
    const action = useAction(initial);
    const [replaceShow, setReplaceShow] = useState(false);
    const [statMore, setStatMore] = useState(false);
    const [escapeShow, setEscapeShow] = useState(false);

    const handle = useCallback(
        (method: TransformMethod, option: HandleOption = {}) => {
            if (action.current.input.length < 1) return;
            const transformer = new TextHandle(action.current.input) as unknown as TextTransformer;
            action.current.input = transformer[method](option);
            action.success();
        },
        [action],
    );

    const replace = useCallback(() => {
        if (action.current.replace.regular) {
            handle("regularReplace", {
                search: action.current.replace.search,
                replace: action.current.replace.replace,
            });
        } else {
            handle("replace", {
                search: action.current.replace.search.split(/\r?\n/),
                replace: action.current.replace.replace.split(/\r?\n/),
            });
        }
        setReplaceShow(false);
    }, [action, handle]);

    const stat = useMemo(() => new TextHandle(action.current.input).stat(), [action.current.input]);
    const escapeOptions = useMemo<CheckboxOption>(
        () =>
            Object.keys(escapeChars).map(item => ({
                value: item,
                label: `${$t(`text_escape_${item}`)}(${escapeChars[item].string})`,
            })),
        [],
    );

    const selectReplaceExplain = useCallback(
        (value: string) => {
            action.current.replace.search = value;
            action.current.replace.regular = true;
        },
        [action],
    );

    const caseOptions = useMemo(
        () => [
            { value: "upper", label: $t("text_upper_all") },
            { value: "lower", label: $t("text_lower_all") },
            { value: "upperLineStart", label: $t("text_upper_line_start") },
            { value: "lowerLineStart", label: $t("text_lower_line_start") },
            { value: "upperStart", label: $t("text_upper_word_start") },
            { value: "lowerStart", label: $t("text_lower_word_start") },
        ],
        [],
    );

    return (
        <>
            <div className="lumia-generator-editor-family lumia-editor-page lumia-text-editor-page">
                <header className="lumia-editor-command-toolbar" aria-label={$t("main_ui_setting")}>
                    <Align horizontal="center">
                        <Dropdown
                            size={size}
                            placeholder={$t("text_case_conversion")}
                            options={caseOptions}
                            onSelect={(value: TransformMethod) => handle(value)}
                        />
                        <Dropdown
                            size={size}
                            placeholder={$t("text_punctuation")}
                            options={[
                                { value: "en", label: `${$t("text_cn")} -> ${$t("text_en")}` },
                                { value: "zh", label: `${$t("text_en")} -> ${$t("text_cn")}` },
                            ]}
                            onSelect={(type: string) => handle("replacePunctuation", { type })}
                        />
                        <Dropdown
                            size={size}
                            placeholder={$t("text_simplified_traditional")}
                            options={[
                                { value: "simplified", label: `${$t("text_simplified")} -> ${$t("text_traditional")}` },
                                {
                                    value: "traditional",
                                    label: `${$t("text_traditional")} -> ${$t("text_simplified")}`,
                                },
                            ]}
                            onSelect={(type: string) => handle("zhTran", { type })}
                        />
                        <Button size={size} text={$t("text_replace")} onClick={() => setReplaceShow(true)} />
                        <Button size={size} text={$t("text_escape")} onClick={() => setEscapeShow(true)} />
                        <Button
                            size={size}
                            text={$t("text_line_remove_duplicate")}
                            onClick={() => handle("lineRemoveRepeat")}
                        />
                        <Dropdown
                            size={size}
                            onSelect={(type: string) => handle("rename", { type })}
                            placeholder={$t("text_rename")}
                            options={renameTypeLists.filter(
                                item => !["spaceCase", "pascalCaseSpace"].includes(item.value),
                            )}
                        />
                        <Dropdown
                            size={size}
                            placeholder={$t("text_line_number")}
                            options={[
                                { value: "addLineIndex", label: $t("text_line_number_add") },
                                { value: "removeLineIndex", label: $t("text_line_number_remove") },
                            ]}
                            onSelect={(value: TransformMethod) => handle(value)}
                        />
                        <Dropdown
                            size={size}
                            placeholder={$t("text_sort")}
                            options={[
                                { value: "line_asc", label: $t("text_line_sort_asc") },
                                { value: "line_desc", label: $t("text_line_sort_desc") },
                                { value: "reverse_line", label: $t("text_reverse_line") },
                                { value: "reverse_line_string", label: $t("text_reverse_line_string") },
                                { value: "reverse_all", label: $t("text_reverse_all") },
                            ]}
                            onSelect={(type: string) => handle("sort", { type })}
                        />
                        <Dropdown
                            size={size}
                            placeholder={$t("text_filter")}
                            options={[
                                { value: "lineTrim", label: $t("text_filter_trim") },
                                { value: "filterBlankLine", label: $t("text_filter_blank_line") },
                                { value: "filterAllBr", label: $t("text_filter_all_br") },
                            ]}
                            onSelect={(value: TransformMethod) => handle(value)}
                        />
                    </Align>
                </header>
                <section className="lumia-editor-surface">
                    <HeightResize>
                        {({ height }: { height: number }) => (
                            <Editor
                                value={action.current.input}
                                onChange={(value: string) => {
                                    action.current.input = value;
                                }}
                                lang="text"
                                height={`${height}px`}
                                placeholder={$t("main_ui_input")}
                            >
                                <Button
                                    type="dotted"
                                    size="small"
                                    onClick={() => setStatMore(true)}
                                    tooltip={$t("text_more_stat")}
                                >
                                    {$t("text_stat_show", [
                                        stat.word_length,
                                        stat.byte_utf8_length,
                                        stat.byte_gbk_length,
                                    ])}
                                    ...
                                </Button>
                            </Editor>
                        )}
                    </HeightResize>
                </section>
            </div>
            <Modal
                value={replaceShow}
                onChange={setReplaceShow}
                width={600}
                title={$t("text_replace")}
                footerType="long"
                onOk={replace}
            >
                <div className="lumia-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div>
                        <Align>
                            <Dropdown
                                size="small"
                                options={getCommonExpression()}
                                placeholder={$t("regex_common")}
                                onSelect={selectReplaceExplain}
                            />
                            <Bool
                                border
                                size="small"
                                value={action.current.replace.regular}
                                onChange={(value: boolean) => {
                                    action.current.replace.regular = value;
                                }}
                                label={$t("text_replace_regular")}
                            />
                        </Align>
                        <Textarea
                            height={200}
                            value={action.current.replace.search}
                            onChange={(value: string) => {
                                action.current.replace.search = value;
                            }}
                            placeholder={`${$t("text_replace_search")}${!action.current.replace.regular ? `\n${$t("text_replace_explain")}` : ""}`}
                        />
                    </div>
                    <Textarea
                        height={200}
                        value={action.current.replace.replace}
                        onChange={(value: string) => {
                            action.current.replace.replace = value;
                        }}
                        placeholder={`${$t("text_replace_replace")}${!action.current.replace.regular ? `\n${$t("text_replace_explain")}` : ""}`}
                    />
                </div>
            </Modal>
            <Modal value={statMore} onChange={setStatMore} width={600} padding="0">
                <Tabs
                    value="stat"
                    lists={[
                        { label: $t("text_stat"), name: "stat" },
                        { label: $t("text_stat_explain"), name: "explain" },
                    ]}
                    padding="0"
                >
                    <Table
                        columns={[
                            { title: $t("text_item"), key: "name1", width: 170 },
                            { title: $t("text_value"), key: "value1" },
                            { title: $t("text_item"), key: "name2", width: 170 },
                            { title: $t("text_value"), key: "value2" },
                        ]}
                        lists={[
                            {
                                name1: $t("text_string_length"),
                                value1: stat.string_length,
                                name2: $t("text_byte_length"),
                                value2: `${stat.byte_utf8_length} / ${stat.byte_gbk_length}`,
                            },
                            {
                                name1: $t("text_word_length"),
                                value1: stat.word_length,
                                name2: $t("text_line_length"),
                                value2: stat.line_length,
                            },
                            {
                                name1: $t("text_zh_length"),
                                value1: `${stat.zh_word} / ${stat.zh_punctuation}`,
                                name2: $t("text_en_length"),
                                value2: `${stat.en_string} / ${stat.en_word} / ${stat.en_punctuation}`,
                            },
                            {
                                name1: $t("text_int_length"),
                                value1: `${stat.int_string} / ${stat.int_word}`,
                                name2: "-",
                                value2: "-",
                            },
                        ]}
                    />
                    <Table
                        columns={[
                            { title: $t("text_item"), key: "name", width: 120 },
                            { title: $t("text_explain"), key: "explain" },
                        ]}
                        lists={[
                            {
                                name: $t("text_explain_byte_length_utf8_name"),
                                explain: $t("text_explain_byte_length_utf8_info"),
                            },
                            {
                                name: $t("text_explain_byte_length_gbk_name"),
                                explain: $t("text_explain_byte_length_gbk_info"),
                            },
                            {
                                name: $t("text_explain_string_length_name"),
                                explain: $t("text_explain_string_length_info"),
                            },
                            { name: $t("text_explain_word_length_name"), explain: $t("text_explain_word_length_info") },
                            { name: $t("text_explain_int_length_name"), explain: $t("text_explain_int_length_info") },
                            {
                                name: $t("text_explain_int_word_length_name"),
                                explain: $t("text_explain_int_word_length_info"),
                            },
                            {
                                name: $t("text_explain_blank_line_length_name"),
                                explain: $t("text_explain_blank_line_length_info"),
                            },
                        ]}
                    />
                </Tabs>
            </Modal>
            <Modal
                value={escapeShow}
                onChange={setEscapeShow}
                width={600}
                title={$t("text_escape")}
                footer={
                    <Align horizontal="center">
                        <Button
                            text={$t("text_escape_forward")}
                            onClick={() => handle("escape", { lists: action.current.escapeChars })}
                        />
                        <Button
                            text={$t("text_escape_reverse")}
                            onClick={() => handle("unescape", { lists: action.current.escapeChars })}
                        />
                    </Align>
                }
            >
                <Align horizontal="center">
                    <Checkbox
                        value={action.current.escapeChars}
                        onChange={(value: EscapeCharsType[]) => {
                            action.current.escapeChars = value;
                        }}
                        options={escapeOptions}
                    />
                </Align>
            </Modal>
        </>
    );
}
