import { useEffect, useMemo } from "react";
import { Align, Bool, Card, HeightResize, Radio, Select, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import pinyin from "./util";

const initial = await initialize(
    {
        input: "",
        delimiter: "null",
        type: "normal",
        multiple_flag: false,
        tone_is_number: false,
        replace_v: false,
        upper: false,
    },
    { paste: false },
);

const typeLists = ["normal", "tone", "abbr"] as const;

export default function Pinyin(): React.ReactElement {
    const action = useAction(initial);
    const delimiter = useMemo(() => [
        { label: $t("pinyin_delimiter_null"), value: "null" },
        { label: $t("pinyin_delimiter_space"), value: "blank" },
        { label: $t("pinyin_delimiter_1"), value: "-" },
        { label: $t("pinyin_delimiter_2"), value: "_" },
        { label: $t("pinyin_delimiter_3"), value: "." },
    ], []);

    const option = useMemo(() => {
        if (action.current.type === "normal") return { pattern: "pinyin", tone: "" };
        if (action.current.type === "tone") {
            return { pattern: "pinyin", tone: action.current.tone_is_number ? "num" : "symbol" };
        }
        return { pattern: "first", tone: "" };
    }, [action.current.type, action.current.tone_is_number]);

    const output = useMemo(() => {
        if (!action.current.input.trim()) return "";
        try {
            const separator = action.current.delimiter === "null"
                ? ""
                : action.current.delimiter === "blank" ? " " : action.current.delimiter;
            const result = pinyin(action.current.input, separator, {
                ...option,
                multiple_flag: action.current.multiple_flag,
                replace_v: action.current.replace_v,
            });
            return action.current.upper ? result.toUpperCase() : result;
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input, action.current.delimiter, action.current.multiple_flag, action.current.replace_v, action.current.upper, option]);

    useEffect(() => {
        action.save();
    }, [output]);

    return (
        <HeightResize className="ctool-transformer-page ctool-transformer-page--legacy" reduce={10} ignore append={[".ctool-page-option"]}>{({ small, large }: { small: number; large: number }) => (
            <Align direction="vertical">
                <Textarea height={small} placeholder={$t("main_ui_input")} value={action.current.input} onChange={(value) => { action.current.input = value; }} />
                <Card className="ctool-page-option">
                    <Align horizontal="center">
                        <Radio
                            value={action.current.type}
                            onChange={(value) => { action.current.type = value; }}
                            options={typeLists.map((value) => ({ value, label: $t(`pinyin_${value}`) }))}
                        />
                        <Select value={action.current.delimiter} onChange={(value) => { action.current.delimiter = value; }} options={delimiter} width={120} />
                        <Bool border value={action.current.multiple_flag} onChange={(value) => { action.current.multiple_flag = value; }} label={$t("pinyin_multiple_flag")} />
                        <Bool border value={action.current.replace_v} onChange={(value) => { action.current.replace_v = value; }} label="ü=>v" />
                        <Bool border value={action.current.upper} onChange={(value) => { action.current.upper = value; }} label={$t("pinyin_upper")} />
                        {action.current.type === "tone" && (
                            <Bool border value={action.current.tone_is_number} onChange={(value) => { action.current.tone_is_number = value; }} label={$t("pinyin_tone_is_number")} />
                        )}
                    </Align>
                </Card>
                <Textarea height={large} placeholder={$t("main_ui_output")} value={output} />
            </Align>
        )}</HeightResize>
    );
}
