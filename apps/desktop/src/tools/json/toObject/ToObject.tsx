import { useEffect, useMemo, useState } from "react";
import { Align, Bool, Card, Editor, HeightResize, Input, Select } from "@/components";
import Serialize from "@/lib/serialize";
import { getDisplayName } from "@/lib/code";
import { transform } from "./index";
import type { Option } from "./index";

interface ToObjectProps {
    value: Option;
    onChange?: (value: Option) => void;
    onSuccess?: () => void;
    json?: Serialize;
}

type OptionValue = string | boolean;

export default function ToObject({
    value,
    onChange,
    onSuccess,
    json = Serialize.empty(),
}: ToObjectProps): React.ReactElement {
    const [output, setOutput] = useState("");
    const lang = value.lang;
    const optionDefine = useMemo(() => value.define(), [value, lang]);

    useEffect(() => {
        let active = true;
        const calculate = async (): Promise<void> => {
            if (json.isError()) {
                setOutput(json.error());
                return;
            }
            if (json.isEmpty()) {
                setOutput("");
                return;
            }
            try {
                const result = await transform(lang, json.toJson(), value.option[lang]);
                if (active) {
                    setOutput(result);
                    onSuccess?.();
                }
            } catch (error) {
                if (active) setOutput($error(error));
            }
        };
        void calculate();
        return () => { active = false; };
    }, [lang, json, value.option, onSuccess]);

    const updateOption = (name: string, nextValue: OptionValue): void => {
        value.option = {
            ...value.option,
            [lang]: {
                ...value.option[lang],
                [name]: nextValue,
            },
        };
        onChange?.(value);
    };

    return (
        <HeightResize row="1-250px">
            {({ height }: { height: number }) => (
                <>
                    <Editor value={output} height={height} lang={lang} />
                    <Card height={height} title={getDisplayName(lang)} padding="5px 10px">
                        <Align direction="vertical">
                            {optionDefine.map((item) => (
                                <div key={item.name}>
                                    {item.type === "boolean" ? (
                                        <Bool
                                            value={Boolean(value.option[lang][item.name])}
                                            onChange={(nextValue) => updateOption(item.name, nextValue)}
                                            label={item.description}
                                        />
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "14px" }}>{item.description}</div>
                                            {item.type === "select" ? (
                                                <Select
                                                    center={false}
                                                    width="100%"
                                                    value={value.option[lang][item.name]}
                                                    onChange={(nextValue: string) => updateOption(item.name, nextValue)}
                                                    options={item.value}
                                                />
                                            ) : (
                                                <Input
                                                    value={String(value.option[lang][item.name] ?? "")}
                                                    onChange={(nextValue) => updateOption(item.name, nextValue)}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </Align>
                    </Card>
                </>
            )}
        </HeightResize>
    );
}
