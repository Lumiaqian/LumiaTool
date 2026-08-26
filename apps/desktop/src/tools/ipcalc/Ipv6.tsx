import { useEffect, useMemo, useState } from "react";
import {
    Align,
    Bool,
    Button,
    Card,
    Exception,
    ExtendPage,
    HeightResize,
    HelpTip,
    Input,
    InputNumber,
    Select,
    SerializeOutput,
} from "@/components";
import { createSerializeOutput } from "@/components/serialize";
import { initialize, useAction } from "@/store/action";
import type { SelectOption } from "@/types";
import { range } from "lodash";
import Item from "./Item";
import util from "./utilV6";

const initial = await initialize({
    input: "2404:68::",
    mask0: 32,
    mask1: 64,
    limit: 100,
    abbr: false,
    random: false,
    maskPtr: 32,
    subnetOption: createSerializeOutput("text"),
}, {
    paste: (input: string) => {
        try {
            util.validate(input);
        } catch (_error: unknown) {
            return false;
        }
        return true;
    },
});

const mask0Lists = range(0, 128).map((item) => ({ value: item, label: `/${item}` }));
const maskPtrLists = range(0, 129, 4).map((item) => ({ value: item, label: `/${item}` }));

export default function Ipv6() {
    const action = useAction(initial);
    const [error, setError] = useState("");
    const [showSubnet, setShowSubnet] = useState(false);
    const subnetOptionDependency = JSON.stringify(action.current.subnetOption);

    useEffect(() => {
        setError("");
        try {
            if (action.current.input.trim() === "") {
                throw new Error("Input Empty");
            }
            util.validate(action.current.input);
        } catch (caught: unknown) {
            setError($error(caught));
        }
    }, [action.current.input]);

    useEffect(() => {
        if (action.current.input.trim() === "") {
            return;
        }
        action.save();
    }, [
        action.current.input,
        action.current.mask0,
        action.current.mask1,
        action.current.limit,
        action.current.abbr,
        action.current.random,
        action.current.maskPtr,
        subnetOptionDependency,
    ]);

    const trimmedInput = action.current.input.trim();
    const normalize = useMemo(() => util.normalize(trimmedInput), [trimmedInput]);
    const abbreviate = useMemo(() => util.abbreviate(trimmedInput), [trimmedInput]);
    const subnet = useMemo(
        () => util.subnet(trimmedInput, action.current.mask0, action.current.mask1, action.current.limit, action.current.abbr, action.current.random),
        [trimmedInput, action.current.mask0, action.current.mask1, action.current.limit, action.current.abbr, action.current.random],
    );
    const ipRange = useMemo(
        () => util.range(trimmedInput, action.current.mask0, action.current.mask1, action.current.abbr),
        [trimmedInput, action.current.mask0, action.current.mask1, action.current.abbr],
    );
    const ptr = useMemo(
        () => util.ptr(trimmedInput, action.current.maskPtr),
        [trimmedInput, action.current.maskPtr],
    );
    const mask1Lists = useMemo<SelectOption>(() => {
        const lists = range(action.current.mask0 + 1, 129);
        if (!lists.includes(action.current.mask1)) {
            lists.push(action.current.mask1);
        }
        return lists.map((item) => ({ value: item, label: `/${item}` }));
    }, [action.current.mask0, action.current.mask1]);

    return (
        <>
            <div className="ctool-inspector-utility-family ctool-inspector-family-page ctool-ipcalc-page ctool-ipcalc-v6-page">
                <div className="ctool-ipcalc-workspace">
                    <section className="ctool-inspector-family-panel ctool-inspector-family-source">
                        <header className="ctool-inspector-family-panel-header">
                            <strong>{$t("ipcalc_ip")}</strong>
                            <HelpTip link="https://www.npmjs.com/package/ip6" />
                        </header>
                        <div className="ctool-inspector-family-panel-body ctool-ipcalc-form">
                            <Align horizontal="center" className="ctool-page-option" direction="vertical">
                <Input
                    size="large"
                    width={400}
                    value={action.current.input}
                    onChange={(value) => { action.current.input = value; }}
                    label={$t("ipcalc_ip")}
                />
            </Align>
                        </div>
                    </section>
                    <div className="ctool-ipcalc-results">

            {error === "" && (
                <Align direction="vertical">
                    <Card title={$t("ipcalc_ip_info")} padding="0" extra={action.current.input}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            <Item title={$t("ipcalc_ip_info_full")} value={normalize} />
                            <Item title={$t("ipcalc_ip_info_short")} value={abbreviate} />
                        </div>
                    </Card>
                    <Card
                        title={$t("ipcalc_network_info")}
                        padding="0"
                        extra={(
                            <Align>
                                <Select options={mask0Lists} size="small" value={action.current.mask0} onChange={(value) => { action.current.mask0 = value; }} />
                                <Select options={mask1Lists} size="small" value={action.current.mask1} onChange={(value) => { action.current.mask1 = value; }} />
                                <Bool size="small" value={action.current.abbr} onChange={(value) => { action.current.abbr = value; }} label={$t("ipcalc_short")} border />
                                <Button type="primary" size="small" text={$t("ipcalc_subnet")} onClick={() => { setShowSubnet(true); }} />
                            </Align>
                        )}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <Item title={$t("ipcalc_network_info_size")} value={`${ipRange.size}`} />
                            <Item title={$t("ipcalc_network_info_first")} value={ipRange.start} />
                            <Item title={$t("ipcalc_network_info_last")} value={ipRange.end} />
                        </div>
                    </Card>
                    <Card
                        title={$t("ipcalc_ip_info_ptr")}
                        extra={<Select size="small" options={maskPtrLists} value={action.current.maskPtr} onChange={(value) => { action.current.maskPtr = value; }} />}
                    >
                        <Item value={ptr} />
                    </Card>
                </Align>
            )}
            {error !== "" && <HeightResize append={[".ctool-page-option"]}><Exception content={error} /></HeightResize>}
                    </div>
                </div>
            </div>

            <ExtendPage className="ctool-inspector-utility-extend ctool-ipcalc-subnet-page" value={showSubnet} onChange={setShowSubnet}>
                <Card
                    title={`${action.current.input} ${$t("ipcalc_subnet")}`}
                    padding="0"
                    extra={(
                        <Align>
                            <InputNumber size="small" width={120} value={action.current.limit} onChange={(value) => { action.current.limit = value; }} label={$t("ipcalc_limit")} />
                            <Bool size="small" value={action.current.abbr} onChange={(value) => { action.current.abbr = value; }} label={$t("ipcalc_short")} border />
                            <Bool size="small" value={action.current.random} onChange={(value) => { action.current.random = value; }} label={$t("ipcalc_random")} border />
                        </Align>
                    )}
                >
                    <HeightResize reduce={35}>
                        {({ height }) => (
                            <SerializeOutput
                                disabledBorder
                                value={action.current.subnetOption}
                                onChange={(value) => { action.current.subnetOption = value; }}
                                allow={["json", "xml", "yaml", "toml", "php_array", "properties", "text"]}
                                content={subnet}
                                height={height}
                            />
                        )}
                    </HeightResize>
                </Card>
            </ExtendPage>
        </>
    );
}
