import { useMemo } from "react";
import { Bool, Button, Input } from "@/components";
import { initialize, useAction } from "@/store/action";
import { convert, convertType } from "./util.ts";
import type { ConvertType } from "./util.ts";

const initial = await initialize(
    {
        type: "",
        input: "",
        traditional: false,
        map: convertType,
    },
    { paste: false },
);

export default function ZhNumber() {
    const action = useAction(initial);

    const values = useMemo<Record<ConvertType, string>>(() => {
        const getHandle = (target: ConvertType) => {
            if (action.current.type === "" || action.current.input === "") {
                return "";
            }
            if (action.current.type === target) {
                return action.current.input;
            }
            try {
                return `${convert(
                    action.current.input,
                    action.current.type as ConvertType,
                    target,
                    action.current.traditional,
                )}`;
            } catch (error: unknown) {
                return $error(error);
            }
        };

        return {
            number: getHandle("number"),
            lower: getHandle("lower"),
            upper: getHandle("upper"),
            money: getHandle("money"),
        };
    }, [
        action.current.input,
        action.current.traditional,
        action.current.type,
    ]);

    const setHandle = (source: ConvertType, value: string) => {
        action.current.input = `${value}`;
        action.current.type = source;
        if (action.current.input !== "") {
            action.save();
        }
    };

    return (
        <div className="ctool-inspector-utility-family ctool-utility-family-page ctool-zh-number-page">
            <div className="ctool-utility-family-form">
                <div className="ctool-utility-family-options">
                    <Bool
                        border
                        label={$t("zhNumber_traditional")}
                        value={action.current.traditional}
                        onChange={(value: boolean) => {
                            action.current.traditional = value;
                        }}
                    />
                </div>
                {action.current.map.map((item: ConvertType) => (
                    <section className="ctool-utility-family-value" key={item}>
                        <header className="ctool-utility-family-value-header">
                            <strong>{$t(`zhNumber_${item}`)}</strong>
                            {values[item] !== "" ? (
                                <Button
                                    text={$t("main_ui_copy")}
                                    onClick={() => $copy(values[item])}
                                    size="small"
                                />
                            ) : null}
                        </header>
                        <Input
                            value={values[item]}
                            onChange={(value: string) => setHandle(item, value)}
                            placeholder={$t("zhNumber_input_placeholder", [
                                $t(`zhNumber_${item}`),
                            ])}
                            size="large"
                        />
                    </section>
                ))}
            </div>
        </div>
    );
}
