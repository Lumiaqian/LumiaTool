import { useMemo } from "react";
import { Align, Bool, Display, HeightResize, SerializeOutput, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { jwtDecode } from "jwt-decode";
import Serialize from "@/lib/serialize";
import { createSerializeOutput as serializeGetOutput } from "@/components/serialize";

const initial = await initialize({
    input: "",
    header: false,
    payload: true,
    outputOption: serializeGetOutput("json"),
}, { paste: false });

export default function Jwt(): React.ReactElement {
    const action = useAction(initial);

    const outputSerialize = useMemo((): Serialize => {
        if (!action.current.input.trim()) return Serialize.empty();
        try {
            const data: Record<string, unknown> = {};
            if (action.current.header) data.header = jwtDecode(action.current.input, { header: true });
            if (action.current.payload) data.payload = jwtDecode(action.current.input);
            return Serialize.formObject(data);
        } catch (error) {
            return Serialize.fromError($error(error));
        }
    }, [action.current.input, action.current.header, action.current.payload]);

    return (
        <HeightResize reduce={5}>
            {({ small, large }: { small: number; large: number }) => (
                <Align direction="vertical">
                    <Display
                        extra={(
                            <Align>
                                <Bool border size="small" value={action.current.header} onChange={(value) => { action.current.header = value; }} label="header" />
                                <Bool border size="small" value={action.current.payload} onChange={(value) => { action.current.payload = value; }} label="payload" />
                            </Align>
                        )}
                    >
                        <Textarea value={action.current.input} onChange={(value) => { action.current.input = value; }} height={small} placeholder={$t("main_ui_input")} />
                    </Display>
                    <SerializeOutput
                        allow={["json", "xml", "yaml", "toml", "php_array", "properties", "http_query_string"]}
                        content={outputSerialize}
                        height={large}
                        value={action.current.outputOption}
                        onChange={(value) => { action.current.outputOption = value; }}
                        onSuccess={() => action.save()}
                    />
                </Align>
            )}
        </HeightResize>
    );
}
