import { HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { htmlDecode, htmlEncode } from "js-htmlencode";

type ConvertType = "encode" | "decode" | "";

const initial = await initialize<{ input: string; type: ConvertType }>({
    type: "",
    input: "",
}, { paste: false });

export default function Html() {
    const action = useAction(initial);

    const getHandle = (target: ConvertType): string => {
        if (action.current.type === "" || action.current.input === "") {
            return "";
        }
        if (action.current.type === target) {
            return action.current.input;
        }
        try {
            if (action.current.type === "encode") {
                return htmlEncode(action.current.input);
            }
            return htmlDecode(action.current.input);
        } catch (error: unknown) {
            return $error(error);
        }
    };

    const setHandle = (source: ConvertType, value: string): void => {
        action.current.input = value;
        action.current.type = source;
        if (action.current.input !== "") {
            action.save();
        }
    };

    return (
        <HeightResize className="ctool-transformer-page ctool-transformer-page--legacy" >{({ height }) => (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <Textarea
                    value={getHandle("encode")}
                    onChange={(value) => { setHandle("encode", value); }}
                    placeholder={$t("html_input_encode")}
                    height={height}
                    copy
                />
                <Textarea
                    value={getHandle("decode")}
                    onChange={(value) => { setHandle("decode", value); }}
                    placeholder={$t("html_input_decode")}
                    height={height}
                    copy
                />
            </div>
        )}</HeightResize>
    );
}
