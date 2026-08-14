import { useEffect, useRef } from "react";
import { HeightResize } from "@/components";
import { categoryExists, getCategory, toolExists, tools } from "@/config";
import useOperate from "@/store/operate";
import useSetting from "@/store/setting";

export default function Index() {
    const operate = useOperate();
    const setting = useSetting();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) {
            return;
        }
        initialized.current = true;

        const redirect = {
            tool: operate.items.tool || "",
            category: operate.items.category || "",
            feature: operate.items.feature || "",
        };

        if (!toolExists(redirect.tool) && categoryExists(redirect.category)) {
            redirect.tool = operate.getCategoryLastTool(redirect.category);
            if (!redirect.tool) {
                redirect.tool = getCategory(redirect.category).firstTool().name;
            }
        }

        if (!toolExists(redirect.tool)) {
            redirect.tool = setting.items.common.filter((item) => toolExists(item))[0] || "";
        }

        if (!toolExists(redirect.tool)) {
            redirect.tool = tools[0].name;
        }

        operate.redirectTool(redirect.tool, redirect.feature, redirect.category);
    }, []);

    return <HeightResize />;
}
