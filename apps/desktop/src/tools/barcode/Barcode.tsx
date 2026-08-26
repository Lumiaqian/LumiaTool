import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Align, Bool, Card, Color, Exception, Input, InputNumber, Select } from "@/components";
import { initialize, useAction } from "@/store/action";

const initial = await initialize({
    input: "",
    format: "CODE128",
    width: 2,
    height: 50,
    margin: 10,
    background: "#FFFFFF",
    line_color: "#000000",
    text_align: "center",
    text_position: "bottom",
    font: "monospace",
    font_bold: false,
    font_italic: false,
    font_size: 20,
    text_margin: 0,
}, {
    paste: (str) => str.length <= 30 && [...str].every((character) => character.charCodeAt(0) >= 0 && character.charCodeAt(0) <= 127),
});

const barcodeFormat = ["CODE128", "CODE128A", "CODE128B", "CODE128C", "EAN13", "EAN8", "UPC", "CODE39", "ITF14", "ITF", "MSI", "MSI10", "MSI11", "MSI1010", "MSI1110", "pharmacode"];
const fontFamily = ["monospace", "Sans-serif", "Serif", "Fantasy", "Cursive"];

export default function Barcode() {
    const action = useAction(initial);
    const container = useRef<HTMLCanvasElement>(null);
    const [valid, setValid] = useState(false);
    const showText = ["top", "bottom"].includes(action.current.text_position);
    const textPositionOptions = useMemo(() => ["close", "top", "bottom"].map((item) => ({ label: $t(`barcode_${item}`), value: item })), []);
    const textAlignOptions = useMemo(() => ["left", "center", "right"].map((item) => ({ label: $t(`barcode_${item}`), value: item })), []);

    useEffect(() => {
        if (!container.current) return;
        const option = action.current;
        JsBarcode(container.current, option.input !== "" ? option.input : "Example 1234", {
            format: option.format,
            width: option.width,
            height: option.height,
            margin: option.margin,
            background: option.background,
            lineColor: option.line_color,
            displayValue: showText,
            textPosition: option.text_position,
            textAlign: option.text_align,
            font: option.font,
            fontOptions: [option.font_bold && "bold", option.font_italic && "italic"].filter((item): item is string => typeof item === "string").join(" "),
            fontSize: option.font_size,
            textMargin: option.text_margin,
            valid: (result) => {
                setValid(result);
                if (option.input !== "") action.save();
            },
        });
    }, [action.current.input, action.current.format, action.current.width, action.current.height, action.current.margin, action.current.background, action.current.line_color, action.current.text_align, action.current.text_position, action.current.font, action.current.font_bold, action.current.font_italic, action.current.font_size, action.current.text_margin, showText]);

    const copy = () => {
        if (container.current) action.success({ copy_image: container.current.toDataURL("image/png"), is_save: false });
    };

    return (
        <div className="ctool-generator-editor-family ctool-generator-page ctool-barcode-generator-page">
            <aside className="ctool-generator-options" aria-label={$t("main_ui_setting")}>
                <Card className="ctool-barcode-options">
                    <Align className="ctool-generator-option-grid">
                        <Input value={action.current.input} onChange={(value) => { action.current.input = value; }} width={260} placeholder={$t("main_ui_input")} append={<Select value={action.current.format} onChange={(value) => { action.current.format = value; }} options={barcodeFormat} />} />
                        <Color value={action.current.background} onChange={(value) => { action.current.background = value; }} label={$t("barcode_background")} />
                        <Color value={action.current.line_color} onChange={(value) => { action.current.line_color = value; }} label={$t("barcode_line_color")} />
                        <InputNumber width={100} value={action.current.width} onChange={(value) => { action.current.width = value; }} min={1} max={4} label={$t("barcode_bar_width")} />
                        <InputNumber width={100} value={action.current.height} onChange={(value) => { action.current.height = value; }} min={10} max={150} label={$t("barcode_height")} />
                        <InputNumber width={100} value={action.current.margin} onChange={(value) => { action.current.margin = value; }} max={25} label={$t("barcode_margin")} />
                        <Select label={$t("barcode_text")} value={action.current.text_position} onChange={(value) => { action.current.text_position = value; }} options={textPositionOptions} />
                        <InputNumber width={100} disabled={!showText} value={action.current.text_margin} onChange={(value) => { action.current.text_margin = value; }} min={-15} max={40} label={$t("barcode_margin")} />
                        <Select label={$t("barcode_text_align")} disabled={!showText} value={action.current.text_align} onChange={(value) => { action.current.text_align = value; }} options={textAlignOptions} />
                        <Select disabled={!showText} value={action.current.font} onChange={(value) => { action.current.font = value; }} options={fontFamily} label={$t("barcode_font")} />
                        <InputNumber width={100} disabled={!showText} value={action.current.font_size} onChange={(value) => { action.current.font_size = value; }} min={8} max={36} label={$t("barcode_font_size")} />
                        <Bool border disabled={!showText} value={action.current.font_bold} onChange={(value) => { action.current.font_bold = value; }} label={$t("barcode_bold")} />
                        <Bool border disabled={!showText} value={action.current.font_italic} onChange={(value) => { action.current.font_italic = value; }} label={$t("barcode_italic")} />
                    </Align>
                </Card>
            </aside>
            <section className="ctool-generator-preview" aria-label={$t("main_ui_output")}>
                <Card className="ctool-preview-panel">
                    <div className="ctool-preview-stage">
                        <button
                            type="button"
                            className="ctool-preview-action"
                            onClick={copy}
                            disabled={!valid}
                            aria-label={$t("main_ui_copy")}
                        >
                            <canvas ref={container} hidden={!valid} />
                        </button>
                        {!valid && <Exception content={$t("barcode_generate_fail")} />}
                    </div>
                </Card>
            </section>
        </div>
    );
}
