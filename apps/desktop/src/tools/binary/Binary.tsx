import { HeightResize, Select, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { generate, lengthLists } from "./util";
import type { GenerateType } from "./util";

const initial = await initialize({
    input: "",
    length: 8,
}, {
    paste: (str) => /^[\d\-+\n]+$/.test(str),
});

export default function Binary() {
    const action = useAction(initial);
    const lengthOptions = lengthLists.map((value) => ({ value, label: $t("binary_length", [value]) }));

    const result = (type: GenerateType) => {
        if (action.current.input.trim() === "") return "";
        const output: string[] = [];
        for (const input of action.current.input.trim().split("\n")) {
            try {
                output.push(`${generate(input.trim(), action.current.length, type)}`);
            } catch (error) {
                output.push($t("binary_error", [$error(error)]));
            }
        }
        if (output.length > 0) action.save();
        return output.join("\n");
    };

    return (
        <div className="ctool-generator-editor-family ctool-generator-page ctool-binary-generator-page">
            <HeightResize className="ctool-binary-workspace">
                {({ height }) => (
                    <>
                        <section className="ctool-generator-options" aria-label={$t("main_ui_input")}>
                            <div className="ctool-page-option">
                                <Select size="small" value={action.current.length} onChange={(value) => { action.current.length = value; }} options={lengthOptions} />
                            </div>
                            <Textarea height={height} value={action.current.input} onChange={(value) => { action.current.input = value; }} placeholder={$t("binary_input")} />
                        </section>
                        <section className="ctool-generator-result ctool-binary-results" aria-label={$t("main_ui_output")}>
                            <Textarea value={result("trueForm")} placeholder={$t("binary_true_form")} copy={$t("binary_true_form")} />
                            <Textarea value={result("inverse")} placeholder={$t("binary_inverse")} copy={$t("binary_inverse")} />
                            <Textarea value={result("complement")} placeholder={$t("binary_complement")} copy={$t("binary_complement")} />
                        </section>
                    </>
                )}
            </HeightResize>
        </div>
    );
}
