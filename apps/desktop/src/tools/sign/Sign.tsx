import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Select, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import rs from "jsrsasign";

const initial = await initialize({
    signData: "",
    privateKey: "",
    publicKey: "",
    verifyCode: "",
    algorithm: "MD5withRSA",
}, { paste: false });

const algorithm = ["MD5withRSA", "SHA1withRSA", "SHA256withRSA", "SHA512withRSA"];

const generateKeypairType = [
    { value: "PKCS8PRV", label: "PKCS#8" },
    { value: "PKCS1PRV", label: "PKCS#1" },
];

const generateKeypairLength = [
    { value: 512, label: "512 bit" },
    { value: 1024, label: "1024 bit" },
    { value: 2048, label: "2048 bit" },
    { value: 4096, label: "4096 bit" },
];

type GenerateKeypairMessage = {
    method: "generate_keypair";
    data: {
        public_key: string;
        private_key: string;
    };
};

export default function Sign() {
    const action = useAction(initial);
    const workerRef = useRef<Worker | null>(null);
    const [generateKeypair, setGenerateKeypair] = useState({
        show: false,
        loading: false,
        length: 1024,
        type: "PKCS8PRV",
    });

    const generateKeypairCallback = useCallback((publicKey: string, privateKey: string) => {
        setGenerateKeypair(current => ({ ...current, show: false, loading: false }));
        action.current.privateKey = privateKey;
        action.current.publicKey = publicKey;
    }, [action]);

    useEffect(() => {
        const worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
        workerRef.current = worker;
        worker.onmessage = (event: MessageEvent<GenerateKeypairMessage>) => {
            const data = event.data;
            console.log("main accept", data);
            if (data.method === "generate_keypair") {
                generateKeypairCallback(data.data.public_key, data.data.private_key);
            }
        };
        return () => {
            workerRef.current = null;
            worker.terminate();
        };
    }, [generateKeypairCallback]);

    const workerPost = useCallback((method: string, data: Record<string, string | number>) => {
        const send = { method, data };
        console.log("main send", send);
        workerRef.current?.postMessage(send);
    }, []);

    const generateKeypairExecute = useCallback(() => {
        setGenerateKeypair(current => ({ ...current, loading: true }));
        workerPost("generate_keypair", {
            type: generateKeypair.type,
            length: generateKeypair.length,
        });
    }, [generateKeypair.length, generateKeypair.type, workerPost]);

    const sign = useCallback(() => {
        try {
            if (!action.current.signData || !action.current.privateKey) return;
            const rsaPrivateKey = rs.KEYUTIL.getKey(action.current.privateKey);
            const signature = new rs.KJUR.crypto.Signature({ alg: action.current.algorithm });
            signature.init(rsaPrivateKey);
            signature.updateString(action.current.signData);
            action.current.verifyCode = rs.hextob64(signature.sign());
            action.success({ copy_text: action.current.verifyCode });
        } catch (error) {
            action.current.verifyCode = $error(error);
        }
    }, [action]);

    const verify = useCallback(() => {
        try {
            if (!action.current.verifyCode || !action.current.publicKey) return;
            const rsaPublicKey = rs.KEYUTIL.getKey(action.current.publicKey);
            const signature = new rs.KJUR.crypto.Signature({ alg: action.current.algorithm });
            signature.init(rsaPublicKey);
            signature.updateString(action.current.signData);
            const hexData = rs.b64tohex(action.current.verifyCode);
            if (!signature.verify(hexData)) {
                action.success({ message: $t("sign_verify_fail"), message_type: "error", is_save: false });
                return;
            }
            action.success({ message: $t("sign_verify_ok") });
        } catch (error) {
            action.success({ message: $error(error), message_type: "error", is_save: false });
        }
    }, [action]);

    const keypairModal = useMemo(() => (
        <Modal
            title={$t("sign_generate_keypair")}
            loading={generateKeypair.loading}
            value={generateKeypair.show}
            onChange={(show: boolean) => setGenerateKeypair(current => ({ ...current, show }))}
            width={550}
            footerType="long"
            onOk={generateKeypairExecute}
        >
            <div className="lumia-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Select
                    size="large"
                    options={generateKeypairType}
                    value={generateKeypair.type}
                    onChange={(type: string) => setGenerateKeypair(current => ({ ...current, type }))}
                    label={$t("sign_keypair_type")}
                />
                <Select
                    size="large"
                    options={generateKeypairLength}
                    value={generateKeypair.length}
                    onChange={(length: number) => setGenerateKeypair(current => ({ ...current, length }))}
                    label={$t("sign_keypair_length")}
                />
            </div>
        </Modal>
    ), [generateKeypair, generateKeypairExecute]);

    return (
        <div className="lumia-sign-page">
            <section className="lumia-sign-toolbar" aria-label={$t("main_ui_setting")}>
                <Select
                    label={$t("main_ui_setting")}
                    options={algorithm}
                    value={action.current.algorithm}
                    onChange={(value: string) => { action.current.algorithm = value; }}
                />
                <Button
                    text={$t("sign_generate_keypair")}
                    onClick={() => setGenerateKeypair(current => ({ ...current, show: true }))}
                />
            </section>
            <div className="lumia-sign-workspace">
                <section className="lumia-tester-panel lumia-sign-data-panel" aria-labelledby="lumia-sign-data-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-sign-data-title">{$t("sign_sign_data")}</strong>
                        {action.current.signData !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.signData)} />
                        )}
                    </header>
                    <div className="lumia-sign-editor">
                        <Textarea
                            height="100%"
                            value={action.current.signData}
                            onChange={(value: string) => { action.current.signData = value; }}
                            placeholder={$t("sign_sign_data")}
                        />
                    </div>
                    <footer className="lumia-sign-actions">
                        <Button
                            type="primary"
                            text={$t("sign_sign")}
                            disabled={!action.current.signData || !action.current.privateKey}
                            onClick={sign}
                        />
                    </footer>
                </section>
                <section className="lumia-tester-panel lumia-sign-result-panel" aria-labelledby="lumia-sign-result-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-sign-result-title">{$t("sign_verify_code")}</strong>
                        {action.current.verifyCode !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.verifyCode)} />
                        )}
                    </header>
                    <div className="lumia-sign-editor">
                        <Textarea
                            height="100%"
                            value={action.current.verifyCode}
                            onChange={(value: string) => { action.current.verifyCode = value; }}
                            placeholder={$t("sign_verify_code")}
                        />
                    </div>
                    <footer className="lumia-sign-actions">
                        <Button
                            type="primary"
                            text={$t("sign_verify")}
                            disabled={!action.current.verifyCode || !action.current.publicKey}
                            onClick={verify}
                        />
                    </footer>
                </section>
                <section className="lumia-tester-panel lumia-sign-key-panel" aria-labelledby="lumia-sign-public-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-sign-public-title">{$t("sign_public_key")}</strong>
                        {action.current.publicKey !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.publicKey)} />
                        )}
                    </header>
                    <div className="lumia-sign-editor">
                        <Textarea
                            height="100%"
                            value={action.current.publicKey}
                            onChange={(value: string) => { action.current.publicKey = value; }}
                            placeholder={$t("sign_public_key")}
                        />
                    </div>
                </section>
                <section className="lumia-tester-panel lumia-sign-key-panel" aria-labelledby="lumia-sign-private-title">
                    <header className="lumia-tester-panel-header">
                        <strong id="lumia-sign-private-title">{$t("sign_private_key")}</strong>
                        {action.current.privateKey !== "" && (
                            <Button size="small" text={$t("main_ui_copy")} onClick={() => $copy(action.current.privateKey)} />
                        )}
                    </header>
                    <div className="lumia-sign-editor">
                        <Textarea
                            height="100%"
                            value={action.current.privateKey}
                            onChange={(value: string) => { action.current.privateKey = value; }}
                            placeholder={$t("sign_private_key")}
                        />
                    </div>
                </section>
            </div>
            {keypairModal}
        </div>
    );
}
