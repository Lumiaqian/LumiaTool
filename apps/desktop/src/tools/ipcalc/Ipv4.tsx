import { useEffect, useMemo, useState } from "react";
import {
    Align,
    Button,
    Card,
    Exception,
    ExtendPage,
    HeightResize,
    HelpTip,
    Icon,
    Input,
    InputNumber,
    Modal,
    SerializeOutput,
} from "@/components";
import { createSerializeOutput } from "@/components/serialize";
import Serialize from "@/lib/serialize";
import { initialize, useAction } from "@/store/action";
import Item from "./Item";
import ipcalc, { getMaskBitByAvailable } from "./utilV4";

const initial = await initialize({
    input: "192.168.0.1",
    mask: "24",
    subnetOption: createSerializeOutput("text"),
}, {
    paste: (input) => /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(input),
});

export default function Ipv4() {
    const action = useAction(initial);
    const [help, setHelp] = useState(false);
    const [maskSetShow, setMaskSetShow] = useState(false);
    const [maskAvailable, setMaskAvailable] = useState(254);
    const [error, setError] = useState("");
    const [calc, setCalc] = useState(() => new ipcalc());
    const [showSubnet, setShowSubnet] = useState(false);

    useEffect(() => {
        setError("");
        try {
            const next = new ipcalc(action.current.input, action.current.mask);
            setCalc(next);
            action.save();
        } catch (caught: unknown) {
            setError($error(caught));
        }
    }, [action.current.input, action.current.mask]);

    const subnet = useMemo(() => {
        const lists: string[] = [];
        calc.netmask.forEach((ip) => {
            lists.push(ip);
        });
        return Serialize.formObject(lists);
    }, [calc]);

    const maskSet = (): void => {
        action.current.mask = `${getMaskBitByAvailable(maskAvailable)}`;
        setMaskSetShow(false);
    };

    const ipInfo = calc.ipInfo();
    const maskInfo = calc.maskInfo();

    return (
        <>
            <div className="ctool-inspector-utility-family ctool-inspector-family-page ctool-ipcalc-page ctool-ipcalc-v4-page">
                <div className="ctool-ipcalc-workspace">
                    <section className="ctool-inspector-family-panel ctool-inspector-family-source">
                        <header className="ctool-inspector-family-panel-header">
                            <strong>{$t("ipcalc_ip")}</strong>
                            <HelpTip link="https://www.npmjs.com/package/netmask" />
                        </header>
                        <div className="ctool-inspector-family-panel-body ctool-ipcalc-form">
                            <Align horizontal="center" className="ctool-page-option" direction="vertical">
                <Input
                    size="large"
                    width={300}
                    value={action.current.input}
                    onChange={(value) => { action.current.input = value; }}
                    label={$t("ipcalc_ip")}
                    suffix={<HelpTip onClick={() => { setHelp(true); }} icon="info" text={$t("ipcalc_format")} />}
                />
                <Input
                    size="large"
                    width={280}
                    value={action.current.mask}
                    onChange={(value) => { action.current.mask = value; }}
                    label={$t("ipcalc_mask")}
                    append={(
                        <Button onClick={() => { setMaskSetShow(true); }}>
                            <Icon hover name="setting" tooltip={$t("ipcalc_mask_set_title")} />
                        </Button>
                    )}
                    suffix={<HelpTip onClick={() => { setHelp(true); }} icon="info" text={$t("ipcalc_format")} />}
                />
            </Align>
                        </div>
                    </section>
                    <div className="ctool-ipcalc-results">

            {error === "" && (
                <Align direction="vertical">
                    <Card title={$t("ipcalc_ip_info")} padding="0" extra={action.current.input}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <Item title={$t("ipcalc_ip_info_ip10")} value={ipInfo.ip} />
                            <Item title={$t("ipcalc_ip_info_long")} value={ipInfo.long} />
                            <Item title={$t("ipcalc_ip_info_ip8")} value={ipInfo.ip8} />
                            <Item title={$t("ipcalc_ip_info_ip16")} value={ipInfo.ip16} />
                            <div style={{ gridColumnStart: 2, gridColumnEnd: 4 }}><Item title={$t("ipcalc_ip_info_ip2")} value={ipInfo.ip2} /></div>
                        </div>
                    </Card>
                    <Card title={$t("ipcalc_mask_info")} padding="0" extra={action.current.mask}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                            <Item title={$t("ipcalc_mask")} value={maskInfo.bit} />
                            <Item title={$t("ipcalc_mask_info_mask")} value={maskInfo.mask} />
                            <Item title={$t("ipcalc_mask_info_long")} value={maskInfo.long} />
                            <Item title={$t("ipcalc_mask_info_opposite")} value={maskInfo.opposite} />
                            <Item title={$t("ipcalc_mask_info_mask8")} value={maskInfo.mask8} />
                            <Item title={$t("ipcalc_mask_info_mask16")} value={maskInfo.mask16} />
                            <div style={{ gridColumnStart: 3, gridColumnEnd: 5 }}><Item title={$t("ipcalc_mask_info_mask2")} value={maskInfo.mask2} /></div>
                        </div>
                    </Card>
                    <Card
                        title={$t("ipcalc_network_info")}
                        padding="0"
                        extra={<Button type="primary" size="small" text={$t("ipcalc_subnet")} onClick={() => { setShowSubnet(true); }} />}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <Item title={$t("ipcalc_network_info_available")} value={calc.available()} />
                            <Item title={$t("ipcalc_network_info_size")} value={calc.size()} />
                            <Item title={$t("ipcalc_network_info_base")} value={calc.base()} />
                            <Item title={$t("ipcalc_network_info_first")} value={calc.first()} />
                            <Item title={$t("ipcalc_network_info_last")} value={calc.last()} />
                            <Item title={$t("ipcalc_network_info_broadcast")} value={calc.broadcast()} />
                        </div>
                    </Card>
                </Align>
            )}
            {error !== "" && <HeightResize append={[".ctool-page-option"]}><Exception content={error} /></HeightResize>}
                    </div>
                </div>
            </div>

            <Modal title={$t("ipcalc_format")} value={help} onChange={setHelp} width="98%" footerType="normal">
                <Align direction="vertical">
                    <Card title={$t("ipcalc_ip")} padding="0">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <Item title={$t("ipcalc_ip_info_ip10")} value="192.168.0.1" />
                            <Item title={$t("ipcalc_ip_info_long")} value="3232235521" />
                            <Item title={$t("ipcalc_ip_info_ip8")} value="0300.0250.0000.0001" />
                            <Item title={$t("ipcalc_ip_info_ip16")} value="0xC0.0xA8.0x00.0x01" />
                            <div style={{ gridColumnStart: 2, gridColumnEnd: 4 }}><Item title={$t("ipcalc_ip_info_ip2")} value="0b11000000.0b10101000.0b00000000.0b00000001" /></div>
                        </div>
                    </Card>
                    <Card title={$t("ipcalc_mask")} padding="0">
                        <div style={{ display: "grid", gridTemplateColumns: "8fr 8fr 10fr 10fr" }}>
                            <Item title={$t("ipcalc_mask")} value="24" />
                            <Item title={$t("ipcalc_mask_info_long")} value="4294967040" />
                            <Item title={$t("ipcalc_mask_info_mask16")} value="0xFF.0xFF.0xFF.0x00" />
                            <Item title={$t("ipcalc_mask_info_mask8")} value="0377.0377.0377.0000" />
                            <Item title={$t("ipcalc_mask_info_mask")} value="255.255.255.0" />
                            <div style={{ gridColumnStart: 2, gridColumnEnd: 5 }}><Item title={$t("ipcalc_mask_info_mask2")} value="0b11111111.0b11111111.0b11111111.0b00000000" /></div>
                        </div>
                    </Card>
                </Align>
            </Modal>

            <ExtendPage className="ctool-inspector-utility-extend ctool-ipcalc-subnet-page" value={showSubnet} onChange={setShowSubnet}>
                <Card
                    title={`${action.current.input} ${$t("ipcalc_subnet")}`}
                    padding="0"
                    extra={(
                        <Align>
                            <Input
                                size="small"
                                width={200}
                                value={action.current.mask}
                                onChange={(value) => { action.current.mask = value; }}
                                label={$t("ipcalc_mask")}
                                append={(
                                    <Button onClick={() => { setMaskSetShow(true); }}>
                                        <Icon hover name="setting" tooltip={$t("ipcalc_mask_set_title")} />
                                    </Button>
                                )}
                                suffix={<HelpTip onClick={() => { setHelp(true); }} icon="info" text={$t("ipcalc_format")} />}
                            />
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

            <Modal
                title={$t("ipcalc_mask_set_title")}
                value={maskSetShow}
                onChange={setMaskSetShow}
                footerType="long"
                onOk={maskSet}
            >
                <InputNumber size="large" value={maskAvailable} onChange={setMaskAvailable} label={$t("ipcalc_network_info_available")} />
            </Modal>
        </>
    );
}
