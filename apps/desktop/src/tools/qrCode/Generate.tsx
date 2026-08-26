import { useEffect, useMemo, useState } from "react";
import {
    Align,
    Bool,
    InputNumber,
    Select,
    Tabs,
    TextInput,
    TextOutput,
    UploadFile,
} from "@/components";
import { createTextInput, createTextOutput } from "@/components/text";
import Text from "@/lib/text";
import { optionMap } from "@/lib/helper";
import { initialize, useAction } from "@/store/action";
import type { ComponentSizeType } from "@/types";
import QRCodeStyling from "qr-code-styling";
import GenerateOptionColor from "./GenerateOptionColor";
import { defaultGenerateOption, generateOptionsHandle } from "./util";

const initial = await initialize({
    input: createTextInput(),
    option: defaultGenerateOption(),
    output: createTextOutput("image"),
});

const generateOptionSize: ComponentSizeType = "default";

export default function Generate() {
    const action = useAction(initial);
    const [image, setImage] = useState(() => Text.empty());
    const [output, setOutput] = useState(() => Text.empty());

    const optionDependency = JSON.stringify(action.current.option);
    const inputText = action.current.input.text;
    const inputDependency = `${inputText.isError()}:${inputText.encoding()}:${inputText.toString()}`;

    useEffect(() => {
        const update = async () => {
            if (inputText.isError()) {
                setOutput(Text.fromError(inputText.toString()));
                return;
            }
            setOutput(current => current.isEmpty() ? current : Text.empty());
            if (inputText.isEmpty()) {
                return;
            }
            try {
                const qrCode = new QRCodeStyling(
                    generateOptionsHandle(action.current.option, inputText.toString(), image),
                );
                const result = await qrCode.getRawData();
                if (!result) {
                    throw new Error("generated error");
                }
                setOutput(await Text.fromBlob(result));
            } catch (error) {
                setOutput(Text.fromError($error(error)));
            }
        };

        void update();
    }, [image, inputDependency, optionDependency]);

    const uploadHandle = async (value: File) => {
        setImage((await Text.fromBlob(value)).setFileName(value.name));
    };

    const tabs = useMemo(
        () => [
            { label: $t("qrCode_generate_option_common"), name: "common" },
            { label: $t("qrCode_generate_option_content"), name: "content" },
            { label: $t("qrCode_generate_option_corners_square"), name: "corners_square" },
            { label: $t("qrCode_generate_option_corners_dot"), name: "corners_dot" },
            { label: $t("qrCode_generate_option_background"), name: "background" },
        ],
        [],
    );

    return (<div className="ctool-generator-editor-family ctool-generator-page ctool-qr-generator-page ctool-qr-workspace"><div className="ctool-qr-primary">
        <section className="ctool-qr-source">
            <header className="ctool-qr-source-header">
                <Bool
                    size="small"
                    value={action.current.option.is_show}
                    onChange={value => {
                        action.current.option.is_show = value;
                    }}
                    label={$t("main_ui_setting")}
                    border
                />
            </header>
            <TextInput
                value={action.current.input}
                onChange={value => {
                    action.current.input = value;
                }}
                upload="file"
            />
        </section>
        <TextOutput
            value={action.current.output}
            onChange={value => {
                action.current.output = value;
            }}
            allow={["image", "hex", "base64"]}
            content={output}
            onSuccess={() => action.save()}
        />
    </div>
    {action.current.option.is_show ? (
        <div className="ctool-page-option" style={{ marginTop: 5 }}>
            <Tabs
                value={action.current.option.tab}
                onChange={value => {
                    action.current.option.tab = value;
                }}
                lists={tabs}
            >
                <Align>
                    <InputNumber
                        size={generateOptionSize}
                        width={120}
                        value={action.current.option.margin}
                        onChange={value => {
                            action.current.option.margin = value;
                        }}
                        max={1000}
                        prepend={$t("qrCode_generate_option_margin")}
                    />
                    <Select
                        size={generateOptionSize}
                        options={["L", "M", "Q", "H"]}
                        value={action.current.option.error_correction_level}
                        onChange={value => {
                            action.current.option.error_correction_level = value;
                        }}
                        label={$t("qrCode_generate_option_correction")}
                    />
                    <UploadFile
                        size={generateOptionSize}
                        onSuccess={uploadHandle}
                        buttonType="text"
                        type="image"
                    />
                    <InputNumber
                        size={generateOptionSize}
                        width={100}
                        value={action.current.option.image_options.size}
                        onChange={value => {
                            action.current.option.image_options.size = value;
                        }}
                        max={10}
                        prepend={$t("qrCode_generate_option_size")}
                    />
                    <InputNumber
                        size={generateOptionSize}
                        width={120}
                        value={action.current.option.image_options.margin}
                        onChange={value => {
                            action.current.option.image_options.margin = value;
                        }}
                        max={1000}
                        prepend={$t("qrCode_generate_option_margin")}
                    />
                </Align>
                <GenerateOptionColor
                    value={action.current.option.dots_options.color}
                    onChange={value => {
                        action.current.option.dots_options.color = value;
                    }}
                    size={generateOptionSize}
                >
                    <Select
                        value={action.current.option.dots_options.type}
                        onChange={value => {
                            action.current.option.dots_options.type = value;
                        }}
                        options={optionMap(
                            ["square", "dots", "rounded", "classy", "extra-rounded", "classy-rounded"],
                            "qrCode_generate_option_",
                        )}
                        size={generateOptionSize}
                        label={$t("qrCode_generate_option_style")}
                    />
                </GenerateOptionColor>
                <GenerateOptionColor
                    value={action.current.option.corners_square_options.color}
                    onChange={value => {
                        action.current.option.corners_square_options.color = value;
                    }}
                    size={generateOptionSize}
                >
                    <Select
                        value={action.current.option.corners_square_options.type}
                        onChange={value => {
                            action.current.option.corners_square_options.type = value;
                        }}
                        options={optionMap(
                            ["dot", "square", "extra-rounded"],
                            "qrCode_generate_option_",
                        )}
                        size={generateOptionSize}
                        label={$t("qrCode_generate_option_style")}
                    />
                </GenerateOptionColor>
                <GenerateOptionColor
                    value={action.current.option.corners_dot_options.color}
                    onChange={value => {
                        action.current.option.corners_dot_options.color = value;
                    }}
                    size={generateOptionSize}
                >
                    <Select
                        value={action.current.option.corners_dot_options.type}
                        onChange={value => {
                            action.current.option.corners_dot_options.type = value;
                        }}
                        options={optionMap(["dot", "square"], "qrCode_generate_option_")}
                        size={generateOptionSize}
                        label={$t("qrCode_generate_option_style")}
                    />
                </GenerateOptionColor>
                <GenerateOptionColor
                    value={action.current.option.background_options.color}
                    onChange={value => {
                        action.current.option.background_options.color = value;
                    }}
                    size={generateOptionSize}
                />
            </Tabs>
        </div>
    ) : null}</div>)
}
