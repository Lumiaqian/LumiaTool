export function ResultRow({ label, value = "", state = "default", action }) {
  return <div className="lumia-result-row" data-state={state}><span className="lumia-result-row__label">{label}</span><output className="lumia-result-row__value">{value || "—"}</output>{value && action ? <span>{action}</span> : null}</div>;
}
