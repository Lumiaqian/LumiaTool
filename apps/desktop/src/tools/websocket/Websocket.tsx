import { useCallback, useEffect, useRef, useState } from "react";
import {
    Align,
    Bool,
    Button,
    Card,
    Exception,
    HeightResize,
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
        if (!action.current.keepScroll) {
            return;
        }
        const container = document.querySelector<HTMLElement>(
            ".ctool-websocket-logs .ctool-card-body",
        );
        if (container) {
            container.scrollTop = container.scrollHeight;
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
        <Align direction="vertical">
            <div
                className="ctool-page-option"
                style={{ display: "grid", gridTemplateColumns: "16fr 8fr auto" }}
            >
                <Input
                    value={action.current.input}
                    onChange={(value: string) => {
                        action.current.input = value;
                    }}
                    prepend={
                        <Align horizontal="center" vertical="center" width={20}>
                            <div
                                className={`ctool-websocket-status ctool-websocket-status-${status}`}
                            />
                        </Align>
                    }
                    suffix={
                        <Bool
                            size="small"
                            value={retry}
                            label={$t("websocket_reconnect")}
                            onChange={setRetry}
                        />
                    }
                />
                <Input
                    value={action.current.protocols}
                    onChange={(value: string) => {
                        action.current.protocols = value;
                    }}
                    label={$t("websocket_protocols")}
                    suffix={<HelpTip text={$t("websocket_protocols_tip")} />}
                />
                {status === "close" ? (
                    <Button onClick={connect} text={$t("websocket_connect")} />
                ) : (
                    <Button onClick={close} text={$t("websocket_close")} />
                )}
            </div>
            <HeightResize
                ignore
                reduce={5}
                append={[".ctool-page-option"]}
                style={{ display: "grid", gridTemplateColumns: "40fr 60fr" }}
            >
                {({ height }) => (
                    <>
                        <Textarea
                            height={height}
                            value={sendContent}
                            onChange={setSendContent}
                            floatText={$t("websocket_send")}
                            floatPosition="top-right"
                            onClickFloatText={send}
                            placeholder={`${$t("main_ui_input")}${$t("websocket_send_content")}`}
                        />
                        <Card
                            title={$t("websocket_log_content")}
                            height={height}
                            className="ctool-websocket-logs"
                            extra={
                                <Align>
                                    <Button
                                        size="small"
                                        type="primary"
                                        text={$t("main_ui_copy")}
                                        onClick={() => $copy(JSON.stringify(logs))}
                                    />
                                    <Button
                                        size="small"
                                        type="danger"
                                        text={$t("main_ui_clear")}
                                        onClick={() => setLogs([])}
                                    />
                                    <Bool
                                        size="small"
                                        value={action.current.keepScroll}
                                        border
                                        label={$t("websocket_keep_scroll")}
                                        onChange={(value: boolean) => {
                                            action.current.keepScroll = value;
                                            action.save();
                                        }}
                                    />
                                </Align>
                            }
                        >
                            {logs.length < 1 ? (
                                <Align horizontal="center" vertical="center">
                                    <Exception />
                                </Align>
                            ) : (
                                <Align direction="vertical">
                                    {logs.map((item, index) => (
                                        <div
                                            key={`${item.time}-${item.type}-${index}`}
                                            className="ctool-websocket-logs-item"
                                        >
                                            <div className="ctool-websocket-logs-top">
                                                <div
                                                    className={`ctool-websocket-logs-type ctool-websocket-logs-type-${item.type}`}
                                                >
                                                    {item.type === "send"
                                                        ? `${$t("websocket_client")}：`
                                                        : item.type === "accept"
                                                          ? `${$t("websocket_server")}：`
                                                          : `${$t("websocket_tips")}：`}
                                                </div>
                                                <div className="ctool-websocket-logs-time">
                                                    {item.time}
                                                </div>
                                                <Icon
                                                    size={12}
                                                    name="copy"
                                                    tooltip={$t("main_ui_copy")}
                                                    hover
                                                    onClick={() => $copy(item.content)}
                                                />
                                            </div>
                                            <pre className="ctool-websocket-logs-content">
                                                <code>{item.content}</code>
                                            </pre>
                                        </div>
                                    ))}
                                </Align>
                            )}
                        </Card>
                    </>
                )}
            </HeightResize>
        </Align>
    );
}
