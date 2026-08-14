import { useEffect, useMemo, useRef, useState } from "react";
import { range } from "lodash";
import { Button, HeightResize, Select, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";

type InitializeType = {
    input: string;
    rounds: number;
    hash: string;
    check_result: null | boolean;
    version: string;
};

type WorkerError = { message: string } | null;
type HashMessage = { method: "hash"; data: { err: WorkerError; hash: string } };
type CompareMessage = { method: "compare"; data: { err: WorkerError; res: boolean } };
type WorkerMessage = HashMessage | CompareMessage;

const initial = await initialize<InitializeType>({
    input: "",
    rounds: 10,
    hash: "",
    check_result: null,
    version: "2a",
}, { paste: false });

const versionOptions = [
    { label: "2a", value: "2a" },
    { label: "2b", value: "2b" },
    { label: "2y", value: "2y" },
];

export default function Bcrypt() {
    const action = useAction(initial);
    const workerRef = useRef<Worker | null>(null);
    const firstWatch = useRef(true);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const rounds = useMemo(() => range(4, 33).map((round) => ({ label: `${$t("bcrypt_rounds")} ${round}`, value: round })), []);

    useEffect(() => {
        const worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
        workerRef.current = worker;
        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
            const message = event.data;
            console.log("main accept", message);
            if (message.method === "hash") {
                setGenerateLoading(false);
                if (message.data.err) throw new Error(message.data.err.message);
                action.current.hash = message.data.hash;
                action.current.check_result = null;
                action.success({ copy_text: action.current.hash });
            } else {
                setCheckLoading(false);
                action.current.check_result = message.data.res;
                const result = message.data.res ? $t("bcrypt_check_result_success") : $t("bcrypt_check_result_error");
                action.success({
                    message: `${$t("bcrypt_check")} ${result}`,
                    message_type: message.data.res ? "success" : "error",
                });
            }
        };
        return () => {
            workerRef.current = null;
            worker.terminate();
        };
    }, []);

    useEffect(() => {
        if (firstWatch.current) {
            firstWatch.current = false;
            return;
        }
        action.current.check_result = null;
    }, [action.current.input, action.current.hash]);

    const workerPost = (method: "hash" | "compare", data: Record<string, string | number>) => {
        const message = { method, data };
        console.log("main send", message);
        workerRef.current?.postMessage(message);
    };

    const generate = () => {
        if (action.current.input === "") return;
        if (action.current.rounds < 4 || action.current.rounds > 30) throw new Error($t("bcrypt_rounds_range", [4, 30]));
        setGenerateLoading(true);
        workerPost("hash", { input: action.current.input, rounds: action.current.rounds, version: action.current.version });
    };

    const check = () => {
        if (action.current.input === "" || action.current.hash === "") return;
        setCheckLoading(true);
        workerPost("compare", { input: action.current.input, hash: action.current.hash });
    };

    const checkButtonText = action.current.check_result === null
        ? $t("bcrypt_check")
        : `${$t("bcrypt_check")} (${action.current.check_result ? $t("bcrypt_check_result_success") : $t("bcrypt_check_result_error")})`;

    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 5px 1fr", columnGap: 10, marginBottom: 5 }} className="ctool-page-option">
                <div style={{ display: "grid", gridTemplateColumns: "120px 120px 1fr", columnGap: 5 }}>
                    <Select value={action.current.rounds} onChange={(value) => { action.current.rounds = value; }} options={rounds} className="select-box" />
                    <Select value={action.current.version} onChange={(value) => { action.current.version = value; }} options={versionOptions} className="select-box" />
                    <Button loading={generateLoading} onClick={generate} type="primary" long text={$t("bcrypt_generate")} />
                </div>
                <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>|</span>
                <Button loading={checkLoading} onClick={check} type="primary" long text={checkButtonText} />
            </div>
            <HeightResize append={[".ctool-page-option"]}>
                {({ height }) => (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 5 }}>
                        <Textarea height={height} value={action.current.input} onChange={(value) => { action.current.input = value; }} floatText={$t("bcrypt_password")} placeholder={$t("bcrypt_password")} onClickFloatText={() => $copy(action.current.input)} />
                        <Textarea height={height} value={action.current.hash} onChange={(value) => { action.current.hash = value; }} floatText={$t("bcrypt_hash")} placeholder={$t("bcrypt_hash")} onClickFloatText={() => $copy(action.current.hash)} />
                    </div>
                )}
            </HeightResize>
        </>
    );
}
