import { useMemo } from "react";
import { HeightResize, Table } from "@/components";
import { getReference } from "./util";

export default function Reference() {
    const columns = useMemo(
        () => [
            {
                title: $t("regex_reference_name"),
                key: "name",
                width: 150,
            },
            {
                title: $t("regex_reference_text"),
                key: "text",
                html: true,
            },
        ],
        [],
    );

    return (
        <HeightResize>
            {({ height }) => <Table columns={columns} lists={getReference()} height={height} />}
        </HeightResize>
    );
}
