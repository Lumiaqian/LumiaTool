import { useEffect } from "react";
import { isObject } from "lodash";
import Content from "@/app/Content";
import ComplexHeader from "@/app/layout/Header";
import Message from "@/lib/message";
import { useTheme } from "@/store/setting";

const messageForError = (error: unknown) => {
    if (isObject(error) && "message" in error) {
        return String(error.message);
    }
    return String(error);
};

const reportError = (error: unknown) => {
    console.error("error:", error);
    const message = messageForError(error);
    Message.closeAll();
    Message.error(message, { duration: message.includes("\n") ? 0 : 5000 });
};

export default function App() {
    useTheme();

    useEffect(() => {
        const rejectionHandler = (event: PromiseRejectionEvent) => {
            event.preventDefault();
            reportError(event.reason);
        };
        const errorHandler = (event: ErrorEvent) => {
            event.preventDefault();
            reportError(event.error ?? event.message);
        };
        window.addEventListener("unhandledrejection", rejectionHandler);
        window.addEventListener("error", errorHandler);
        return () => {
            window.removeEventListener("unhandledrejection", rejectionHandler);
            window.removeEventListener("error", errorHandler);
        };
    }, []);

    return (
        <div className="lumia-global lumia-layout-desktop">
            <a className="lumia-skip-link" href="#lumia-main-content">
                {$t("main_workbench_skip")}
            </a>
            <ComplexHeader />
            <Content />
        </div>
    );
}
