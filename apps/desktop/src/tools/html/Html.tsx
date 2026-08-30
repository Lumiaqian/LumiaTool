import { HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { htmlDecode, htmlEncode } from "js-htmlencode";

type ConvertType = "encode" | "decode" | "";

const initial = await initialize<{ input: string; type: ConvertType }>(
    {
        type: "",
        input: "",
    },
    { paste: false },
);

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
        <div className="lumia-transformer-page lumia-transformer-page--paired">
            <HeightResize className="lumia-transformer-layout">
                {({ small, large }) => (
                    <div className="lumia-transformer-panes">
                        <section
                            className="lumia-transformer-pane lumia-transformer-pane--source"
                            aria-label={$t("html_input_encode")}
                        >
                            <header className="lumia-transformer-pane-header">
                                <strong>{$t("html_input_encode")}</strong>
                            </header>
                            <div className="lumia-transformer-pane-body">
                                <Textarea
                                    value={getHandle("encode")}
                                    onChange={value => {
                                        setHandle("encode", value);
                                    }}
                                    placeholder={$t("html_input_encode")}
                                    height={small}
                                    copy
                                />
                            </div>
                        </section>
                        <section
                            className="lumia-transformer-pane lumia-transformer-pane--result"
                            aria-label={$t("html_input_decode")}
                        >
                            <header className="lumia-transformer-pane-header">
                                <strong>{$t("html_input_decode")}</strong>
                            </header>
                            <div className="lumia-transformer-pane-body">
                                <Textarea
                                    value={getHandle("decode")}
                                    onChange={value => {
                                        setHandle("decode", value);
                                    }}
                                    placeholder={$t("html_input_decode")}
                                    height={large}
                                    copy
                                />
                            </div>
                        </section>
                    </div>
                )}
            </HeightResize>
        </div>
    );
}
