import { useMemo } from "react";
import { HeightResize, Table } from "@/components";
import { asciiHidden, asciiMap, convent } from "./util";

type RowType = {
    dec: string;
    hex: string;
    oct: string;
    bin: string;
    str: string;
    is_visible: string;
    explain: string;
};

export default function Reference() {
    const lists = useMemo<RowType[]>(() => Object.keys(asciiMap).map((key) => {
        const character = asciiMap[key];
        const isVisible = !(character in asciiHidden);
        return {
            dec: key,
            hex: convent(key, "dec", "hex"),
            oct: convent(key, "dec", "oct"),
            bin: convent(key, "dec", "bin"),
            str: character,
            is_visible: isVisible ? $t("ascii_yes") : $t("ascii_no"),
            explain: isVisible ? "" : asciiHidden[character],
        };
    }), []);

    const columns = useMemo(() => [
        { title: $t("ascii_input_dec"), key: "dec", width: 70 },
        { title: $t("ascii_input_hex"), key: "hex", width: 90 },
        { title: $t("ascii_input_oct"), key: "oct", width: 70 },
        { title: $t("ascii_input_bin"), key: "bin", width: 95 },
        { title: $t("ascii_input_str"), key: "str", width: 70 },
        { title: $t("ascii_is_visible"), key: "is_visible", width: 90 },
        { title: $t("ascii_description"), key: "explain" },
    ], []);

    return <div className="lumia-inspector-utility-family lumia-ascii-reference"><HeightResize>{({ height }) => <Table columns={columns} lists={lists} height={height} />}</HeightResize></div>;
}
