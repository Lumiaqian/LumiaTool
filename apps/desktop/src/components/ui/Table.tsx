import type {
    ComponentPropsWithoutRef,
    CSSProperties,
    ReactNode,
} from "react";
import type { TableConfig, TableLists } from "@/types";
import { sizeConvert } from "@/components/util";
import Align from "../Align";

const EMPTY_COLUMNS: TableConfig = [];
const EMPTY_LISTS: TableLists = [];

type TableRow = TableLists[number];

export interface TableSlotContext<T extends TableRow = TableRow> {
    row: T;
    index: number;
}

type ScopedTableContent<T extends TableRow = TableRow> =
    | ReactNode
    | ((context: TableSlotContext<T>) => ReactNode);

type TableStyle = CSSProperties & {
    "--lumia-table-border-width"?: string;
};

export interface TableProps<T extends TableRow = TableRow>
    extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
    columns?: TableConfig;
    lists?: T[];
    height?: string | number;
    actionWidth?: string | number;
    border?: boolean;
    column?: ScopedTableContent<T>;
    children?: ScopedTableContent<T>;
}

function renderScopedContent<T extends TableRow>(
    content: ScopedTableContent<T>,
    context: TableSlotContext<T>,
): ReactNode {
    return typeof content === "function" ? content(context) : content;
}

function getCellValue(row: TableRow, key: unknown): unknown {
    if (typeof row !== "object" || row === null) {
        return undefined;
    }

    return (row as Record<string, unknown>)[String(key)];
}

function toDisplayValue(value: unknown): ReactNode {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string" || typeof value === "number") {
        return value;
    }
    if (
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "symbol" ||
        typeof value === "function"
    ) {
        return String(value);
    }

    try {
        const serialized = JSON.stringify(value, null, 2);
        return serialized === undefined ? String(value) : serialized;
    } catch {
        return String(value);
    }
}

function toHtml(value: unknown): string {
    return value === null || value === undefined ? "" : String(value);
}

function Table<T extends TableRow = TableRow>({
    columns = EMPTY_COLUMNS,
    lists = EMPTY_LISTS as T[],
    height: _height = "",
    actionWidth = "",
    border = false,
    column,
    children,
    className,
    style: externalStyle,
    ...restProps
}: TableProps<T>) {
    const tableStyle: TableStyle = {
        ...(border ? { "--lumia-table-border-width": "1px" } : {}),
        ...externalStyle,
    };
    const hasColumnSlot = column !== undefined;
    const hasActionSlot = children !== undefined;

    return (
        <div
            {...restProps}
            className={className ? `lumia-table ${className}` : "lumia-table"}
            style={tableStyle}
        >
            <table role="grid">
                <thead>
                    <tr>
                        {columns.map((tableColumn, index) => (
                            <th
                                key={`${String(tableColumn.key)}:${index}`}
                                style={
                                    tableColumn.width
                                        ? { width: sizeConvert(tableColumn.width) }
                                        : undefined
                                }
                            >
                                {toDisplayValue(tableColumn.title)}
                            </th>
                        ))}
                        {hasActionSlot && (
                            <th
                                style={
                                    actionWidth
                                        ? { width: sizeConvert(actionWidth) }
                                        : undefined
                                }
                            >
                                <Align horizontal="center">
                                    {$t("main_ui_op")}
                                </Align>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {lists.map((row, rowIndex) => {
                        const context: TableSlotContext<T> = {
                            row,
                            index: rowIndex,
                        };

                        return (
                            <tr key={rowIndex}>
                                {hasColumnSlot
                                    ? renderScopedContent(column, context)
                                    : columns.map((tableColumn, columnIndex) => {
                                          const cellValue = getCellValue(
                                              row,
                                              tableColumn.key,
                                          );

                                          return tableColumn.html ? (
                                              <td
                                                  key={`${String(tableColumn.key)}:${columnIndex}`}
                                                  dangerouslySetInnerHTML={{
                                                      __html: toHtml(cellValue),
                                                  }}
                                              />
                                          ) : (
                                              <td
                                                  key={`${String(tableColumn.key)}:${columnIndex}`}
                                              >
                                                  {toDisplayValue(cellValue)}
                                              </td>
                                          );
                                      })}
                                {hasActionSlot && (
                                    <td>
                                        <Align horizontal="center">
                                            {renderScopedContent(children, context)}
                                        </Align>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
