import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import type { ReactNode } from "react";
import { Display } from "@/components";
import event from "@/event";
import { getEditorLanguage } from "@/lib/code";
import { useTheme } from "@/store/setting";
import type { DisplayPosition } from "@/types";
import { sizeConvert } from "../util";
import { ContextMenu, lineInfo as configureLineInfo, monacoInit, monacoInstance } from "./monaco";
import type { monacoEditor } from "./monaco";
import PlaceholderContentWidget from "./placeholderContentWidget";

export interface EditorProps {
    value?: string;
    onChange?: (value: string) => void;
    toolbar?: DisplayPosition;
    lang?: string;
    placeholder?: string;
    langCallback?: (() => string | undefined) | false;
    reload?: number;
    height?: string | number;
    disableLineWrapping?: boolean;
    disableBorder?: boolean;
    disableLineNumbers?: boolean;
    disableClear?: boolean;
    lineInfo?: boolean;
    children?: ReactNode;
}

export interface EditorRef {
    getEditor: () => monacoEditor.editor.IStandaloneCodeEditor | null;
    updateEditor: (text?: string) => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(function Editor(
    {
        value = "",
        onChange,
        toolbar = "bottom-right",
        lang = "text",
        placeholder = $t("main_ui_input"),
        langCallback = false,
        reload = 0,
        height = "100%",
        disableLineWrapping = false,
        disableBorder = false,
        disableLineNumbers = false,
        disableClear = false,
        lineInfo = false,
        children,
    },
    forwardedRef,
) {
    const storeTheme = useTheme();
    const theme = storeTheme.theme.raw;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange);
    const langRef = useRef(lang);
    const langCallbackRef = useRef(langCallback);
    const lineInfoRef = useRef(lineInfo);
    const themeRef = useRef(theme);
    const updateConfigRef = useRef<() => void>(() => undefined);

    valueRef.current = value;
    onChangeRef.current = onChange;
    langRef.current = lang;
    langCallbackRef.current = langCallback;
    lineInfoRef.current = lineInfo;
    themeRef.current = theme;

    const updateEditor = useCallback((text = "") => {
        const editor = editorRef.current;
        if (editor && editor.getValue() !== text) {
            editor.setValue(text);
        }
    }, []);

    const updateEditorConfig = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        configureLineInfo(editor).status(lineInfoRef.current);
        const model = editor.getModel();
        let selectedLanguage = langRef.current;
        if (langCallbackRef.current !== false) {
            selectedLanguage = langCallbackRef.current() || selectedLanguage;
        }
        if (model) {
            monacoInstance()?.editor.setModelLanguage(model, getEditorLanguage(selectedLanguage).id);
        }
        monacoInstance()?.editor.setTheme(themeRef.current === "dark" ? "vs-dark" : "vs");
        editor.render(true);
    }, []);

    updateConfigRef.current = updateEditorConfig;

    useImperativeHandle(
        forwardedRef,
        () => ({
            getEditor: () => editorRef.current,
            updateEditor,
        }),
        [updateEditor],
    );

    useEffect(() => {
        let active = true;
        const element = containerRef.current;
        if (!element) {
            return;
        }

        const clearHandler = () => updateEditor("");
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

            const editor = monaco.editor.create(element, {
                value: valueRef.current,
                minimap: { enabled: false },
                lineNumbers: disableLineNumbers ? "off" : "on",
                wordWrap: disableLineWrapping ? "off" : "on",
                language: getEditorLanguage(langRef.current).id,
                scrollbar: { verticalScrollbarSize: 5 },
                automaticLayout: true,
            });

            if (!active) {
                editor.dispose();
                return;
            }

            editor.onDidChangeModelContent(() => {
                const nextValue = editor.getValue();
                if (nextValue !== valueRef.current) {
                    onChangeRef.current?.(nextValue);
                }
            });

            new PlaceholderContentWidget(placeholder, editor);
            const contextMenu = new ContextMenu(editor);
            contextMenu.setHandle("ctool_line_wrapping", () => undefined);
            contextMenu.setHandle("ctool_line_number", () => undefined);
            configureLineInfo(editor).status(lineInfoRef.current);

            editorRef.current?.dispose();
            editorRef.current = editor;
            updateConfigRef.current();
        });

        return () => {
            active = false;
            if (!disableClear) {
                event.removeListener("content_clear", clearHandler);
            }
            editorRef.current?.dispose();
            editorRef.current = null;
        };
    }, []);

    useEffect(() => {
        updateEditor(value);
    }, [value, updateEditor]);

    useEffect(() => {
        updateEditorConfig();
    }, [theme, lang, reload, lineInfo, updateEditorConfig]);

    const className = disableBorder
        ? "ctool-code-editor ctool-code-editor-disable-border"
        : "ctool-code-editor";

    return (
        <Display
            position={toolbar}
            className={className}
            style={{ height: sizeConvert(height), width: "100%" }}
            toggle
            extra={children}
        >
            <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
        </Display>
    );
});

export default Editor;
