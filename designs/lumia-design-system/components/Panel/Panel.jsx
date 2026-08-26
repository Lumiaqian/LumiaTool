export function Panel({ title, surface = "paper", actions, children }) {
  return <section className="lumia-panel" data-surface={surface}><header className="lumia-panel__header"><strong>{title}</strong><span>{actions}</span></header><div className="lumia-panel__body">{children}</div></section>;
}
