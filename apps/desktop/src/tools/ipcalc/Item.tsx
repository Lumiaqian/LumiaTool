export interface ItemProps {
    title?: string;
    value?: string | number;
}

export default function Item({ title = "", value = "" }: ItemProps) {
    return (
        <div
            style={{ cursor: "pointer" }}
            onClick={() => { $copy(`${value}`); }}
            className="ctool-ipcalc-item"
        >
            <div className="ctool-ipcalc-item-value">{value}</div>
            {title !== "" && <div className="ctool-ipcalc-item-title">{title}</div>}
        </div>
    );
}
