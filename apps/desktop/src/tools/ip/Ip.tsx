import { useMemo, useState } from "react";
import { isArray } from "lodash";
import { Align, Button, Input, Link, SerializeOutput } from "@/components";
import { createSerializeOutput } from "@/components/serialize";
import type { SerializeOutput as SerializeOutputType } from "@/components/serialize";
import Serialize from "@/lib/serialize";
import { requestJson } from "@/lib/proxy";
import { initialize, useAction } from "@/store/action";

const ipReg =
    /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/gi;

type GeoResult = Record<string, unknown>;

const initial = await initialize<{ input: string; option: SerializeOutputType; result: GeoResult | "" }>(
    {
        input: "",
        option: createSerializeOutput("json"),
        result: "",
    },
    { paste: input => ipReg.test(input) || input === "localhost" },
);

export default function Ip() {
    const action = useAction(initial);
    const [isLoading, setIsLoading] = useState(false);

    const outputSerialize = useMemo(
        () => (action.current.result === "" ? Serialize.empty() : Serialize.formObject(action.current.result)),
        [action.current.result],
    );

    const query = (): void => {
        setIsLoading(true);
        const url = new URL("https://get.geojs.io/v1/ip/geo.json");
        if (action.current.input !== "localhost") {
            url.searchParams.set("ip", action.current.input);
        }
        void requestJson<GeoResult | GeoResult[]>(url.toString())
            .then(data => {
                action.current.result = isArray(data) && data.length < 2 ? (data[0] ?? {}) : (data as GeoResult);
                action.save();
            })
            .catch((error: unknown) => {
                action.current.result = { error: $error(error, false) };
                action.save();
            })
            .finally(() => setIsLoading(false));
    };

    const local = (): void => {
        action.current.input = "localhost";
        query();
    };

    return (
        <div className="lumia-inspector-utility-family lumia-inspector-family-page lumia-ip-page">
            <div className="lumia-inspector-family-split">
                <section className="lumia-inspector-family-panel lumia-inspector-family-source">
                    <header className="lumia-inspector-family-panel-header">
                        <strong>{$t("main_ui_input")}</strong>
                        <Align>
                            <Button type="general" size="small" onClick={local}>
                                {$t("ip_local")}
                            </Button>
                            <Button type="primary" loading={isLoading} size="small" onClick={query}>
                                {$t("ip_query")}
                            </Button>
                        </Align>
                    </header>
                    <div className="lumia-inspector-family-panel-body lumia-ip-query-form">
                        <Input
                            value={action.current.input}
                            onChange={value => {
                                action.current.input = value;
                            }}
                            size="large"
                            placeholder={$t("ip_input")}
                        />
                    </div>
                    <footer className="lumia-inspector-family-panel-footer">
                        <Link href="https://geojs.io/">{$t("ip_info_source")}: https://geojs.io/</Link>
                    </footer>
                </section>
                <section className="lumia-inspector-family-panel lumia-inspector-family-result">
                    <header className="lumia-inspector-family-panel-header">
                        <strong>{$t("main_ui_output")}</strong>
                    </header>
                    <div className="lumia-inspector-family-panel-body">
                        <SerializeOutput
                            allow={["json", "xml", "yaml", "toml", "php_array", "properties", "http_query_string"]}
                            content={outputSerialize}
                            disabledBorder
                            height="100%"
                            value={action.current.option}
                            onChange={value => {
                                action.current.option = value;
                            }}
                            onSuccess={() => {
                                action.save();
                            }}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
