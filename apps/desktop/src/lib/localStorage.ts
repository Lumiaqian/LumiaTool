import { load } from "@tauri-apps/plugin-store";
import type { Store } from "@tauri-apps/plugin-store";
import type { StorageDataStructure, StorageDataStructureInterface, StorageInterface } from "@/types";

const STORE_PATH = "lumiatool.json";
const LEGACY_PREFIX = "lumia.";
const values = new Map<string, unknown>();
let nativeStore: Store;
let writeQueue = Promise.resolve();

const enqueue = (operation: () => Promise<void>) => {
    writeQueue = writeQueue.then(operation).catch(error => console.error("native store write failed", error));
};

const deserializeLegacyValue = (serialized: string) => {
    try {
        return JSON.parse(serialized) as unknown;
    } catch {
        return serialized;
    }
};

export const initializeStorage = async () => {
    nativeStore = await load(STORE_PATH, { autoSave: false });
    for (const [key, value] of await nativeStore.entries<unknown>()) {
        values.set(key, value);
    }

    const migratedKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const legacyKey = window.localStorage.key(index);
        if (!legacyKey?.startsWith(LEGACY_PREFIX)) {
            continue;
        }
        const key = legacyKey.slice(LEGACY_PREFIX.length);
        const serialized = window.localStorage.getItem(legacyKey);
        if (!values.has(key) && serialized !== null) {
            const value = deserializeLegacyValue(serialized);
            values.set(key, value);
            await nativeStore.set(key, value);
        }
        migratedKeys.push(legacyKey);
    }
    if (migratedKeys.length > 0) {
        await nativeStore.save();
        migratedKeys.forEach(key => window.localStorage.removeItem(key));
    }
};

class NativeStorage implements StorageInterface {
    get<T>(key: string): StorageDataStructure<T> {
        return (values.get(key) as StorageDataStructure<T> | undefined) ?? null;
    }

    clear(): void {
        values.clear();
        enqueue(async () => {
            await nativeStore.clear();
            await nativeStore.save();
        });
    }

    getAllKey(): string[] {
        return [...values.keys()];
    }

    remove(key: string): void {
        values.delete(key);
        enqueue(async () => {
            await nativeStore.delete(key);
            await nativeStore.save();
        });
    }

    set<T>(key: string, value: StorageDataStructureInterface<T>): void {
        values.set(key, value);
        enqueue(async () => {
            await nativeStore.set(key, value);
            await nativeStore.save();
        });
    }
}

export default new NativeStorage();
