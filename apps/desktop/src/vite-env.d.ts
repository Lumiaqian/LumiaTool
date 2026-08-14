/// <reference types="vite/client" />

import type { $t as translate } from "@/i18n";

declare global {
    const $t: typeof translate;
    const $copy: (data: string) => void;
    const $error: (error: unknown, isI18n?: boolean) => string;
}

export {};
