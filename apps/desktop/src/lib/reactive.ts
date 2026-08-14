import { useSyncExternalStore } from "react";
import { subscribe, snapshot } from "valtio/vanilla";

export const useMutable = <T extends object>(state: T): T => {
    useSyncExternalStore(
        callback => subscribe(state, callback),
        () => snapshot(state),
        () => snapshot(state),
    );
    return state;
};

export const bind = <T extends object, K extends keyof T>(state: T, key: K) => ({
    value: state[key],
    onChange: (value: T[K]) => {
        state[key] = value;
    },
});
