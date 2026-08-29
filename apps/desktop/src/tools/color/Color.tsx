import { useEffect, useMemo, useRef } from "react";
import { Align, Button, Input } from "@/components";
import { initialize, useAction } from "@/store/action";
import { colord, extend } from "colord";
import type { ComponentSizeType } from "@/types";
import cmykPlugin from "colord/plugins/cmyk";
import hwbPlugin from "colord/plugins/hwb";
import labPlugin from "colord/plugins/lab";
import xyzPlugin from "colord/plugins/xyz";
import namesPlugin from "colord/plugins/names";
import lchPlugin from "colord/plugins/lch";
import * as AColorPicker from "a-color-picker";

extend([cmykPlugin, hwbPlugin, namesPlugin, lchPlugin, labPlugin, xyzPlugin]);

const initial = await initialize({ type: "rgb", input: "" }, { paste: false });
const size: ComponentSizeType = "default";
const typeLists = ["name", "hex", "rgb", "hsl", "hwb", "cmyk", "lch", "hsv", "lab", "xyz"] as const;
type ColorType = typeof typeLists[number];

const example: Record<ColorType, string> = (() => {
    const color = colord("red");
    return {
        name: color.toName({ closest: true }) ?? "",
        hex: color.toHex(), rgb: color.toRgbString(), hsl: color.toHslString(),
        hwb: color.toHwbString(), cmyk: color.toCmykString(), lch: color.toLchString(),
        hsv: JSON.stringify(color.toHsv()), lab: JSON.stringify(color.toLab()), xyz: JSON.stringify(color.toXyz()),
    };
})();

export default function Color() {
    const action = useAction(initial);
    const container = useRef<HTMLDivElement>(null);
    const picker = useRef<AColorPicker.ACPController | null>(null);
    const disablePickerChangeEvent = useRef(false);

    const getHandle = (target: ColorType): string => {
        if (action.current.input === "") return "";
        if (action.current.type === target) return action.current.input;
        try {
            const color = colord(["hsv", "lab", "xyz"].includes(action.current.type) ? JSON.parse(action.current.input) : action.current.input);
            switch (target) {
                case "name": return color.toName({ closest: true }) ?? "";
                case "hex": return color.toHex();
                case "rgb": return color.toRgbString();
                case "hsl": return color.toHslString();
                case "hwb": return color.toHwbString();
                case "cmyk": return color.toCmykString();
                case "lch": return color.toLchString();
                case "hsv": return JSON.stringify(color.toHsv());
                case "lab": return JSON.stringify(color.toLab());
                case "xyz": return JSON.stringify(color.toXyz());
            }
        } catch (error) {
            return $error(error);
        }
    };

    const setHandle = (source: ColorType, value: string) => {
        action.current.input = value;
        action.current.type = source;
        if (value !== "") action.save();
    };

    useEffect(() => {
        const element = container.current;
        if (!element) return;
        const controller = AColorPicker.createPicker({
            attachTo: element,
            color: action.current.input,
            showHSL: false, showRGB: false, showHEX: false, showAlpha: true,
            hueBarSize: [218, 11], alphaBarSize: [218, 11], slBarSize: [300, 301],
        });
        picker.current = controller;
        const change = (_controller: AColorPicker.ACPController, color?: string) => {
            if (disablePickerChangeEvent.current) {
                disablePickerChangeEvent.current = false;
                return;
            }
            setHandle("rgb", color || "");
        };
        controller.on("change", change);
        return () => {
            controller.off("change", change);
            element.replaceChildren();
            picker.current = null;
        };
    }, []);

    const rgb = useMemo(() => getHandle("rgb"), [action.current.input, action.current.type]);
    useEffect(() => {
        if (picker.current && rgb !== "") {
            disablePickerChangeEvent.current = true;
            picker.current.color = rgb;
        }
    }, [rgb]);

    return (
        <div className="lumia-generator-editor-family lumia-generator-page lumia-color-generator-page">
            <section className="lumia-generator-preview lumia-color-picker-panel" aria-label={$t("main_ui_input")}>
                <div className="lumia-color-picker-stage" ref={container} />
            </section>
            <section className="lumia-generator-result lumia-color-results" aria-label={$t("main_ui_output")}>
                <Align direction="vertical">
                    {typeLists.map((type) => (
                        <Align key={type} className="lumia-color-result-row">
                            <Input value={getHandle(type)} onChange={(value: string) => setHandle(type, value)} placeholder={$t("color_input_placeholder", [type, example[type]])} size={size} />
                            <Button size="small" text={type} onClick={() => $copy(getHandle(type))} />
                        </Align>
                    ))}
                </Align>
            </section>
        </div>
    );
}
