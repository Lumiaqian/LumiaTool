import { useState } from "react";
import { Align, Button, Display, ExtendPage, HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { convent } from "./util";
import type { ConventType } from "./util";
import Reference from "./Reference";

const initial = await initialize<{ input: string; type: ConventType | "" }>({
    type: "",
    input: "",
}, { paste: false });

const types: ConventType[] = ["str", "bin", "oct", "dec", "hex"];

export default function Ascii() {
    const action = useAction(initial);
    const [showReference, setShowReference] = useState(false);

    const getHandle = (target: ConventType) => {
        if (action.current.type === "" || action.current.input === "") return "";
        if (action.current.type === target) return action.current.input;
        try {
            return convent(action.current.input, action.current.type, target);
        } catch (error) {
            return $error(error);
        }
    };

    const setHandle = (source: ConventType, value: string) => {
        action.current.input = value;
        action.current.type = source;
        if (value !== "") action.save();
    };

    return (
        <>
            <HeightResize>
                {({ height }) => (
                    <Align direction="vertical">
                        {types.map((item) => {
                            const value = getHandle(item);
                            return (
                                <Display
                                    key={item}
                                    position="bottom-right"
                                    extra={(
                                        <Align>
                                            {item === "str" && <Button size="small" onClick={() => setShowReference((current) => !current)} text={$t("main_ui_reference")} />}
                                            <Button size="small" type="primary" onClick={() => $copy(value)} text={$t(`ascii_input_${item}`)} />
                                        </Align>
                                    )}
                                >
                                    <Textarea
                                        value={value}
                                        onChange={(next) => setHandle(item, next)}
                                        placeholder={item === "str" ? $t("ascii_input_str_prompt") : $t("ascii_input_prompt", [$t(`ascii_input_${item}`)])}
                                        height={(height - 20) / 5}
                                    />
                                </Display>
                            );
                        })}
                    </Align>
                )}
            </HeightResize>
            <ExtendPage value={showReference} onChange={setShowReference}>
                <Reference />
            </ExtendPage>
        </>
    );
}
