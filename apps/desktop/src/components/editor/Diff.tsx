import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import type { ReactNode } from "react";
import { Align, Bool } from "@/components";
import event from "@/event";
import { getEditorLanguage } from "@/lib/code";
import { sizeConvert } from "../util";
import { ContextMenu, monacoInit, monacoInstance, applyMonacoTheme } from "./monaco";
import type { monacoEditor } from "./monaco";
import PlaceholderContentWidget from "./placeholderContentWidget";

declare global {
    interface Window {
        _diffEditor?: monacoEditor.editor.IDiffEditor;
    }
}

export interface DiffProps {
    original?: string;
    onOriginalChange?: (value: string) => void;
    modified?: string;
    onModifiedChange?: (value: string) => void;
    lang?: string;
    height?: string | number;
    disableLineWrapping?: boolean;
    disableBorder?: boolean;
    disableLineNumbers?: boolean;
    disableClear?: boolean;
    children?: ReactNode;
}

export interface DiffRef {
    getEditor: () => monacoEditor.editor.IDiffEditor | null;
    updateEditor: (original?: string, modified?: string) => void;
    location: (direction: "prev" | "next") => void;
}

const Diff = forwardRef<DiffRef, DiffProps>(function Diff(
    {
        original = "",
        onOriginalChange,
        modified = "",
        onModifiedChange,
        lang = "text",
        height = "100%",
        disableLineWrapping = false,
        disableBorder = false,
        disableLineNumbers = false,
        disableClear = false,
        children,
    },
    forwardedRef,
) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<monacoEditor.editor.IDiffEditor | null>(null);
    const originalModelRef = useRef<monacoEditor.editor.ITextModel | null>(null);
    const modifiedModelRef = useRef<monacoEditor.editor.ITextModel | null>(null);
    const originalRef = useRef(original);
    const modifiedRef = useRef(modified);
    const onOriginalChangeRef = useRef(onOriginalChange);
    const onModifiedChangeRef = useRef(onModifiedChange);
    const langRef = useRef(lang);
    const inlineRef = useRef(false);
    const updateConfigRef = useRef<() => void>(() => undefined);
    const [changes, setChanges] = useState(0);
    const [currentChange, setCurrentChange] = useState(1);
    const [inline, setInline] = useState(false);

    originalRef.current = original;
    modifiedRef.current = modified;
    onOriginalChangeRef.current = onOriginalChange;
    onModifiedChangeRef.current = onModifiedChange;
    langRef.current = lang;
    inlineRef.current = inline;

    const updateEditor = useCallback((nextOriginal = "", nextModified = "") => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        const originalEditor = editor.getOriginalEditor();
        const modifiedEditor = editor.getModifiedEditor();
        if (originalEditor.getValue() !== nextOriginal) {
            originalEditor.setValue(nextOriginal);
        }
        if (modifiedEditor.getValue() !== nextModified) {
            modifiedEditor.setValue(nextModified);
        }
    }, []);

    const updateEditorConfig = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        [editor.getOriginalEditor(), editor.getModifiedEditor()].forEach(childEditor => {
            const model = childEditor.getModel();
            if (model) {
                monacoInstance()?.editor.setModelLanguage(model, getEditorLanguage(langRef.current).id);
            }
        });
        editor.updateOptions({ renderSideBySide: !inlineRef.current });
        applyMonacoTheme();
    }, []);

    updateConfigRef.current = updateEditorConfig;

    const location = useCallback((direction: "prev" | "next") => {
        const editor = editorRef.current;
        const lineChanges = editor?.getLineChanges() ?? [];
        const nextIndex = direction === "prev" ? currentChange - 1 : currentChange + 1;
        const change = lineChanges[nextIndex - 1];
        if (!change) {
            return;
        }
        editor?.revealLineInCenter(change.originalEndLineNumber);
        setCurrentChange(nextIndex);
    }, [currentChange]);

    useImperativeHandle(
        forwardedRef,
        () => ({
            getEditor: () => editorRef.current,
            updateEditor,
            location,
        }),
        [location, updateEditor],
    );

    useEffect(() => {
        let active = true;
        const element = containerRef.current;
        if (!element) {
            return;
        }

        const clearHandler = () => updateEditor("", "");
        const themeHandler = () => applyMonacoTheme();
        event.addListener("theme_change", themeHandler);
        if (!disableClear) {
            event.addListener("content_clear", clearHandler);
        }
        void monacoInit({
            "vs/nls": {
                availableLanguages: { "*": $t("main_locale") === "zh_CN" ? "zh-cn" : "en" },
            },
        }).then(monaco => {
            if (!active) {
                return;
            }

            const originalModel = monaco.editor.createModel(originalRef.current);
            const modifiedModel = monaco.editor.createModel(modifiedRef.current);
            const diffEditor = monaco.editor.createDiffEditor(element, {
                lineNumbers: disableLineNumbers ? "off" : "on",
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 8,
                wordWrap: disableLineWrapping ? "off" : "on",
                minimap: { enabled: false },
                renderGutterMenu: false,
                renderOverviewRuler: false,
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: "line",
                renderLineHighlightOnlyWhenFocus: true,
                padding: { top: 10, bottom: 10 },
                automaticLayout: true,
                originalEditable: true,
                scrollBeyondLastLine: false,
                renderSideBySide: !inlineRef.current,
                useInlineViewWhenSpaceIsLimited: false,
                enableSplitViewResizing: false,
                theme: applyMonacoTheme(),
                scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                    useShadows: false,
                },
            });

            if (!active) {
                diffEditor.dispose();
                originalModel.dispose();
                modifiedModel.dispose();
                return;
            }

            originalModelRef.current = originalModel;
            modifiedModelRef.current = modifiedModel;
            diffEditor.setModel({ original: originalModel, modified: modifiedModel });
            window._diffEditor = diffEditor;

            diffEditor.getOriginalEditor().onDidChangeModelContent(() => {
                const nextValue = diffEditor.getOriginalEditor().getValue();
                if (nextValue !== originalRef.current) {
                    onOriginalChangeRef.current?.(nextValue);
                }
            });
            diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
                const nextValue = diffEditor.getModifiedEditor().getValue();
                if (nextValue !== modifiedRef.current) {
                    onModifiedChangeRef.current?.(nextValue);
                }
            });

            [diffEditor.getOriginalEditor(), diffEditor.getModifiedEditor()].forEach(childEditor => {
                new PlaceholderContentWidget($t("main_ui_input"), childEditor);
                const contextMenu = new ContextMenu(childEditor);
                contextMenu.setHandle("ctool_line_wrapping", () => undefined);
                contextMenu.setHandle("ctool_line_number", () => undefined);
            });

            diffEditor.onDidUpdateDiff(() => {
                setChanges(diffEditor.getLineChanges()?.length ?? 0);
                setCurrentChange(1);
            });

            editorRef.current?.dispose();
            editorRef.current = diffEditor;
            updateConfigRef.current();
        });

        return () => {
            active = false;
            event.removeListener("theme_change", themeHandler);
            if (!disableClear) {
                event.removeListener("content_clear", clearHandler);
            }
            const editor = editorRef.current;
            editor?.dispose();
            editorRef.current = null;
            originalModelRef.current?.dispose();
            modifiedModelRef.current?.dispose();
            originalModelRef.current = null;
            modifiedModelRef.current = null;
            if (window._diffEditor === editor) {
                delete window._diffEditor;
            }
        };
    }, []);

    useEffect(() => {
        updateEditor(original, modified);
    }, [original, modified, updateEditor]);

    useEffect(() => {
        updateEditorConfig();
    }, [lang, inline, updateEditorConfig]);

    const navigation = (
        <div className="ctool-diff-navigation" role="group" aria-label={$t("component_editor_change_navigation")}>
            <button
                type="button"
                disabled={changes === 0 || currentChange === 1}
                onClick={() => location("prev")}
                aria-label={$t("component_editor_previous_change")}
                title={$t("component_editor_previous_change")}
            >
                <span aria-hidden="true">‹</span>
            </button>
            <output aria-live="polite" aria-label={$t("component_editor_change_count")}>
                <strong>{changes ? currentChange : 0}</strong>
                <span aria-hidden="true">/</span>
                <span>{changes}</span>
            </output>
            <button
                type="button"
                disabled={changes === 0 || currentChange === changes}
                onClick={() => location("next")}
                aria-label={$t("component_editor_next_change")}
                title={$t("component_editor_next_change")}
            >
                <span aria-hidden="true">›</span>
            </button>
        </div>
    );

    const extra = (
        <Align className="ctool-diff-toolbar">
            {navigation}
            <Bool
                value={inline}
                onChange={next => setInline(Boolean(next))}
                label={$t("component_editor_inline")}
                size="small"
                border
            />
            {children}
        </Align>
    );

    const className = disableBorder
        ? "ctool-code-diff ctool-code-diff-disable-border"
        : "ctool-code-diff";

    return (
        <div className={className} style={{ height: sizeConvert(height), width: "100%" }}>
            <div className="ctool-editor-surface-toolbar">{extra}</div>
            <div ref={containerRef} style={{ minHeight: 0, height: "100%", width: "100%" }} />
        </div>
    );
});

export default Diff;
