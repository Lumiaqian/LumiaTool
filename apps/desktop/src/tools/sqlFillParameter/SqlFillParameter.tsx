import { useEffect, useMemo } from "react";
import { Align, HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";

const TYPE_STR = ["String", "Integer", "Long", "Timestamp"];
const initial = await initialize({ input: "", params: "" });

type SqlParameter = { value: string; type: string | null };

function convertParam(params: string): SqlParameter[] {
    if (!params) return [];
    const tempList = params.split(",", -1);
    const paramStrList: string[] = [];
    let paramIndex = 0;
    let combining = false;
    tempList.forEach(x => {
        if (x.endsWith("null")) {
            paramStrList.push(x);
            paramIndex++;
        } else if (x.endsWith(")")) {
            if (combining) {
                paramStrList[paramIndex] += `,${x}`;
                combining = false;
            } else {
                paramStrList.push(x);
            }
            paramIndex++;
        } else {
            const tempStr = paramStrList[paramIndex];
            if (!tempStr) {
                paramStrList.push(x);
                combining = true;
            } else {
                paramStrList[paramIndex] += `,${x}`;
            }
        }
    });
    return paramStrList.map(x => {
        const valueEndIndex = x.lastIndexOf("(");
        if (valueEndIndex < 0) return { value: x, type: null };
        let value = x.substring(0, valueEndIndex).trim();
        value = value.replaceAll("'", "\\'");
        let typeEndIndex = x.lastIndexOf(")");
        if (typeEndIndex < 0) typeEndIndex = x.length;
        return {
            value,
            type: x.substring(valueEndIndex + 1, typeEndIndex).trim(),
        };
    });
}

function splitSqlAndParams(input: string) {
    const result = { sql: "", params: "" };
    const sqlStartStr = "Preparing:";
    let sqlStartIndex = input.indexOf(sqlStartStr);
    sqlStartIndex = sqlStartIndex < 0 ? 0 : sqlStartIndex + sqlStartStr.length;
    let sqlEndIndex = input.indexOf("\n", sqlStartIndex);
    if (sqlEndIndex < 0) sqlEndIndex = input.length;
    result.sql = input.substring(sqlStartIndex, sqlEndIndex);

    const paramStartStr = "Parameters:";
    const paramStartIndex = input.indexOf(paramStartStr);
    if (paramStartIndex >= 0) {
        let paramEndIndex = input.indexOf("\n", paramStartIndex);
        if (paramEndIndex < 0) paramEndIndex = input.length;
        result.params = input.substring(paramStartIndex + paramStartStr.length, paramEndIndex);
    }
    return result;
}

export default function SqlFillParameter() {
    const action = useAction(initial);
    const input = action.current.input;
    const params = action.current.params;

    const output = useMemo(() => {
        try {
            if (!input || !params) return "";
            const paramList = convertParam(params);
            let resultStr = "";
            let paramIndex = 0;
            for (let i = 0; i < input.length; i++) {
                const character = input.charAt(i);
                if (character !== "?") {
                    resultStr += character;
                    continue;
                }
                if (paramList.length <= paramIndex) {
                    throw new Error($t("sqlFillParameter_parameter_too_little"));
                }
                const param = paramList[paramIndex];
                let replacement: string;
                switch (param.type) {
                    case TYPE_STR[0]:
                        replacement = ` '${param.value}'`;
                        break;
                    case TYPE_STR[1]:
                    case TYPE_STR[2]:
                        replacement = param.value;
                        break;
                    case TYPE_STR[3]:
                        replacement = `Timestamp '${param.value}'`;
                        break;
                    default:
                        replacement = param.value;
                }
                resultStr += replacement;
                paramIndex++;
            }
            action.save();
            return resultStr;
        } catch (error) {
            return $error(error);
        }
    }, [action, input, params]);

    useEffect(() => {
        if (input === "" || !input.includes("Preparing:") || !input.includes("Parameters:")) return;
        const result = splitSqlAndParams(input);
        if (result.sql === "" || result.params === "") return;
        const timer = window.setTimeout(() => {
            action.current.input = result.sql;
            action.current.params = result.params;
        });
        return () => window.clearTimeout(timer);
    }, [action, input, params]);

    return (
        <div className="ctool-generator-editor-family ctool-editor-page ctool-sql-parameter-page">
        <HeightResize ignore reduce={5}>
            {({ height }: { height: number }) => (
                <Align direction="vertical">
                    <div className="ctool-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <Textarea value={action.current.input} onChange={(value: string) => { action.current.input = value; }} height={height / 2} placeholder="Sql:SELECT * FROM T WHERE id=? AND name = ?" copy="Sql" />
                        <Textarea value={action.current.params} onChange={(value: string) => { action.current.params = value; }} height={height / 2} placeholder={`${$t("sqlFillParameter_parameter")}:1(Integer),zhangshan(String)`} copy={$t("sqlFillParameter_parameter")} />
                    </div>
                    <Textarea value={output} copy height={height / 2} placeholder={`${$t("main_ui_output")}:SELECT * FROM T WHERE id=1 AND name='zhangshan'`} />
                </Align>
            )}
        </HeightResize>
        </div>
    );
}
