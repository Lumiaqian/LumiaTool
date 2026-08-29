export interface ItemProps {
    title?: string;
    value?: string | number;
}

export default function Item({ title = "", value = "" }: ItemProps) {
    return (
        <button
            type="button"
            onClick={() => { $copy(`${value}`); }}
            className="lumia-ipcalc-item"
            title={`${value}`}
        >
            <span className="lumia-ipcalc-item-value">{value}</span>
            {title !== "" && <span className="lumia-ipcalc-item-title">{title}</span>}
        </button>
    );
}
