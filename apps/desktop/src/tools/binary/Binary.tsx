import { Align, Display, HeightResize, Select, Textarea } from "@/components";
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
        <HeightResize>
            {({ height }) => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 5 }}>
                    <Display position="top-right" extra={<Select size="small" value={action.current.length} onChange={(value) => { action.current.length = value; }} options={lengthOptions} />}>
                        <Textarea height={height} value={action.current.input} onChange={(value) => { action.current.input = value; }} placeholder={$t("binary_input")} />
                    </Display>
                    <Align direction="vertical">
                        <Textarea height={(height - 10) / 3} value={result("trueForm")} placeholder={$t("binary_true_form")} copy={$t("binary_true_form")} />
                        <Textarea height={(height - 10) / 3} value={result("inverse")} placeholder={$t("binary_inverse")} copy={$t("binary_inverse")} />
                        <Textarea height={(height - 10) / 3} value={result("complement")} placeholder={$t("binary_complement")} copy={$t("binary_complement")} />
                    </Align>
                </div>
            )}
        </HeightResize>
    );
}
