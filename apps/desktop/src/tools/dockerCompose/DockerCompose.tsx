import { useEffect, useMemo } from "react";
import { HeightResize, Textarea } from "@/components";
import { initialize, useAction } from "@/store/action";
import { composerize } from "composerize-ts";

const initial = await initialize(
    {
        input: "docker run -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --restart always --log-opt max-size=1g nginx",
    },
    { paste: false },
);

function DockerCompose() {
    const action = useAction(initial);
    const input = action.current.input;

    const output = useMemo(() => {
        const trimmed = input.trim();
        if (trimmed === "") {
            return "";
        }
        try {
            return composerize(trimmed).yaml;
        } catch (caught) {
            return $error(caught);
        }
    }, [input]);

    useEffect(() => {
        try {
            new URL(input);
            action.save();
        } catch {
            return;
        }
    }, [action, input]);

    return (
        <div className="ctool-generator-editor-family ctool-editor-page ctool-docker-compose-page">
        <HeightResize row="1-1">
            {({ height }) => (
                <>
                    <Textarea
                        value={input}
                        onChange={(value) => {
                            action.current.input = value;
                        }}
                        placeholder={$t("main_ui_input")}
                        height={height}
                    />
                    <Textarea
                        value={output}
                        readOnly
                        placeholder={$t("main_ui_output")}
                        height={height}
                    />
                </>
            )}
        </HeightResize>
        </div>
    );
}

export default DockerCompose;
