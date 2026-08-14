import { useCallback, useEffect, useMemo } from "react";
import { Align, Bool, Button, Card, HeightResize, Icon, InputNumber, SerializeOutput } from "@/components";
import { uuidParse, uuidV4, ulid } from "./util";
import { initialize, useAction } from "@/store/action";
import Serialize from "@/lib/serialize";
import { createSerializeOutput } from "@/components/serialize";
import type { SerializeOutput as SerializeOutputType } from "@/components/serialize";

const initial = await initialize<{
    amount: number;
    outputOption: SerializeOutputType;
    hyphens: boolean;
    is_add_quote: boolean;
    isUpper: boolean;
    uint8_array: boolean;
    ulid: boolean;
    result: string[];
}>({
    amount: 10,
    hyphens: true,
    is_add_quote: false,
    isUpper: false,
    uint8_array: false,
    ulid: false,
    outputOption: createSerializeOutput("text"),
    result: [],
});

export default function Uuid() {
    const action = useAction(initial);
    const handle = useCallback(() => {
        const result: string[] = [];
        for (let i = 0; i < action.current.amount; i++) {
            result.push(action.current.ulid ? ulid() : uuidV4());
        }
        action.current.result = result;
    }, [action, action.current.amount, action.current.ulid]);

    const output = useMemo<Serialize>(() => {
        if (action.current.result.length < 1) return Serialize.empty();
        return Serialize.formObject(action.current.result.map(source => {
            let item = source;
            if (!action.current.ulid) {
                if (action.current.uint8_array) item = `[${uuidParse(item).toString()}]`;
                if (!action.current.hyphens) item = item.replace(/-/g, "");
            }
            return action.current.isUpper ? item.toUpperCase() : item.toLowerCase();
        }));
    }, [action.current.result, action.current.ulid, action.current.uint8_array, action.current.hyphens, action.current.isUpper]);

    useEffect(() => {
        if (action.current.result.length < 1) handle();
    }, [action, handle]);

    useEffect(() => {
        handle();
    }, [handle, action.current.amount, action.current.ulid]);

    useEffect(() => {
        if (action.current.result.length > 0) action.save();
    }, [action, action.current.amount, action.current.outputOption, action.current.hyphens, action.current.is_add_quote, action.current.isUpper, action.current.uint8_array, action.current.ulid, action.current.result]);

    return (
        <Align direction="vertical">
            <Card className="ctool-page-option">
                <Align horizontal="center">
                    <InputNumber value={action.current.amount} onChange={value => { action.current.amount = value; }} label={$t("uuid_amount")} width={110} />
                    <Bool border label="ULID" value={action.current.ulid} onChange={value => { action.current.ulid = value; }} />
                    <Bool border label={$t("uuid_is_upper")} value={action.current.isUpper} onChange={value => { action.current.isUpper = value; }} />
                    <Bool border label={$t("uuid_hyphens")} disabled={action.current.ulid} value={action.current.hyphens} onChange={value => { action.current.hyphens = value; }} />
                    <Bool border label={$t("uuid_uint8_array")} disabled={action.current.ulid} value={action.current.uint8_array} onChange={value => { action.current.uint8_array = value; }} />
                    <Button onClick={handle}><Icon name="refresh" /></Button>
                </Align>
            </Card>
            <HeightResize reduce={5} append={[".ctool-page-option"]}>
                {({ height }: { height: number }) => (
                    <SerializeOutput
                        value={action.current.outputOption}
                        onChange={value => { action.current.outputOption = value; }}
                        allow={["json", "xml", "yaml", "toml", "properties", "php_array", "text"]}
                        height={height}
                        content={output}
                    />
                )}
            </HeightResize>
        </Align>
    );
}
