import { useCallback, useEffect, useRef, useState } from "react";
import {
    Button,
    HelpTip,
    Icon,
    Input,
    Textarea,
} from "@/components";
import { initialize, useAction } from "@/store/action";
import dayjs from "dayjs";

const initial = await initialize(
    {
        input: "wss://echo.websocket.events",
        keepScroll: true,
        protocols: "",
    },
    {
        paste: (str) => /^ws/.test(str),
    },
);

type WebsocketStatus = "close" | "open" | "connecting";
type LogType = "send" | "accept" | "other";

interface WebsocketLog {
    content: string;
    type: LogType;
    time: string;
}

export default function Websocket() {
    const action = useAction(initial);
    const [retry, setRetry] = useState(false);
    const [status, setStatus] = useState<WebsocketStatus>("close");
    const [sendContent, setSendContent] = useState("");
    const [logs, setLogs] = useState<WebsocketLog[]>([]);

    const websocketRef = useRef<WebSocket | null>(null);
    const logListRef = useRef<HTMLDivElement | null>(null);
    const retryRef = useRef(retry);
    const statusRef = useRef<WebsocketStatus>(status);
    const retryTimesRef = useRef(0);
    const reconnectingRef = useRef(false);
    const retryTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const connectRef = useRef<() => void>(() => undefined);
    const mountedRef = useRef(true);

    retryRef.current = retry;
    statusRef.current = status;

    const log = useCallback((content: string, type: LogType = "other") => {
        if (!mountedRef.current) {
            return;
        }
        setLogs((current) => [
            ...current,
            { content, type, time: dayjs().format("HH:mm:ss") },
        ]);
    }, []);

    useEffect(() => {
        if (action.current.keepScroll && logListRef.current) {
            logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
    }, [action.current.keepScroll, logs]);

    const resetRetry = useCallback(() => {
        retryTimesRef.current = 0;
        reconnectingRef.current = false;
        if (retryTimerRef.current !== undefined) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = undefined;
        }
    }, []);

    const connect = useCallback(() => {
        if (!action.current.input.trim() || statusRef.current !== "close") {
            return;
        }

        statusRef.current = "connecting";
        setStatus("connecting");
        action.save();
        log($t("websocket_connect_start", [action.current.input]));

        try {
            const websocket = new WebSocket(
                action.current.input,
                action.current.protocols !== ""
                    ? action.current.protocols.split(",")
                    : undefined,
            );

            websocket.addEventListener("open", () => {
                if (!mountedRef.current) {
                    return;
                }
                statusRef.current = "open";
                setStatus("open");
                resetRetry();
                log($t("websocket_connect_ok"));
            });

            websocket.addEventListener("close", () => {
                if (!mountedRef.current) {
                    return;
                }
                if (websocketRef.current === websocket) {
                    websocketRef.current = null;
                }
                statusRef.current = "close";
                setStatus("close");
                log($t("websocket_close_ok"));

                if (retryRef.current) {
                    if (reconnectingRef.current) {
                        return;
                    }
                    reconnectingRef.current = true;
                    retryTimerRef.current = setInterval(() => {
                        if (statusRef.current !== "close") {
                            return;
                        }
                        retryTimesRef.current += 1;
                        log(`${$t("websocket_reconnect")} ${retryTimesRef.current}`);
                        connectRef.current();
                    }, 3000);
                }
            });

            websocket.addEventListener("message", (event: MessageEvent<unknown>) => {
                if (!mountedRef.current) {
                    return;
                }
                log(
                    typeof event.data === "string"
                        ? event.data
                        : String(event.data),
                    "accept",
                );
            });

            websocket.addEventListener("error", () => {
                if (mountedRef.current) {
                    log("Websocket Error");
                }
            });

            websocketRef.current = websocket;
        } catch (error: unknown) {
            websocketRef.current = null;
            statusRef.current = "close";
            setStatus("close");
            log($error(error));
        }
    }, [action, log, resetRetry]);

    connectRef.current = connect;

    const close = useCallback(() => {
        setRetry(false);
        retryRef.current = false;
        resetRetry();
        log($t("websocket_close_start", [action.current.input]));
        websocketRef.current?.close();
    }, [action, log, resetRetry]);

    const send = useCallback(() => {
        if (statusRef.current !== "open") {
            throw new Error($t("websocket_error_connect"));
        }
        if (sendContent === "") {
            throw new Error($t("websocket_error_content"));
        }
        try {
            websocketRef.current?.send(sendContent);
            log(sendContent, "send");
        } catch (error: unknown) {
            log($error(error));
        }
    }, [log, sendContent]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            retryRef.current = false;
            if (retryTimerRef.current !== undefined) {
                clearInterval(retryTimerRef.current);
                retryTimerRef.current = undefined;
            }
            const websocket = websocketRef.current;
            websocketRef.current = null;
            websocket?.close();
        };
    }, []);

    return (
        <div className="ctool-websocket-page" data-status={status}>
            <section className="ctool-websocket-toolbar" aria-label={$t("websocket_connect")}>
                <div className="ctool-websocket-connection-status" role="status" aria-live="polite">
                    <span className={`ctool-websocket-status ctool-websocket-status-${status}`} aria-hidden="true" />
                    <span>
                        {status === "open"
                            ? $t("websocket_connect_ok")
                            : status === "connecting"
                              ? $t("websocket_connect_start", [action.current.input])
                              : $t("websocket_close")}
                    </span>
                </div>
                <Input
                    value={action.current.input}
                    aria-label="WebSocket URL"
                    onChange={(value: string) => {
                        action.current.input = value;
                    }}
                />
                <Input
                    value={action.current.protocols}
                    onChange={(value: string) => {
                        action.current.protocols = value;
                    }}
                    label={$t("websocket_protocols")}
                    suffix={<HelpTip text={$t("websocket_protocols_tip")} />}
                />
                <label className="ctool-tester-check">
                    <input type="checkbox" checked={retry} onChange={event => setRetry(event.target.checked)} />
                    <span>{$t("websocket_reconnect")}</span>
                </label>
                {status === "close" ? (
                    <Button type="primary" onClick={connect} text={$t("websocket_connect")} />
                ) : (
                    <Button
                        type="danger"
                        loading={status === "connecting"}
                        onClick={close}
                        text={$t("websocket_close")}
                    />
                )}
            </section>
            <div className="ctool-websocket-workspace">
                <section className="ctool-tester-panel ctool-websocket-composer" aria-labelledby="ctool-websocket-composer-title">
                    <header className="ctool-tester-panel-header">
                        <strong id="ctool-websocket-composer-title">{$t("websocket_send_content")}</strong>
                        <Button
                            type="primary"
                            text={$t("websocket_send")}
                            disabled={status !== "open" || sendContent === ""}
                            onClick={send}
                        />
                    </header>
                    <div className="ctool-websocket-composer-body">
                        <Textarea
                            height="100%"
                            value={sendContent}
                            onChange={setSendContent}
                            placeholder={`${$t("main_ui_input")}${$t("websocket_send_content")}`}
                        />
                    </div>
                </section>
                <section className="ctool-tester-panel ctool-websocket-logs" aria-labelledby="ctool-websocket-log-title">
                    <header className="ctool-tester-panel-header">
                        <strong id="ctool-websocket-log-title">{$t("websocket_log_content")}</strong>
                        <div className="ctool-websocket-log-actions">
                            <Button
                                size="small"
                                text={$t("main_ui_copy")}
                                disabled={logs.length === 0}
                                onClick={() => $copy(JSON.stringify(logs))}
                            />
                            <Button
                                size="small"
                                type="danger"
                                text={$t("main_ui_clear")}
                                disabled={logs.length === 0}
                                onClick={() => setLogs([])}
                            />
                            <label className="ctool-tester-check">
                                <input
                                    type="checkbox"
                                    checked={action.current.keepScroll}
                                    onChange={(event) => {
                                        action.current.keepScroll = event.target.checked;
                                        action.save();
                                    }}
                                />
                                <span>{$t("websocket_keep_scroll")}</span>
                            </label>
                        </div>
                    </header>
                    <div
                        className="ctool-websocket-log-list"
                        ref={logListRef}
                        role="log"
                        aria-live="polite"
                    >
                        {logs.length < 1 ? (
                            <p className="ctool-tester-empty">
                                {status === "open" ? $t("websocket_send_content") : $t("websocket_connect")}
                            </p>
                        ) : (
                            logs.map((item, index) => (
                                <article
                                    key={`${item.time}-${item.type}-${index}`}
                                    className={`ctool-websocket-log-item is-${item.type}`}
                                >
                                    <header className="ctool-websocket-log-meta">
                                        <strong>
                                            {item.type === "send"
                                                ? $t("websocket_client")
                                                : item.type === "accept"
                                                  ? $t("websocket_server")
                                                  : $t("websocket_tips")}
                                        </strong>
                                        <time>{item.time}</time>
                                        <Icon
                                            size={12}
                                            name="copy"
                                            tooltip={$t("main_ui_copy")}
                                            hover
                                            onClick={() => $copy(item.content)}
                                        />
                                    </header>
                                    <pre><code>{item.content}</code></pre>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
