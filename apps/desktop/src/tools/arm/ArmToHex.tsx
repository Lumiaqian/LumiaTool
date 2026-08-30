import { useMemo, useState } from "react";
import { Align, Bool, Button, HeightResize, HelpTip, Input, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { handleResult, request } from "./util";
import type { InitializeType } from "./util";

const initial = await initialize<InitializeType>({
    input: "",
    offset: "",
    prefix_0x: false,
    swap_endian: false,
    response: "",
});

const inputPlaceholder = `Input Assembly code:
NOP
RET
B #0x1018DE444
MOV X0, #0x11FE00000000
BEQ #0x10020C
CBNZ R0, #0x682C4
`;

export default function ArmToHex() {
    const action = useAction(initial);
    const [loading, setLoading] = useState(false);

    const result = useMemo(
        () => ({
            arm64: handleResult("hex", "arm64", action.current),
            arm: handleResult("hex", "arm", action.current),
            thumb: handleResult("hex", "thumb", action.current),
        }),
        [action.current.response, action.current.prefix_0x, action.current.swap_endian],
    );

    const outputPlaceholder = (field: string) => `${field}${action.current.swap_endian ? " Big Endian" : ""}`;

    const convert = async () => {
        setLoading(true);
        if (action.current.input.trim() === "") {
            action.current.response = "";
            return;
        }
        try {
            const { data } = await request({
                asm: action.current.input,
                offset: action.current.offset,
                arch: ["arm64", "arm", "thumb"],
            });
            action.current.response = data;
            action.success();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lumia-transformer-page lumia-transformer-page--arm">
            <Input
                className="lumia-page-option lumia-transformer-rack"
                label="Offset (hex) 0x"
                value={action.current.offset}
                onChange={value => {
                    action.current.offset = value;
                }}
                placeholder="0 - for branch and LDR put hex value here"
                append={
                    <Align>
                        <Bool
                            value={action.current.prefix_0x}
                            onChange={value => {
                                action.current.prefix_0x = value;
                            }}
                            label="0x"
                        />
                        <Bool
                            value={action.current.swap_endian}
                            onChange={value => {
                                action.current.swap_endian = value;
                            }}
                            label="GDB/LLDB"
                        />
                        <HelpTip link="https://armconverter.com/" />
                    </Align>
                }
            />
            <div className="lumia-transformer-panes lumia-transformer-panes--multiple">
                <HeightResize append={[".lumia-page-option"]}>
                    {({ height }) => (
                        <div className="lumia-transformer-arm-layout">
                            <Align
                                className="lumia-transformer-pane lumia-transformer-pane--source"
                                direction="vertical"
                                role="region"
                                aria-label={$t("main_ui_input")}
                            >
                                <Textarea
                                    value={action.current.input}
                                    onChange={value => {
                                        action.current.input = value;
                                    }}
                                    height={height - 37}
                                    placeholder={inputPlaceholder}
                                />
                                <Button
                                    type="primary"
                                    loading={loading}
                                    onClick={convert}
                                    long
                                    text={$t("arm_convert")}
                                />
                            </Align>
                            <Align
                                className="lumia-transformer-pane lumia-transformer-pane--result lumia-transformer-multiple-results"
                                direction="vertical"
                                role="region"
                                aria-label={$t("main_ui_output")}
                            >
                                <Textarea
                                    value={result.arm64}
                                    placeholder={outputPlaceholder("ARM64")}
                                    height={(height - 10) / 3}
                                    copy={outputPlaceholder("ARM64")}
                                />
                                <Textarea
                                    value={result.arm}
                                    placeholder={outputPlaceholder("ARM")}
                                    height={(height - 10) / 3}
                                    copy={outputPlaceholder("ARM")}
                                />
                                <Textarea
                                    value={result.thumb}
                                    placeholder={outputPlaceholder("THUMB")}
                                    height={(height - 10) / 3}
                                    copy={outputPlaceholder("THUMB")}
                                />
                            </Align>
                        </div>
                    )}
                </HeightResize>
            </div>
        </div>
    );
}
