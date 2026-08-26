import { useEffect } from "react";
import { HeightResize, Select } from "@/components";
import { allLanguage } from "@/lib/code";
import { initialize, useAction } from "@/store/action";
import Diff from "@/components/editor/Diff";

type DataType = {
    original: string;
    modified: string;
    option: {
        lang: string;
    };
};

const initial = await initialize<DataType>(
    {
        original: "",
        modified: "",
        option: {
            lang: "Text",
        },
    },
    { paste: false },
);

function Diffs() {
    const action = useAction(initial);
    const original = action.current.original;
    const modified = action.current.modified;
    const lang = action.current.option.lang;

    useEffect(() => {
        if (original === "" || modified === "") {
            return;
        }
        action.save();
    }, [action, original, modified, lang]);

    return (
        <div className="ctool-generator-editor-family ctool-diff-editor-page">
        <HeightResize>
            {({ height }) => (
                <Diff
                    original={original}
                    onOriginalChange={(value) => {
                        action.current.original = value;
                    }}
                    modified={modified}
                    onModifiedChange={(value) => {
                        action.current.modified = value;
                    }}
                    lang={lang}
                    height={`${height}px`}
                >
                    <Select
                        size="small"
                        value={lang}
                        onChange={(value) => {
                            action.current.option.lang = value;
                        }}
                        options={allLanguage}
                    />
                </Diff>
            )}
        </HeightResize>
        </div>
    );
}

export default Diffs;
