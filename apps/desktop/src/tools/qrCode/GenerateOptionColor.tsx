import type { ReactNode } from "react";
import { Align, Bool, Color, InputNumber, Radio } from "@/components";
import { optionMap } from "@/lib/helper";
import type { ComponentSizeType } from "@/types";
import { defaultGenerateColor } from "./util";
import type { GenerateColor } from "./util";

interface GenerateOptionColorProps {
    value?: GenerateColor;
    size?: ComponentSizeType;
    onChange: (value: GenerateColor) => void;
    children?: ReactNode;
}

export default function GenerateOptionColor({
    value = defaultGenerateColor("#ffffff"),
    size = "default",
    onChange,
    children,
}: GenerateOptionColorProps) {
    const setGradient = (gradient: GenerateColor["gradient"]) => {
        onChange({ ...value, gradient });
    };

    return (
        <Align>
            {children}
            <Bool
                border
                size={size}
                value={value.is_gradient}
                onChange={isGradient => onChange({ ...value, is_gradient: isGradient })}
                label={$t("qrCode_generate_option_gradient")}
            />
            {!value.is_gradient ? (
                <Color
                    size={size}
                    value={value.simple}
                    onChange={simple => onChange({ ...value, simple })}
                />
            ) : (
                <>
                    <Color
                        size={size}
                        value={value.gradient.colorStops[0].color}
                        onChange={color => {
                            const colorStops = [...value.gradient.colorStops];
                            colorStops[0] = { ...colorStops[0], color };
                            setGradient({ ...value.gradient, colorStops });
                        }}
                    />
                    <Color
                        size={size}
                        value={value.gradient.colorStops[1].color}
                        onChange={color => {
                            const colorStops = [...value.gradient.colorStops];
                            colorStops[1] = { ...colorStops[1], color };
                            setGradient({ ...value.gradient, colorStops });
                        }}
                    />
                    <Radio
                        size={size}
                        value={value.gradient.type}
                        onChange={type => setGradient({ ...value.gradient, type })}
                        options={optionMap(["linear", "radial"], "qrCode_generate_option_")}
                        button
                    />
                    <InputNumber
                        size={size}
                        value={value.gradient.rotation}
                        onChange={rotation => setGradient({ ...value.gradient, rotation })}
                        min={0}
                        max={360}
                        width={100}
                        prepend={$t("qrCode_generate_option_rotation")}
                    />
                </>
            )}
        </Align>
    );
}
