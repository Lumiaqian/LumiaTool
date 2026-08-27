import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Align, Button, Card, Exception, Input } from "@/components";
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
        setSelected(current => (
            current.includes(filename)
                ? current.filter(item => item !== filename)
                : [...current, filename]
        ));
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
        <div className="ctool-generator-editor-family ctool-generator-page ctool-x-media-page">
            <aside className="ctool-generator-options" aria-label={$t("main_ui_setting")}>
                <Card>
                    <Align direction="vertical" className="ctool-x-media-options">
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
                        <Button type="primary" long loading={busy} disabled={busy || url.trim() === ""} onClick={() => void parseTweet()}>
                            {$t("xMedia_parse")}
                        </Button>
                        <Button long disabled={busy || !tweet?.items.length} onClick={() => setSelected(tweet?.items.map(item => item.filename) ?? [])}>
                            {$t("xMedia_select_all")}
                        </Button>
                        <Button long loading={busy} disabled={busy || selected.length === 0} onClick={() => void downloadSelected()}>
                            {$t("xMedia_download")}
                        </Button>
                        {tweet ? (
                            <div className="ctool-x-media-meta">
                                <strong>@{tweet.author}</strong>
                                <p>{tweet.text}</p>
                                <p>{$t("xMedia_click_hint")}</p>
                            </div>
                        ) : null}
                        {status ? <div className="ctool-x-media-status">{status}</div> : null}
                        {error ? <div className="ctool-x-media-error">{error}</div> : null}
                    </Align>
                </Card>
            </aside>
            <section className="ctool-generator-preview">
                <Card>
                    {tweet?.items.length ? (
                        <div className="ctool-x-media-grid">
                            {tweet.items.map(item => (
                                <figure
                                    key={item.filename}
                                    className="ctool-x-media-item"
                                    data-selected={selected.includes(item.filename) ? "y" : "n"}
                                    onClick={() => toggleItem(item.filename)}
                                >
                                    <img src={item.thumbnail || item.url} alt={item.filename} />
                                    <figcaption>
                                        {kindLabel(item.kind)} · {item.filename}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    ) : (
                        <Exception content={error || $t("xMedia_empty")} />
                    )}
                </Card>
            </section>
        </div>
    );
}
