import { useEffect, useMemo, useRef, useState } from "react";
import { range } from "lodash";
import { Button, Select, Textarea } from "@/components";
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
        <div className="ctool-bcrypt-page">
            <section className="ctool-bcrypt-toolbar" aria-label={$t("main_ui_setting")}>
                <div className="ctool-bcrypt-config">
                    <Select
                        value={action.current.rounds}
                        onChange={(value) => { action.current.rounds = value; }}
                        options={rounds}
                        className="select-box"
                    />
                    <Select
                        value={action.current.version}
                        onChange={(value) => { action.current.version = value; }}
                        options={versionOptions}
                        className="select-box"
                    />
                    <Button
                        loading={generateLoading}
                        disabled={generateLoading || action.current.input === ""}
                        onClick={generate}
                        type="primary"
                        text={$t("bcrypt_generate")}
                    />
                </div>
                <div className="ctool-bcrypt-check">
                    <Button
                        loading={checkLoading}
                        disabled={checkLoading || action.current.input === "" || action.current.hash === ""}
                        onClick={check}
                        text={checkButtonText}
                    />
                    <output
                        className={[
                            "ctool-bcrypt-status",
                            action.current.check_result === null
                                ? ""
                                : action.current.check_result
                                  ? "is-success"
                                  : "is-error",
                        ].filter(Boolean).join(" ")}
                        aria-live="polite"
                    >
                        {action.current.check_result === null
                            ? "—"
                            : action.current.check_result
                              ? $t("bcrypt_check_result_success")
                              : $t("bcrypt_check_result_error")}
                    </output>
                </div>
            </section>
            <div className="ctool-bcrypt-workspace">
                <section className="ctool-tester-panel" aria-labelledby="ctool-bcrypt-password-title">
                    <header className="ctool-tester-panel-header">
                        <strong id="ctool-bcrypt-password-title">{$t("bcrypt_password")}</strong>
                        {action.current.input !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.input)} />
                        )}
                    </header>
                    <div className="ctool-bcrypt-editor">
                        <Textarea
                            height="100%"
                            value={action.current.input}
                            onChange={(value) => { action.current.input = value; }}
                            placeholder={$t("bcrypt_password")}
                        />
                    </div>
                </section>
                <section className="ctool-tester-panel" aria-labelledby="ctool-bcrypt-hash-title">
                    <header className="ctool-tester-panel-header">
                        <strong id="ctool-bcrypt-hash-title">{$t("bcrypt_hash")}</strong>
                        {action.current.hash !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.hash)} />
                        )}
                    </header>
                    <div className="ctool-bcrypt-editor">
                        <Textarea
                            height="100%"
                            value={action.current.hash}
                            onChange={(value) => { action.current.hash = value; }}
                            placeholder={$t("bcrypt_hash")}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
