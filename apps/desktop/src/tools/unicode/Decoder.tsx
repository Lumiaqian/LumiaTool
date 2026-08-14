import { useEffect, useMemo } from "react";
import { Align, Display, HeightResize, Select, Textarea } from "@/components";
import { useAction, initialize } from "@/store/action";
import Unicode, { _typeLists } from "./util";
import type { TypeLists } from "./util";

const initial = await initialize({ input: "", type: "unicode_point_default" });

export default function Decoder() {
    const action = useAction(initial);
    const output = useMemo(() => {
        if (action.current.input === "") return undefined;
        try {
            return Unicode.decode(action.current.input, action.current.type as TypeLists);
        } catch (error) {
            return $error(error);
        }
    }, [action.current.input, action.current.type]);

    useEffect(() => {
        if (action.current.input !== "") action.save();
    }, [action, action.current.input, action.current.type]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <Display extra={
                        <Select
                            size="small"
                            value={action.current.type}
                            onChange={value => { action.current.type = value; }}
                            options={_typeLists.map(item => ({ value: item, label: $t(`unicode_mode_${item}`) }))}
                        />
                    }>
                        <Textarea value={action.current.input} onChange={value => { action.current.input = value; }} placeholder={$t("main_ui_input")} height={small} />
                    </Display>
                    <Textarea value={output} placeholder={$t("main_ui_output")} height={large} copy />
                </Align>
            )}
        </HeightResize>
    );
}
