import { useCallback, useEffect, useRef } from "react";
import type { HTMLAttributes } from "react";
import type {
    ComponentSizeType,
    UploadFileButtonType,
    UploadFileMode,
    UploadFileType,
} from "@/types";
import Button from "./Button";
import Icon from "./Icon";

export interface UploadFileProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
    value?: string | File;
    type?: UploadFileType;
    mode?: UploadFileMode[];
    buttonType?: UploadFileButtonType;
    size?: ComponentSizeType;
    disabled?: boolean;
    onChange?: (value: string | File) => void;
    onSuccess?: (content: File) => void;
}

const UploadFile = ({
    value: _value = "",
    type = "file",
    mode = ["button", "paste"],
    buttonType = "icon",
    size = "default",
    disabled = false,
    onChange,
    onSuccess,
    ...nativeProps
}: UploadFileProps) => {
    const fileInput = useRef<HTMLInputElement>(null);
    void _value;

    const accept = type === "image" ? "image/*" : "*";

    const success = useCallback((file: File) => {
        onSuccess?.(file);
        onChange?.(file);
    }, [onChange, onSuccess]);

    const handleUpload = () => {
        const file = fileInput.current?.files?.[0];
        if (file) {
            success(file);
        }
    };

    useEffect(() => {
        const paste = (event: ClipboardEvent) => {
            if (!event.clipboardData || disabled) {
                return;
            }

            const items = event.clipboardData.items;
            const types = event.clipboardData.types ?? [];
            if (!items.length) {
                return;
            }

            for (let index = 0; index < items.length; index += 1) {
                const file = items[index].getAsFile();
                if (types[index] !== "Files" || !file) {
                    continue;
                }
                if (type === "image") {
                    if (items[index].type.includes("image")) {
                        success(file);
                    }
                } else {
                    success(file);
                }
            }
        };

        window.addEventListener("paste", paste);
        return () => {
            window.removeEventListener("paste", paste);
        };
    }, [disabled, success, type]);

    return (
        <>
            {mode.includes("button") ? (
                <div {...nativeProps} className={["ctool-upload", nativeProps.className].filter(Boolean).join(" ")}>
                    <Button
                        size={size}
                        disabled={disabled}
                        type="primary"
                        onClick={() => fileInput.current?.click()}
                    >
                        <Icon name="upload" />
                        {buttonType === "text" ? (
                            <span style={{ marginLeft: 5 }}>{$t(`component_upload_${type}`)}</span>
                        ) : null}
                    </Button>
                </div>
            ) : null}
            <div style={{ display: "none" }}>
                <input
                    ref={fileInput}
                    disabled={disabled}
                    type="file"
                    accept={accept}
                    onChange={handleUpload}
                />
            </div>
        </>
    );
};

export default UploadFile;
