import { useEffect, useMemo, useRef, useState } from "react";
import {
    Align,
    Bool,
    Button,
    Card,
    HeightResize,
    Icon,
    Input,
    InputNumber,
    Modal,
    SerializeOutput,
    Textarea,
} from "@/components";
import { createSerializeOutput } from "@/components/serialize";
import type { SerializeOutput as SerializeOutputType } from "@/components/serialize";
import Serialize from "@/lib/serialize";
import { initialize, useAction } from "@/store/action";
import type { ComponentSizeType } from "@/types";
import { intersection } from "lodash";

const size: ComponentSizeType = "small";
const baseDigital = "0123456789";
const baseLowercase = "abcdefghijklmnopqrstuvwxyz";
const baseUppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const baseSymbol = "`~!@#$%^&*()-_=+[{]}|;:',<.>/?";

interface RandomStringState {
    amount: number;
    length: number;
    outputOption: SerializeOutputType;
    base: string;
    result: string[];
}

const initial = await initialize<RandomStringState>({
    amount: 10,
    length: 32,
    outputOption: createSerializeOutput("text"),
    base: `${baseDigital}${baseLowercase}${baseUppercase}`,
    result: [],
});

export default function RandomString() {
    const action = useAction(initial);
    const [baseSetting, setBaseSetting] = useState({ base: action.current.base, show: false });
    const generationWatcherMounted = useRef(false);

    const generate = () => {
        const chars = `${action.current.base}`;
        const randomStringLists: string[] = [];
        for (let i = 0, l = action.current.amount; i < l; i++) {
            const availableChars = chars.split("");
            let randomString = "";
            for (let j = 0, k = action.current.length; j < k; j++) {
                if (availableChars.length < 1) break;
                const index = Math.floor(Math.random() * availableChars.length);
                randomString += availableChars[index];
            }
            randomStringLists.push(randomString);
        }
        action.current.result = randomStringLists;
    };

    const resultDependency = JSON.stringify(action.current.result);
    const currentDependency = JSON.stringify(action.current);

    const serializeOutput = useMemo(
        () => Serialize.formObject(action.current.result),
        [resultDependency],
    );

    useEffect(() => {
        if (action.current.result.length < 1) {
            generate();
        }
    }, [action]);

    useEffect(() => {
        if (!generationWatcherMounted.current) {
            generationWatcherMounted.current = true;
            return;
        }
        generate();
    }, [action.current.amount, action.current.base, action.current.length]);

    useEffect(() => {
        if (action.current.result.length < 1) {
            return;
        }
        action.save();
    }, [action, currentDependency]);

    const setBase = (type: "digital" | "lowercase" | "uppercase" | "symbol" | "reset") => {
        if (type === "reset") {
            setBaseSetting(current => ({
                ...current,
                base: `${baseDigital}${baseLowercase}${baseUppercase}`,
            }));
            return;
        }
        setBaseSetting(current => {
            let base = `${current.base}`.split("");
            const chars = {
                digital: baseDigital,
                lowercase: baseLowercase,
                uppercase: baseUppercase,
                symbol: baseSymbol,
            }[type].split("");
            if (intersection(base, chars).length > 0) {
                base = base.filter(char => !chars.includes(char));
            } else {
                base = [...base, ...chars];
            }
            return { ...current, base: [...new Set(base)].join("") };
        });
    };

    const baseIsExist = useMemo(() => {
        const base = `${baseSetting.base}`.split("");
        return {
            digital: intersection(base, baseDigital.split("")).length > 0,
            lowercase: intersection(base, baseLowercase.split("")).length > 0,
            uppercase: intersection(base, baseUppercase.split("")).length > 0,
            symbol: intersection(base, baseSymbol.split("")).length > 0,
        };
    }, [baseSetting.base]);

    return (
        <>
            <Align direction="vertical">
                <Card className="ctool-page-option">
                    <Align horizontal="center">
                        <Input
                            value={action.current.base}
                            onChange={value => {
                                action.current.base = value;
                            }}
                            width={300}
                            append={
                                <Button
                                    onClick={() =>
                                        setBaseSetting({ base: action.current.base, show: true })
                                    }
                                >
                                    <Icon hover name="setting" tooltip={$t("main_ui_setting")} size={12} />
                                </Button>
                            }
                        />
                        <InputNumber
                            value={action.current.length}
                            onChange={value => {
                                action.current.length = value;
                            }}
                            width={100}
                            label={$t("randomString_length")}
                        />
                        <InputNumber
                            value={action.current.amount}
                            onChange={value => {
                                action.current.amount = value;
                            }}
                            width={100}
                            label={$t("randomString_amount")}
                        />
                        <Button onClick={generate}>
                            <Icon name="refresh" />
                        </Button>
                    </Align>
                </Card>
                <HeightResize reduce={5} append={[".ctool-page-option"]}>
                    {({ height }) => (
                        <SerializeOutput
                            value={action.current.outputOption}
                            onChange={value => {
                                action.current.outputOption = value;
                            }}
                            allow={["json", "xml", "yaml", "toml", "properties", "php_array", "text"]}
                            height={height}
                            content={serializeOutput}
                        />
                    )}
                </HeightResize>
            </Align>
            <Modal
                title={`${$t("main_ui_setting")} ${$t("randomString_chars")}`}
                value={baseSetting.show}
                onChange={show => setBaseSetting(current => ({ ...current, show }))}
                footerType="long"
                onOk={() => {
                    action.current.base = baseSetting.base;
                    setBaseSetting(current => ({ ...current, show: false }));
                }}
            >
                <Align direction="vertical">
                    <Textarea
                        value={baseSetting.base}
                        onChange={base => setBaseSetting(current => ({ ...current, base }))}
                        height={300}
                    />
                    <Align horizontal="center">
                        <Bool
                            size={size}
                            border
                            label={$t("randomString_digital")}
                            value={baseIsExist.digital}
                            onChange={() => setBase("digital")}
                        />
                        <Bool
                            size={size}
                            border
                            label={$t("randomString_lowercase")}
                            value={baseIsExist.lowercase}
                            onChange={() => setBase("lowercase")}
                        />
                        <Bool
                            size={size}
                            border
                            label={$t("randomString_uppercase")}
                            value={baseIsExist.uppercase}
                            onChange={() => setBase("uppercase")}
                        />
                        <Bool
                            size={size}
                            border
                            label={$t("randomString_symbol")}
                            value={baseIsExist.symbol}
                            onChange={() => setBase("symbol")}
                        />
                        <Button size={size} text={$t("main_ui_reset")} onClick={() => setBase("reset")} />
                    </Align>
                </Align>
            </Modal>
        </>
    );
}
