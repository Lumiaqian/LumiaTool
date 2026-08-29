import { useCallback, useEffect, useMemo, useState } from "react";
import { Align, Button, Card, Editor, ExtendPage, HeightResize, Input, Link, Select } from "@/components";
import { useAction, initialize } from "@/store/action";
import { language, getLanguage, getUsed, getConfig, setConfig, execute } from "./runUtil";
import type { Result } from "./runUtil";
import { getDisplayName } from "@/lib/code";
import type { SelectOption } from "@/types";
import runApiConfig from "@/assets/tools/code/run_api_config.png";

const initial = await initialize({
    input: "",
    language: "php",
    version: (() => {
        const version: Record<string, string> = {};
        for (const item of language) version[item.code] = item.version[item.version.length - 1].value;
        return version;
    })(),
    result: { output: "", memory: 0, cpuTime: 0, error: "" } as Result,
});

const languageLists = language.map((item) => item.code).sort();

export default function Run() {
    const action = useAction(initial);
    const [showSetting, setShowSetting] = useState(false);
    const [used, setUsed] = useState(0);
    const [config, setConfigState] = useState(getConfig);
    const [isEnable, setIsEnable] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const languageVersionLists = useMemo<SelectOption>(() =>
        getLanguage(action.current.language).version.map((item) => ({ value: item.value, label: item.name })),
    [action.current.language]);

    const resetUsed = useCallback(() => {
        if (config.client_id === "" || config.client_secret === "") return;
        getUsed().then((times) => {
            setUsed(times);
            setIsEnable(true);
        }).catch((error: unknown) => {
            setUsed(0);
            setIsEnable(false);
            throw error;
        });
    }, [config.client_id, config.client_secret]);

    useEffect(() => {
        setConfig(config.client_id, config.client_secret);
        resetUsed();
    }, [config.client_id, config.client_secret, resetUsed]);

    const run = useCallback(() => {
        try {
            setIsRunning(true);
            execute(action.current.language, action.current.input, action.current.version[action.current.language])
                .then((result) => {
                    action.current.result = result;
                    action.save();
                })
                .catch((error: unknown) => {
                    action.current.result = { output: "", memory: 0, cpuTime: 0, error: $error(error) };
                    action.save();
                })
                .finally(() => {
                    setIsRunning(false);
                    resetUsed();
                });
        } catch (error) {
            action.current.result = { output: "", memory: 0, cpuTime: 0, error: $error(error) };
            setIsRunning(false);
        }
    }, [action, resetUsed]);

    return (
        <>
            <div className="lumia-generator-editor-family lumia-editor-page lumia-code-runner-page">
                <header className="lumia-editor-command-toolbar" aria-label={$t("main_ui_setting")}>
                    <Align>
                        <span>{$t("code_run_used_times", [used])}</span>
                        <Select dialog size="small" value={action.current.language} onChange={(value: string) => { action.current.language = value; }} options={languageLists.map((name) => ({ value: name, label: getDisplayName(name) }))} />
                        <Select size="small" value={action.current.version[action.current.language]} onChange={(value: string) => { action.current.version[action.current.language] = value; }} options={languageVersionLists} />
                        <Button type="primary" text={isRunning ? $t("code_running") : $t("code_run")} disabled={isRunning || !isEnable || action.current.input === ""} loading={isRunning} size="small" onClick={run} />
                        <Button size="small" onClick={() => setShowSetting((value) => !value)}>{$t("main_ui_setting")}</Button>
                    </Align>
                </header>
                <div className="lumia-editor-result-workspace">
                    <section className="lumia-editor-surface" aria-label={$t("main_ui_input")}>
                        <HeightResize>
                            {({ height }) => (
                                <Editor
                                    value={action.current.input}
                                    onChange={(value: string) => { action.current.input = value; }}
                                    lang={action.current.language}
                                    height={`${height}px`}
                                />
                            )}
                        </HeightResize>
                    </section>
                    <section className="lumia-editor-result" aria-label={$t("main_ui_output")}>
                        <Card title={$t("main_ui_output")} padding="0">
                            <Editor lang="shell" value={action.current.result.error !== "" ? action.current.result.error : action.current.result.output}>
                                {action.current.result.output !== "" && action.current.result.error === "" && (
                                    <Button type="dotted" size="small" text={`Memory:${action.current.result.memory} Cpu Time:${action.current.result.cpuTime}`} />
                                )}
                            </Editor>
                        </Card>
                    </section>
                </div>
            </div>
            <ExtendPage value={showSetting} onChange={setShowSetting}>
                <Card title={$t("main_ui_setting")} padding="20px">
                    <Align direction="vertical" style={{ marginBottom: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr" }}>
                            <strong>Client ID</strong>
                            <Input value={config.client_id} onChange={(client_id: string) => setConfigState((value) => ({ ...value, client_id }))} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr" }}>
                            <strong>Client Secret</strong>
                            <Input value={config.client_secret} onChange={(client_secret: string) => setConfigState((value) => ({ ...value, client_secret }))} />
                        </div>
                    </Align>
                    <Align direction="vertical">
                        <Align horizontal="center" vertical="center">
                            <Link href="https://www.jdoodle.com/compiler-api/" tooltip={$t("code_run_config_explain", ["https://www.jdoodle.com/"])}>
                                <img src={runApiConfig} style={{ width: 500 }} />
                            </Link>
                        </Align>
                        <Align horizontal="center" vertical="center">
                            <Link href="https://www.jdoodle.com/compiler-api/" type="primary" style={{ fontSize: 12 }}>
                                {$t("code_run_config_explain", ["https://www.jdoodle.com/"])}
                            </Link>
                        </Align>
                    </Align>
                </Card>
            </ExtendPage>
        </>
    );
}
