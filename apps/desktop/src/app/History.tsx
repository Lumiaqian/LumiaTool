import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { isNumber, isPlainObject, isString } from "lodash";
import { Align, Button, Card, Exception, Modal, Table, Textarea } from "@/components";
import event from "@/event";
import getHistoryInstance from "@/lib/history";
import { instanceOfInput } from "@/lib/util";
import useOperate from "@/store/operate";

type HistoryRow = {
    t: string;
    v: unknown;
};

type HistoryTableProps = {
    columns: Array<{ title: string; key: string; width?: number }>;
    actionWidth: string | number;
    lists: HistoryRow[];
    column: (scope: { row: HistoryRow }) => ReactNode;
    children: (scope: { row: HistoryRow; index: number }) => ReactNode;
};

const HistoryTable = Table as unknown as ComponentType<HistoryTableProps>;

const tableDataHandle = (item: unknown): string => {
    if (
        item !== null
        && typeof item === "object"
        && isPlainObject(item)
        && "input" in item
        && (JSON.stringify(item).length > 150 || Object.keys(item).length === 1)
    ) {
        const input = item.input;
        if (instanceOfInput(input)) {
            return input.value;
        }
        if (isString(input) || isNumber(input)) {
            return `${input}`;
        }
        return JSON.stringify(input);
    }
    return JSON.stringify(item);
};

export default function History({ onClose }: { onClose?: () => void }) {
    const storeOperate = useOperate();
    const history = getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature);
    const lists = history.all() as HistoryRow[];
    const length = history.length();
    const [viewData, setViewData] = useState<{ show: boolean; data: unknown }>({ show: false, data: {} });

    const clear = () => {
        getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).clear();
        event.dispatch("extend_page_close");
    };

    const load = (index = 0) => {
        storeOperate.redirectTool(
            storeOperate.items.tool,
            storeOperate.items.feature,
            storeOperate.items.category,
            index,
        );
        onClose?.();
    };

    return (
        <>
            <Card
                title={`${$t("main_history")} · ${$t(`tool_${storeOperate.items.tool}`)}`}
                height="100%"
                padding="0"
                extra={(
                    <Align>
                        {length > 0 ? (
                            <Button size="small" type="danger" onClick={clear}>
                                {$t("main_history_clear")}
                            </Button>
                        ) : null}
                        <Button size="small" onClick={() => onClose?.()}>
                            {$t("main_ui_close")}
                        </Button>
                    </Align>
                )}
            >
                {length > 0 ? (
                    <HistoryTable
                        columns={[
                            { title: $t("main_history_time"), key: "t", width: 180 },
                            { title: $t("main_history_data"), key: "v" },
                        ]}
                        actionWidth="130"
                        lists={lists}
                        column={({ row }) => (
                            <>
                                <td>{row.t}</td>
                                <td>
                                    <Textarea value={tableDataHandle(row.v)} height="80" />
                                </td>
                            </>
                        )}
                    >
                        {({ row, index }) => (
                            <Align>
                                <Button size="small" onClick={() => setViewData({ show: true, data: row.v })}>
                                    {$t("main_ui_views")}
                                </Button>
                                <Button size="small" type="primary" onClick={() => load(index)}>
                                    {$t("main_ui_load")}
                                </Button>
                            </Align>
                        )}
                    </HistoryTable>
                ) : (
                    <Align horizontal="center" vertical="center">
                        <Exception />
                    </Align>
                )}
            </Card>
            <Modal value={viewData.show} onChange={(show: boolean) => setViewData((value) => ({ ...value, show }))} width="70%">
                <Textarea value={JSON.stringify(viewData.data, null, "\t")} height="300" />
            </Modal>
        </>
    );
}
