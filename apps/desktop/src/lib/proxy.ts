import { fetch } from "@tauri-apps/plugin-http";

export class HttpError<T = unknown> extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly data: T,
    ) {
        super(message);
        this.name = "HttpError";
    }
}

const responseData = async <T>(response: Response) => {
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
};

export const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);
    const data = await responseData<T>(response);
    if (!response.ok) {
        throw new HttpError(`HTTP ${response.status}`, response.status, data);
    }
    return data;
};

export const postJson = <T>(url: string, data: unknown) =>
    requestJson<T>(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
    });

export const requestBytes = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new HttpError(`HTTP ${response.status}`, response.status, null);
    }
    return new Uint8Array(await response.arrayBuffer());
};
