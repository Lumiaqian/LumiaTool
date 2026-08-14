import { useMemo, useState } from "react";
import axios from "axios";
import { isArray } from "lodash";
import { Align, Button, Display, Input, Link, SerializeOutput } from "@/components";
import { createSerializeOutput } from "@/components/serialize";
import type { SerializeOutput as SerializeOutputType } from "@/components/serialize";
import Serialize from "@/lib/serialize";
import { initialize, useAction } from "@/store/action";

const ipReg = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/ig;

type GeoResult = Record<string, unknown>;

const initial = await initialize<{ input: string; option: SerializeOutputType; result: GeoResult | "" }>({
    input: "",
    option: createSerializeOutput("json"),
    result: "",
}, { paste: (input) => ipReg.test(input) || input === "localhost" });

export default function Ip() {
    const action = useAction(initial);
    const [isLoading, setIsLoading] = useState(false);

    const outputSerialize = useMemo(
        () => action.current.result === "" ? Serialize.empty() : Serialize.formObject(action.current.result),
        [action.current.result],
    );
    const isResult = !outputSerialize.isEmpty() || outputSerialize.isError();

    const query = (): void => {
        setIsLoading(true);
        void axios<GeoResult | GeoResult[]>({
            url: "https://get.geojs.io/v1/ip/geo.json",
            params: action.current.input !== "localhost" ? { ip: action.current.input } : {},
        }).then(({ data }) => {
            action.current.result = isArray(data) && data.length < 2 ? (data[0] ?? {}) : data as GeoResult;
            action.save();
        }).catch((error: unknown) => {
            action.current.result = { error: $error(error, false) };
            action.save();
        }).then(() => {
            setIsLoading(false);
        });
    };

    const local = (): void => {
        action.current.input = "localhost";
        query();
    };

    return (
        <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Align width={600} direction="vertical">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", columnGap: 5 }}>
                    <Display
                        type="general"
                        text={action.current.input === "" ? $t("ip_local") : ""}
                        onClick={local}
                        position="right-center"
                    >
                        <Input
                            value={action.current.input}
                            onChange={(value) => { action.current.input = value; }}
                            size="large"
                            placeholder={$t("ip_input")}
                        />
                    </Display>
                    <Button type="primary" loading={isLoading} size="large" onClick={query}>
                        {$t("ip_query")}
                    </Button>
                </div>
                {!isResult && (
                    <div style={{ textAlign: "center" }}>
                        <Link href="https://geojs.io/">{$t("ip_info_source")}: https://geojs.io/</Link>
                    </div>
                )}
                {isResult && (
                    <SerializeOutput
                        allow={["json", "xml", "yaml", "toml", "php_array", "properties", "http_query_string"]}
                        content={outputSerialize}
                        height={300}
                        value={action.current.option}
                        onChange={(value) => { action.current.option = value; }}
                        onSuccess={() => { action.save(); }}
                    />
                )}
            </Align>
        </div>
    );
}
