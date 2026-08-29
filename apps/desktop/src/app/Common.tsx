import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Align, Button, Card } from "@/components";
import { commonTool, tools } from "@/config";
import type { ToolType } from "@/config";
import useSetting from "@/store/setting";

type ListName = "selected" | "unselected";

type DragItem = {
    list: ListName;
    index: number;
};

export default function Common({ onClose }: { onClose?: () => void }) {
    const storeSetting = useSetting();
    const [selected, setSelected] = useState<ToolType[]>(() => [...storeSetting.items.common]);
    const [unselected, setUnselected] = useState<ToolType[]>(() =>
        tools.filter(item => !storeSetting.items.common.includes(item.name)).map(({ name }) => name),
    );
    const dragItem = useRef<DragItem | null>(null);
    const dragged = useRef(false);

    const commit = (nextSelected: ToolType[], nextUnselected: ToolType[]) => {
        setSelected(nextSelected);
        setUnselected(nextUnselected);
        storeSetting.save("common", nextSelected);
    };

    const toggle = (name: ToolType, list: ListName) => {
        if (dragged.current) {
            dragged.current = false;
            return;
        }
        if (list === "selected") {
            if (selected.length <= 1) {
                return;
            }
            commit(
                selected.filter(item => item !== name),
                [...unselected, name],
            );
            return;
        }
        commit(
            [...selected, name],
            unselected.filter(item => item !== name),
        );
    };

    const startDrag = (event: DragEvent, list: ListName, index: number) => {
        dragged.current = true;
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

        const nextSelected = [...selected];
        const nextUnselected = [...unselected];
        const sourceItems = source.list === "selected" ? nextSelected : nextUnselected;
        const targetItems = targetList === "selected" ? nextSelected : nextUnselected;
        const [moved] = sourceItems.splice(source.index, 1);
        if (moved === undefined) {
            return;
        }
        if (source.list === "selected" && nextSelected.length < 1) {
            return;
        }
        const insertionIndex = source.list === targetList && source.index < targetIndex
            ? targetIndex - 1
            : targetIndex;
        targetItems.splice(Math.max(0, Math.min(insertionIndex, targetItems.length)), 0, moved);
        commit(nextSelected, nextUnselected);
    };

    const reset = () => {
        const nextSelected = [...commonTool];
        commit(
            nextSelected,
            tools.filter(item => !nextSelected.includes(item.name)).map(({ name }) => name),
        );
    };

    const renderList = (items: ToolType[], list: ListName) => (
        <div
            className="lumia-common-tool-draggable"
            onDragOver={event => event.preventDefault()}
            onDrop={event => drop(event, list, items.length)}
        >
            {items.map((name, index) => (
                <div
                    key={name}
                    className="lumia-button lumia-common-chip"
                    data-type="dotted"
                    draggable
                    onClick={() => toggle(name, list)}
                    onDragStart={event => startDrag(event, list, index)}
                    onDragEnd={() => {
                        dragItem.current = null;
                    }}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                        event.stopPropagation();
                        drop(event, list, index);
                    }}
                >
                    {$t(`tool_${name}`)}
                </div>
            ))}
        </div>
    );

    return (
        <Align direction="vertical">
            <Card
                title={$t("main_common_tool")}
                extra={(
                    <Align>
                        <Button size="small" onClick={reset}>
                            {$t("main_ui_reset")}
                        </Button>
                        {onClose ? (
                            <Button size="small" onClick={onClose}>
                                {$t("main_ui_close")}
                            </Button>
                        ) : null}
                    </Align>
                )}
            >
                {renderList(selected, "selected")}
            </Card>

            <Card title={$t("main_unselected_tool")} extra={$t("main_common_drag")}>
                {renderList(unselected, "unselected")}
            </Card>
        </Align>
    );
}
