import { iconData } from "@/generated/data";
import type { iconType } from "@/generated/data";

export const all = Object.keys(iconData) as iconType[];
export type IconType = iconType;
