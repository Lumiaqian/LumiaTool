import { useState } from "react";
import { Align, Button, Card, ExtendPage } from "@/components";
import { categories } from "@/config";
import type { CategoryInterface, FeatureInterface, FeatureType, ToolType } from "@/config";
import useOperate from "@/store/operate";
import useSetting from "@/store/setting";
import type { ComponentSizeType } from "@/types";
import Common from "./Common";

export default function Tools() {
    const operate = useOperate();
    const setting = useSetting();
    const [openCommon, setOpenCommon] = useState(false);
    const size: ComponentSizeType = "default";
    const recently: FeatureInterface[] = operate.getRecently().slice(0, 10);

    const selectTool = (tool: ToolType, category?: CategoryInterface, feature?: FeatureType) => {
        operate.redirectTool(
            tool,
            feature || operate.getToolLastFeature(tool),
            category ? category.name : "",
        );
    };

    return (
        <Align direction="vertical" className="lumia-tools-catalog">
            <Card
                title={$t("main_category_common")}
                extra={
                    <Button type="primary" text={$t("main_ui_setting")} onClick={() => setOpenCommon(true)} size="small" />
                }
            >
                <Align>
                    {setting.items.common.map((name) => (
                        <Button key={name} type="dotted" size={size} onClick={() => selectTool(name)}>
                            {$t(`tool_${name}`)}
                        </Button>
                    ))}
                </Align>
            </Card>

            <Card title={$t("main_recently_use")}>
                <Align>
                    {recently.map((item) => (
                        <Button
                            key={`${item.tool.name}-${item.name}`}
                            type="dotted"
                            size={size}
                            onClick={() => selectTool(item.tool.name, undefined, item.name)}
                        >
                            {`${$t(`tool_${item.tool.name}`)}${item.tool.isSimple() ? "" : ` - ${$t(`tool_${item.tool.name}_${item.name}`)}`}`}
                        </Button>
                    ))}
                </Align>
            </Card>

            {categories.map((category) => (
                <Card key={category.name} title={$t(`main_category_${category.name}`)}>
                    <Align>
                        {category.tools.flatMap((tool) => tool.features.map((feature) => (
                            <Button
                                key={`${category.name}-${tool.name}-${feature.name}`}
                                type="dotted"
                                size={size}
                                onClick={() => selectTool(tool.name, category, feature.name)}
                            >
                                {`${$t(`tool_${feature.tool.name}`)}${feature.tool.isSimple() ? "" : ` - ${$t(`tool_${feature.tool.name}_${feature.name}`)}`}`}
                            </Button>
                        )))}
                    </Align>
                </Card>
            ))}

            <ExtendPage value={openCommon} onChange={setOpenCommon} disableReplace hideClose>
                <Common onClose={() => setOpenCommon(false)} />
            </ExtendPage>
        </Align>
    );
}
