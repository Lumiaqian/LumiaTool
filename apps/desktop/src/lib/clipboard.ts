import { readText, writeImage, writeText } from "@tauri-apps/plugin-clipboard-manager";

const decodeBase64Image = (dataUrl: string) => {
    const separator = dataUrl.indexOf(",");
    if (separator < 0) {
        throw new Error("图片格式错误");
    }
    const binary = atob(dataUrl.slice(separator + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};

export const copy = (data: string, successCallback?: () => void) => {
    if (data === "") {
        return;
    }
    void writeText(data)
        .then(() => successCallback?.())
        .catch(error => console.error("copy failed", error));
};

export const paste = async (): Promise<string> => {
    try {
        return (await readText()) || "";
    } catch (error) {
        console.error("paste failed", error);
        return "";
    }
};

export const copyImage = (imageBase64: string, successCallback?: () => void) => {
    if (!imageBase64) {
        return;
    }
    void writeImage(decodeBase64Image(imageBase64))
        .then(() => successCallback?.())
        .catch(error => console.error("copy image failed", error));
};
