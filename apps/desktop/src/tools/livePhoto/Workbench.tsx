import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Bool, Button, Card, Exception, InputNumber, Select } from "@/components";
import { createAppleLivePhoto, createGoogleMotionPhoto, isMacOs, probeLivePhotoVideo } from "@/lib/desktop";
import { useMutable } from "@/lib/reactive";
import { livePhotoSession } from "./session";

type Variant = "google" | "apple" | "wallpaper";

const supportedVideoExtensions: Record<string, true> = {
    mp4: true,
    mov: true,
    m4v: true,
    mkv: true,
    avi: true,
    webm: true,
};

const videoFilters = [{ name: "Video", extensions: Object.keys(supportedVideoExtensions) }];

const isSupportedVideo = (path: string) => {
    const extension = path.split(".").pop()?.toLowerCase() ?? "";
    return supportedVideoExtensions[extension] === true;
};

const qualityOptions = [
    { value: "compact", label: $t("livePhoto_quality_compact") },
    { value: "balanced", label: $t("livePhoto_quality_balanced") },
    { value: "pristine", label: $t("livePhoto_quality_pristine") },
];

const heightOptions = [
    { value: "0", label: $t("livePhoto_height_source") },
    { value: "720", label: "720p" },
    { value: "1080", label: "1080p" },
];

const fileName = (path: string) => path.split(/[/\\]/).pop() || path;

