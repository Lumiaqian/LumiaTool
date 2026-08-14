import { useEffect, useMemo } from "react";
import { Align, Bool, Display, HeightResize, Select, Textarea, TextInput } from "@/components";
import { useAction, initialize } from "@/store/action";
import { createTextInput } from "@/components/text";
import Unicode, { _typeLists } from "./util";
import type { TypeLists } from "./util";

const initial = await initialize({
    input: createTextInput(),
    type: "unicode_point_default",
    ignore_ascii: true,
});
const disableIgnoreAsciiSelect = ["unicode_point_wide", "unicode_number", "css_entity"];

export default function Encoder() {
    const action = useAction(initial);
    const text = action.current.input.text.toString();
    const isEmpty = action.current.input.text.isEmpty();
    const isError = action.current.input.text.isError();

    const output = useMemo(() => {
        if (isEmpty) return "";
        if (isError) return text;
        try {
            return Unicode.encode(
                text,
                action.current.type as TypeLists,
                disableIgnoreAsciiSelect.includes(action.current.type) ? false : action.current.ignore_ascii,
            );
        } catch (error) {
            return $error(error);
        }
    }, [isEmpty, isError, text, action.current.type, action.current.ignore_ascii]);

    useEffect(() => {
        if (!isEmpty) action.save();
    }, [action, isEmpty, text, action.current.type, action.current.ignore_ascii]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <Display extra={
                        <Align>
                            <Select
                                size="small"
                                value={action.current.type}
                                onChange={value => { action.current.type = value; }}
                                options={_typeLists.map(item => ({ value: item, label: $t(`unicode_mode_${item}`) }))}
                            />
                            <Bool
                                border
                                size="small"
                                value={action.current.ignore_ascii}
                                onChange={value => { action.current.ignore_ascii = value; }}
                                label={$t("unicode_ignore_ascii")}
                                disabled={disableIgnoreAsciiSelect.includes(action.current.type)}
                            />
                        </Align>
                    }>
                        <TextInput allow={["text", "base64", "hex"]} value={action.current.input} onChange={value => { action.current.input = value; }} height={small} />
                    </Display>
                    <Textarea value={output} placeholder={$t("main_ui_output")} height={large} copy />
                </Align>
            )}
        </HeightResize>
    );
}
