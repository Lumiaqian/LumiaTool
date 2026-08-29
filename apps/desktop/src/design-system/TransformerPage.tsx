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
        <div className="lumia-transformer-panes">
            <section className="lumia-transformer-pane lumia-transformer-pane--source" aria-label={sourceLabel}>
                <header className="lumia-transformer-pane-header">
                    <strong>{sourceLabel}</strong>
                </header>
                <div className="lumia-transformer-pane-body">{source}</div>
            </section>
            <section className="lumia-transformer-pane lumia-transformer-pane--result" aria-label={resultLabel}>
                <header className="lumia-transformer-pane-header">
                    <strong>{resultLabel}</strong>
                </header>
                <div className="lumia-transformer-pane-body">{result}</div>
            </section>
        </div>
    );

    return (
        <div className={`lumia-transformer-page ${rack ? "lumia-transformer-page--configured" : "lumia-transformer-page--paired"}`}>
            <div className="lumia-transformer-layout">
                {rack ? (
                    <div className="lumia-transformer-stage">
                        <div className="lumia-transformer-rack" role="group" aria-label={$t("main_ui_setting")}>
                            {rack}
                        </div>
                        {panes}
                    </div>
                ) : panes}
            </div>
        </div>
    );
}