export default function Workbench({ variant }: { variant: Variant }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const session = useMutable(livePhotoSession);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [dropActive, setDropActive] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const { videoPath, coverPath, info, start, duration, coverTime, quality, height, importPhotos } = session;

    const previewSrc = useMemo(() => (videoPath ? convertFileSrc(videoPath) : ""), [videoPath]);
    const maxDuration = info?.duration ?? 0;
    const durationCap = variant === "wallpaper" ? Math.min(maxDuration || 3, 3) : maxDuration;
    const clipDuration = Math.min(duration, Math.max(durationCap - start, 0.2), durationCap || 3);
    const appleBlocked = (variant === "apple" || variant === "wallpaper") && !isMacOs;

    const loadVideo = useCallback(
        async (selected: string) => {
            setError("");
            setStatus("");
            try {
                const next = await probeLivePhotoVideo(selected);
                session.videoPath = selected;
                session.info = next;
                session.start = 0;
                session.duration = Math.max(next.duration, 0.2);
                session.coverTime = Math.min(1, next.duration);
                if (!next.ffmpeg && !next.macos && variant === "google") {
                    setError($t("livePhoto_ffmpeg_hint"));
                }
            } catch (reason) {
                setError(reason instanceof Error ? reason.message : String(reason));
            }
        },
        [session, variant],
    );

    useEffect(() => {
        if (!isTauri()) {
            return;
        }

        const unlisten = getCurrentWebview()
            .onDragDropEvent(event => {
                const payload = event.payload;
                if (payload.type === "enter") {
                    setDropActive(payload.paths.some(isSupportedVideo));
                    return;
                }
                if (payload.type === "leave") {
                    setDropActive(false);
                    return;
                }
                if (payload.type !== "drop") {
                    return;
                }

                setDropActive(false);
                const selected = payload.paths.find(isSupportedVideo);
                if (selected) {
                    void loadVideo(selected);
                } else {
                    setError($t("livePhoto_drop_unsupported"));
                }
            })
            .catch(() => undefined);

        return () => {
            void unlisten.then(dispose => dispose?.());
        };
    }, [loadVideo]);

    const pickVideo = async () => {
        const selected = await open({ multiple: false, filters: videoFilters });
        if (typeof selected === "string" && selected !== "") {
            await loadVideo(selected);
        }
    };

    const pickCover = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: "Image", extensions: ["jpg", "jpeg", "png", "heic", "webp"] }],
        });
        if (typeof selected === "string" && selected !== "") {
            session.coverPath = selected;
        }
    };

    const useCurrentFrame = () => {
        const current = videoRef.current?.currentTime;
        if (typeof current === "number" && Number.isFinite(current)) {
            session.coverTime = current;
            session.coverPath = "";
        }
    };

    const exportLivePhoto = async () => {
        if (appleBlocked) {
            setError($t("livePhoto_macos_only"));
            return;
        }
        if (!videoPath) {
            setError($t("livePhoto_no_video"));
            return;
        }
        setBusy(true);
        setError("");
        setStatus("");
        try {
            if (variant === "google") {
                const outputPath = await save({
                    defaultPath: `${fileName(videoPath).replace(/\.[^.]+$/, "")}.MP.JPG`,
                    filters: [{ name: "Motion Photo", extensions: ["JPG"] }],
                });
                if (typeof outputPath !== "string" || outputPath === "") {
                    return;
                }
                const saved = await createGoogleMotionPhoto({
                    videoPath,
                    coverPath: coverPath || null,
                    outputPath,
                    start,
                    duration: clipDuration,
                    coverTime,
                    quality,
                    height: Number(height) || 0,
                });
                setStatus(`${$t("livePhoto_saved")}: ${saved}`);
            } else {
                const outputDir = await open({ directory: true, multiple: false });
                if (typeof outputDir !== "string" || outputDir === "") {
                    return;
                }
                const result = await createAppleLivePhoto({
                    videoPath,
                    coverPath: coverPath || null,
                    outputDir,
                    start,
                    duration: clipDuration,
                    coverTime,
                    importPhotos,
                    wallpaper: variant === "wallpaper",
                });
                let importStatus = $t("livePhoto_pair_saved");
                if (importPhotos) {
                    importStatus = result.imported ? $t("livePhoto_imported") : $t("livePhoto_import_failed");
                }
                setStatus(`${$t("livePhoto_saved")} ${fileName(result.heicPath)} · ${importStatus}`);
            }
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : String(reason));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={[
                "lumia-generator-editor-family",
                "lumia-generator-page",
                "lumia-live-photo-page",
                videoPath ? "lumia-live-photo-page--ready" : "lumia-live-photo-page--empty",
                dropActive ? "lumia-live-photo-page--drop-active" : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {videoPath ? (
                <section className="lumia-media-workbench lumia-live-photo-workbench">
                    <header className="lumia-media-workbench-toolbar">
                        <div className="lumia-media-workbench-source-copy">
                            <strong>{fileName(videoPath)}</strong>
                            {info ? (
                                <span>
                                    {info.width}×{info.height} · {info.duration.toFixed(1)}s
                                </span>
                            ) : null}
                        </div>
                        <div className="lumia-media-workbench-actions">
                            <Button size="small" disabled={busy} onClick={() => void pickVideo()}>
                                {$t("livePhoto_pick_video")}
                            </Button>
                            <Button
                                size="small"
                                aria-expanded={inspectorOpen}
                                onClick={() => setInspectorOpen(current => !current)}
                            >
                                {$t("main_ui_setting")}
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                loading={busy}
                                disabled={busy || appleBlocked}
                                onClick={() => void exportLivePhoto()}
                            >
                                {$t("livePhoto_export")}
                            </Button>
                        </div>
                    </header>
                    {inspectorOpen ? (
                        <div className="lumia-media-workbench-inspector">
                            <InputNumber
                                label={$t("livePhoto_start")}
                                value={Number(start.toFixed(2))}
                                min={0}
                                max={Math.max(maxDuration, 0)}
                                step={0.1}
                                onChange={value => {
                                    session.start = Math.max(0, value);
                                }}
                            />
                            <InputNumber
                                label={$t("livePhoto_duration")}
                                value={Number(Math.min(duration, durationCap || duration).toFixed(2))}
                                min={0.2}
                                max={Math.max(durationCap || 0.2, 0.2)}
                                step={0.1}
                                onChange={value => {
                                    session.duration = Math.max(0.2, value);
                                }}
                            />
                            <InputNumber
                                label={$t("livePhoto_cover_time")}
                                value={Number(coverTime.toFixed(2))}
                                min={0}
                                max={Math.max(maxDuration, 0)}
                                step={0.1}
                                onChange={value => {
                                    session.coverTime = Math.max(0, value);
                                }}
                            />
                            {variant === "google" ? (
                                <>
                                    <Select
                                        label={$t("livePhoto_quality")}
                                        value={quality}
                                        options={qualityOptions}
                                        onChange={value => {
                                            session.quality = String(value);
                                        }}
                                    />
                                    <Select
                                        label={$t("livePhoto_height")}
                                        value={height}
                                        options={heightOptions}
                                        onChange={value => {
                                            session.height = String(value);
                                        }}
                                    />
                                </>
                            ) : (
                                <Bool
                                    border
                                    disabled={appleBlocked}
                                    value={importPhotos}
                                    onChange={value => {
                                        session.importPhotos = value;
                                    }}
                                    label={$t("livePhoto_import_photos")}
                                />
                            )}
                            <div className="lumia-media-workbench-field-actions">
                                <Button size="small" onClick={useCurrentFrame}>
                                    {$t("livePhoto_use_frame")}
                                </Button>
                                <Button size="small" onClick={() => void pickCover()}>
                                    {$t("livePhoto_pick_cover")}
                                </Button>
                                {coverPath ? (
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            session.coverPath = "";
                                        }}
                                    >
                                        {$t("livePhoto_cover_clear")}
                                    </Button>
                                ) : null}
                            </div>
                            {coverPath ? (
                                <span className="lumia-live-photo-path lumia-media-workbench-wide">
                                    {fileName(coverPath)}
                                </span>
                            ) : null}
                            {variant === "wallpaper" ? (
                                <div className="lumia-live-photo-hint lumia-media-workbench-wide">
                                    {$t("livePhoto_wallpaper_hint")}
                                </div>
                            ) : clipDuration > 3.5 ? (
                                <div className="lumia-live-photo-hint lumia-media-workbench-wide">
                                    {$t("livePhoto_wechat_hint")}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {status || error ? (
                        <div className="lumia-media-workbench-feedback">
                            {status ? <span className="lumia-live-photo-status">{status}</span> : null}
                            {error ? <span className="lumia-live-photo-error">{error}</span> : null}
                        </div>
                    ) : null}
                    <div className="lumia-media-workbench-canvas">
                        {appleBlocked ? (
                            <Exception content={$t("livePhoto_macos_only")} />
                        ) : (
                            <video
                                ref={videoRef}
                                className="lumia-live-photo-video"
                                src={previewSrc}
                                controls
                                onLoadedMetadata={event => {
                                    const next = event.currentTarget.duration;
                                    if (
                                        Number.isFinite(next) &&
                                        next > 0 &&
                                        info &&
                                        Math.abs(info.duration - next) > 0.4
                                    ) {
                                        session.info = { ...info, duration: next };
                                    }
                                }}
                            />
                        )}
                        {dropActive ? (
                            <div className="lumia-live-photo-drop-overlay">{$t("livePhoto_drop_active")}</div>
                        ) : null}
                    </div>
                </section>
            ) : (
                <section className="lumia-generator-preview">
                    <Card>
                        {appleBlocked ? (
                            <Exception content={$t("livePhoto_macos_only")} />
                        ) : (
                            <div className="lumia-live-photo-empty">
                                <div className="lumia-live-photo-empty-copy">
                                    <span className="lumia-live-photo-empty-kicker">LIVE</span>
                                    <strong>{$t("livePhoto_pick_video")}</strong>
                                    <span>{$t("livePhoto_empty_video")}</span>
                                </div>
                                <Button type="primary" onClick={() => void pickVideo()}>
                                    {$t("livePhoto_pick_video")}
                                </Button>
                                <span className="lumia-live-photo-drop-label">
                                    {dropActive ? $t("livePhoto_drop_active") : $t("livePhoto_drop_video")}
                                </span>
                            </div>
                        )}
                    </Card>
                </section>
            )}
        </div>
    );
}
