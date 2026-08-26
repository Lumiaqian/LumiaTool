import type { ReactNode } from "react";

type TransformerPageProps = {
    rack?: ReactNode;
    source: ReactNode;
    result: ReactNode;
    sourceLabel?: string;
    resultLabel?: string;
};

export default function TransformerPage({
    rack,
    source,
    result,
    sourceLabel = $t("main_ui_input"),
    resultLabel = $t("main_ui_output"),
}: TransformerPageProps) {
    const panes = (
        <div className="ctool-transformer-panes">
            <section className="ctool-transformer-pane ctool-transformer-pane--source" aria-label={sourceLabel}>
                <header className="ctool-transformer-pane-header">
                    <strong>{sourceLabel}</strong>
                </header>
                <div className="ctool-transformer-pane-body">{source}</div>
            </section>
            <section className="ctool-transformer-pane ctool-transformer-pane--result" aria-label={resultLabel}>
                <header className="ctool-transformer-pane-header">
                    <strong>{resultLabel}</strong>
                </header>
                <div className="ctool-transformer-pane-body">{result}</div>
            </section>
        </div>
    );

    return (
        <div className={`ctool-transformer-page ${rack ? "ctool-transformer-page--configured" : "ctool-transformer-page--paired"}`}>
            <div className="ctool-transformer-layout">
                {rack ? (
                    <div className="ctool-transformer-stage">
                        <div className="ctool-transformer-rack" role="group" aria-label={$t("main_ui_setting")}>
                            {rack}
                        </div>
                        {panes}
                    </div>
                ) : panes}
            </div>
        </div>
    );
}
