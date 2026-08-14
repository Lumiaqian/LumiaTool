import {openUrl as openExternalUrl} from "./desktop";

export const openUrl = (url: string = window.location.href) => openExternalUrl(url);

export const optionMap = (items: string[] | number[], prefix = "") => {
    return items.map((item: string | number) => {
        return {value: item, label: $t(`${prefix}${item}`)}
    })
}

