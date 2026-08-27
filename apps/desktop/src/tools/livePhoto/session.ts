import { proxy } from "valtio/vanilla";
import type { LivePhotoVideoInfo } from "@/lib/desktop";

export const livePhotoSession = proxy({
    videoPath: "",
    coverPath: "",
    info: null as LivePhotoVideoInfo | null,
    start: 0,
    duration: 3,
    coverTime: 1,
    quality: "balanced",
    height: "0",
    importPhotos: true,
});
