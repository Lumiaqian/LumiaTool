import { useMemo, useState } from "react";
import { Align, Button, HeightResize, HelpTip, Input, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { handleResult, request } from "./util";
import type { InitializeType } from "./util";

const initial = await initialize<InitializeType>({ input: "", offset: "", response: "" });

const inputPlaceholder = `Input Hex code:
40000494
C0035FD6
F0 B5 03 AF81b0`;

export default function HexToArm() {
    const action = useAction(initial);
    const [loading, setLoading] = useState(false);

    const result = useMemo(
        () => ({
            arm64: handleResult("asm", "arm64", action.current),
            arm: handleResult("asm", "arm", action.current),
            thumb: handleResult("asm", "thumb", action.current),
            armbe: handleResult("asm", "armbe", action.current),
            thumbbe: handleResult("asm", "thumbbe", action.current),
        }),
        [action.current.response],
    );

    const convert = async () => {
        setLoading(true);
        if (action.current.input.trim() === "") {
            action.current.response = "";
            return;
        }
        try {
            const { data } = await request({
                hex: action.current.input,
                offset: action.current.offset,
                arch: ["arm64", "arm", "armbe", "thumb", "thumbbe"],
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
                append={<HelpTip link="https://armconverter.com/" />}
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
                                <Button type="primary" loading={loading} onClick={convert} long>
                                    {$t("arm_convert")}
                                </Button>
                            </Align>
                            <Align
                                className="lumia-transformer-pane lumia-transformer-pane--result lumia-transformer-multiple-results"
                                direction="vertical"
                                role="region"
                                aria-label={$t("main_ui_output")}
                            >
                                <Textarea
                                    value={result.arm64}
                                    placeholder="ARM64"
                                    copy="ARM64"
                                    height={(height - 20) / 5}
                                />
                                <Textarea value={result.arm} placeholder="ARM" copy="ARM" height={(height - 20) / 5} />
                                <Textarea
                                    value={result.armbe}
                                    placeholder="ARM Big Endian"
                                    copy="ARM Big Endian"
                                    height={(height - 20) / 5}
                                />
                                <Textarea
                                    value={result.thumb}
                                    placeholder="THUMB"
                                    copy="THUMB"
                                    height={(height - 20) / 5}
                                />
                                <Textarea
                                    value={result.thumbbe}
                                    placeholder="THUMB Big Endian"
                                    copy="THUMB Big Endian"
                                    height={(height - 20) / 5}
                                />
                            </Align>
                        </div>
                    )}
                </HeightResize>
            </div>
        </div>
    );
}
