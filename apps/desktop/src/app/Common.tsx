import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Align, Button, Card } from "@/components";
import { tools } from "@/config";
import type { ToolType } from "@/config";
import useSetting from "@/store/setting";

type ListName = "selected" | "unselected";

type DragItem = {
    list: ListName;
    index: number;
};

export default function Common() {
    const storeSetting = useSetting();
    const [selected, setSelected] = useState<ToolType[]>(() => [...storeSetting.items.common]);
    const [unselected, setUnselected] = useState<ToolType[]>(() =>
        tools.filter((item) => !storeSetting.items.common.includes(item.name)).map(({ name }) => name),
    );
    const dragItem = useRef<DragItem | null>(null);

    const startDrag = (event: DragEvent, list: ListName, index: number) => {
        dragItem.current = { list, index };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `${list}:${index}`);
    };

    const drop = (event: DragEvent, targetList: ListName, targetIndex: number) => {
        event.preventDefault();
        const source = dragItem.current;
        dragItem.current = null;
        if (!source) {
            return;
        }

        if (source.list === targetList) {
            const next = [...(targetList === "selected" ? selected : unselected)];
            const [moved] = next.splice(source.index, 1);
            if (moved === undefined) {
                return;
            }
            const insertionIndex = source.index < targetIndex ? targetIndex - 1 : targetIndex;
            next.splice(Math.max(0, Math.min(insertionIndex, next.length)), 0, moved);
            if (targetList === "selected") {
                setSelected(next);
                storeSetting.save("common", next);
            } else {
                setUnselected(next);
            }
            return;
        }

        const nextSelected = [...selected];
        const nextUnselected = [...unselected];
        const sourceItems = source.list === "selected" ? nextSelected : nextUnselected;
        const targetItems = targetList === "selected" ? nextSelected : nextUnselected;
        const [moved] = sourceItems.splice(source.index, 1);
        if (moved === undefined) {
            return;
        }
        targetItems.splice(Math.max(0, Math.min(targetIndex, targetItems.length)), 0, moved);
        setSelected(nextSelected);
        setUnselected(nextUnselected);
        storeSetting.save("common", nextSelected);
    };

    const reset = () => {
        storeSetting.save("common", []);
        const nextSelected = [...storeSetting.items.common];
        setSelected(nextSelected);
        setUnselected(tools.filter((item) => !nextSelected.includes(item.name)).map(({ name }) => name));
    };

    const renderList = (items: ToolType[], list: ListName) => (
        <div
            className="ctool-common-tool-draggable"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => drop(event, list, items.length)}
        >
            {items.map((name, index) => (
                <Button
                    key={name}
                    type="dotted"
                    draggable
                    onDragStart={(event: DragEvent) => startDrag(event, list, index)}
                    onDragEnd={() => {
                        dragItem.current = null;
                    }}
                    onDragOver={(event: DragEvent) => event.preventDefault()}
                    onDrop={(event: DragEvent) => {
                        event.stopPropagation();
                        drop(event, list, index);
                    }}
                >
                    {$t(`tool_${name}`)}
                </Button>
            ))}
        </div>
    );

    return (
        <Align direction="vertical">
            <Card
                title={$t("main_common_tool")}
                extra={
                    <Button type="primary" size="small" onClick={reset}>
                        {$t("main_ui_reset")}
                    </Button>
                }
            >
                {renderList(selected, "selected")}
            </Card>

            <Card title={$t("main_unselected_tool")} extra={$t("main_common_drag")}>
                {renderList(unselected, "unselected")}
            </Card>
        </Align>
    );
}
