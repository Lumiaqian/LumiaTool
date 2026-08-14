import { useEffect, useMemo, useRef, useState } from "react";
import { Align, Button, Display, ExtendPage, Input, Select } from "@/components";
import convert, { defaultAlphabet } from "@/lib/radix";
import { initialize, useAction } from "@/store/action";
import type { ComponentSizeType, SelectOption } from "@/types";
import { range } from "lodash";

const initial = await initialize(
    {
        type: 0,
        input: "",
        map: [2, 8, 10, 16, 60, 64],
        alphabet: "",
    },
    { paste: false },
);

const size: ComponentSizeType = "large";

export default function Radix() {
    const action = useAction(initial);
    const [isMore, setIsMore] = useState(false);
    const [alphabet, setAlphabet] = useState(action.current.alphabet || defaultAlphabet);
    const alphabetMounted = useRef(false);

    const base = useMemo<SelectOption>(() => {
        return range(2, 65).map(n => ({ value: n, label: $t("radix_base", [n]) }));
    }, []);

    useEffect(() => {
        if (!alphabetMounted.current) {
            alphabetMounted.current = true;
            return;
        }
        action.current.alphabet = alphabet === defaultAlphabet ? "" : alphabet;
    }, [action, alphabet]);

    const getHandle = (target: number) => {
        if (alphabet.length !== 64) {
            return $t("radix_alphabet_length_error");
        }
        if (action.current.type === 0 || action.current.input === "") {
            return "";
        }
        if (action.current.type === target) {
            return action.current.input;
        }
        try {
            return convert(action.current.input, action.current.type, target, alphabet);
        } catch (error) {
            return $error(error);
        }
    };

    const setHandle = (source: number, value: string) => {
        action.current.input = value;
        action.current.type = source;
        if (action.current.input !== "") {
            action.save();
        }
    };

    const isValid = useMemo(
        () => /^[\-0-9]+$/.test(getHandle(10)) && /^[\-0-1]+$/.test(getHandle(2)),
        [
            action.current.input,
            action.current.type,
            action.current.map[0],
            action.current.map[1],
            action.current.map[2],
            action.current.map[3],
            action.current.map[4],
            action.current.map[5],
            alphabet,
        ],
    );

    return (
        <>
            <Align direction="vertical">
                {range(0, 6).map(i => {
                    const currentBase = action.current.map[i];
                    const numberValue = getHandle(currentBase);
                    return (
                        <Display
                            key={i}
                            position="right-center"
                            extra={
                                <Align>
                                    <Select
                                        value={currentBase}
                                        onChange={value => {
                                            action.current.map[i] = value;
                                        }}
                                        options={base}
                                        size="small"
                                        disabled={isValid && currentBase === action.current.type}
                                    />
                                    {isValid ? (
                                        <Button
                                            text={$t("main_ui_copy")}
                                            onClick={() => $copy(numberValue)}
                                            size="small"
                                            type="primary"
                                        />
                                    ) : null}
                                </Align>
                            }
                        >
                            <Input
                                value={numberValue}
                                onChange={value => setHandle(currentBase, value)}
                                placeholder={$t("radix_input_placeholder")}
                                size={size}
                            />
                        </Display>
                    );
                })}
                {isValid ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px" }}>
                        <Button size={size} onClick={() => setIsMore(true)} text={$t("main_ui_more")} />
                        <Button
                            size={size}
                            onClick={() => {
                                action.current.input = "";
                            }}
                            text={$t("main_ui_clear")}
                        />
                    </div>
                ) : (
                    <Display
                        position="right-center"
                        text={alphabet !== defaultAlphabet ? $t("radix_reset") : ""}
                        type="danger"
                        onClick={() => setAlphabet(defaultAlphabet)}
                    >
                        <Input
                            value={alphabet}
                            onChange={setAlphabet}
                            placeholder={$t("radix_alphabet")}
                            size={size}
                            label={$t("radix_alphabet")}
                        />
                    </Display>
                )}
            </Align>
            <ExtendPage value={isMore} onChange={setIsMore}>
                <div
                    style={{
                        width: "100%",
                        rowGap: 5,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                    }}
                >
                    {range(2, 65).map(i => {
                        const value = getHandle(i);
                        return (
                            <Input
                                key={i}
                                value={value}
                                prepend={
                                    <span
                                        style={{
                                            ...(i === action.current.type ? { color: "red" } : {}),
                                            width: 20,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => $copy(value)}
                                    >
                                        {i}
                                    </span>
                                }
                            />
                        );
                    })}
                </div>
            </ExtendPage>
        </>
    );
}
