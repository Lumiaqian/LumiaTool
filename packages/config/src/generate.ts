import { buildI18n } from "./generate/i18n";
import { buildRoute } from "./generate/router";
import { buildKeywords } from "./generate/keyword";
import { buildIcon } from "./generate/icon";
import { buildData, buildType } from "./generate/fileSystem";

// 路由配置文件
buildRoute();

// 语言包
buildI18n();

// 关键字
buildKeywords();

// icon
buildIcon();

// 编译数据写入
buildData.write();
buildType.write();
