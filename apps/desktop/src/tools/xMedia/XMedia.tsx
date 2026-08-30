import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Card, Input } from "@/components";
import { downloadXMedia, fetchXTweet, type XTweetMedia } from "@/lib/desktop";

export default function XMedia() {
    const [url, setUrl] = useState("");
    const [tweet, setTweet] = useState<XTweetMedia | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    const parseTweet = async () => {
        setBusy(true);
        setError("");
        setStatus("");
        try {
            const next = await fetchXTweet(url);
            setTweet(next);
            setSelected(next.items.map(item => item.filename));
        } catch (reason) {
            setTweet(null);
            setSelected([]);
            setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
            setBusy(false);
        }
    };

    const toggleItem = (filename: string) => {
        setSelected(current =>
            current.includes(filename) ? current.filter(item => item !== filename) : [...current, filename],
        );
    };

    const downloadSelected = async () => {
        const items = tweet?.items.filter(item => selected.includes(item.filename)) ?? [];
        if (items.length === 0) {
            setError($t("xMedia_none_selected"));
            return;
        }
        const outputDir = await open({ directory: true, multiple: false });
        if (typeof outputDir !== "string" || outputDir === "") {
            return;
        }
        setBusy(true);
        setError("");
        setStatus("");
        try {
            const saved = await downloadXMedia(items, outputDir);
            setStatus($t("xMedia_saved", { count: saved.length }));
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
            setBusy(false);
        }
    };

    const kindLabel = (kind: string) => {
        if (kind === "video") {
            return $t("xMedia_video");
        }
        if (kind === "gif") {
            return $t("xMedia_gif");
        }
        return $t("xMedia_photo");
    };

    return (
        <div
            className={[
                "lumia-generator-editor-family",
                "lumia-generator-page",
                "lumia-x-media-page",
                tweet?.items.length ? "lumia-x-media-page--ready" : "lumia-x-media-page--empty",
            ].join(" ")}
        >
            {tweet?.items.length ? (
                <section className="lumia-media-workbench lumia-x-media-workbench">
                    <header className="lumia-media-workbench-toolbar">
                        <div className="lumia-media-workbench-source lumia-x-media-workbench-source">
                            <Input
                                width="100%"
                                value={url}
                                placeholder={$t("xMedia_placeholder")}
                                onChange={value => setUrl(String(value))}
                                onKeyDown={event => {
                                    if (event.key === "Enter" && url.trim() !== "" && !busy) {
                                        event.preventDefault();
                                        void parseTweet();
                                    }
                                }}
                            />
                            <Button
                                size="small"
                                loading={busy}
                                disabled={busy || url.trim() === ""}
                                onClick={() => void parseTweet()}
                            >
                                {$t("xMedia_parse")}
                            </Button>
                        </div>
                        <div className="lumia-media-workbench-actions">
                            <span className="lumia-media-workbench-summary">
                                {selected.length} / {tweet.items.length}
                            </span>
                            <Button
                                size="small"
                                disabled={busy}
                                onClick={() => setSelected(tweet.items.map(item => item.filename))}
                            >
                                {$t("xMedia_select_all")}
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                loading={busy}
                                disabled={busy || selected.length === 0}
                                onClick={() => void downloadSelected()}
                            >
                                {$t("xMedia_download")}
                            </Button>
                        </div>
                    </header>
                    <div className="lumia-x-media-context">
                        <strong>@{tweet.author}</strong>
                        <p>{tweet.text}</p>
                    </div>
                    {status || error ? (
                        <div className="lumia-media-workbench-feedback">
                            {status ? <span className="lumia-x-media-status">{status}</span> : null}
                            {error ? <span className="lumia-x-media-error">{error}</span> : null}
                        </div>
                    ) : null}
                    <div className="lumia-media-workbench-canvas">
                        <div className="lumia-x-media-grid">
                            {tweet.items.map(item => (
                                <button
                                    key={item.filename}
                                    type="button"
                                    className="lumia-x-media-item"
                                    aria-pressed={selected.includes(item.filename)}
                                    data-selected={selected.includes(item.filename) ? "y" : "n"}
                                    onClick={() => toggleItem(item.filename)}
                                >
                                    <span className="lumia-x-media-thumbnail">
                                        <img src={item.thumbnail || item.url} alt={item.filename} />
                                    </span>
                                    <span className="lumia-x-media-caption">
                                        {kindLabel(item.kind)} · {item.filename}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="lumia-generator-preview">
                    <Card>
                        <div className="lumia-x-media-empty">
                            <div className="lumia-x-media-empty-copy">
                                <span className="lumia-x-media-empty-kicker">X MEDIA</span>
                                <strong>X Media</strong>
                                <span>{$t("xMedia_empty")}</span>
                            </div>
                            <div className="lumia-x-media-empty-form">
                                <Input
                                    width="100%"
                                    value={url}
                                    placeholder={$t("xMedia_placeholder")}
                                    onChange={value => setUrl(String(value))}
                                    onKeyDown={event => {
                                        if (event.key === "Enter" && url.trim() !== "" && !busy) {
                                            event.preventDefault();
                                            void parseTweet();
                                        }
                                    }}
                                />
                                <Button
                                    type="primary"
                                    long
                                    loading={busy}
                                    disabled={busy || url.trim() === ""}
                                    onClick={() => void parseTweet()}
                                >
                                    {$t("xMedia_parse")}
                                </Button>
                            </div>
                            {error ? <div className="lumia-x-media-error">{error}</div> : null}
                        </div>
                    </Card>
                </section>
            )}
        </div>
    );
}
