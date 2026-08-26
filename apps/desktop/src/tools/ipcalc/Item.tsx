export interface ItemProps {
    title?: string;
    value?: string | number;
}

export default function Item({ title = "", value = "" }: ItemProps) {
    return (
        <button
            type="button"
            onClick={() => { $copy(`${value}`); }}
            className="ctool-ipcalc-item"
            title={`${value}`}
        >
            <span className="ctool-ipcalc-item-value">{value}</span>
            {title !== "" && <span className="ctool-ipcalc-item-title">{title}</span>}
        </button>
    );
}
