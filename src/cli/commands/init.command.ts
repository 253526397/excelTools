import * as fs from 'fs';
import * as path from 'path';
import { info, error } from '../../utils/logger';

const DEFAULT_CONFIG_JSON5 = `{
  // ============================================================
  //  Excel → JSON + 代码 转换工具 配置文件
  //  支持 JSON5 语法：可使用 // 注释、尾逗号
  // ============================================================

  // Excel 行映射：定义第几行分别是什么（0-based，即第1行 = 0）
  "rowMapping": {
    "fieldNames": 0,   // 字段名所在行（列英文标识，不可重复）
    "dataTypes": 1,    // 数据类型所在行（int / float / string / bool / object / 枚举名）
    "comments": 2,     // 注释说明所在行（中文描述，-1 表示无注释行）
    "dataStart": 3,    // 数据起始行（从第几行开始读取实际数据）
  },

  // 默认生成的目标语言
  "languages": [
    "typescript",
    "csharp",
    "java",
  ],

  // 输出目录配置
  "output": {
    "json": "./output/json",   // JSON 数据文件输出目录
    "code": "./output/code",   // 代码文件输出目录
    // jsonFormat: "verbose" | "compact"
    //   verbose = 完整结构（tableName + fields + data），带缩进
    //   compact = 压缩格式（短键名 t/f/d），适合程序加载
    "jsonFormat": "verbose",
    // mergeJson: 是否将所有表的 JSON 合并输出到一个文件
    //   false = 每个表独立 .json 文件（默认）
    //   true  = 所有表合并到 config.json（按表名索引）
    "mergeJson": false,
  },

  // 模板配置
  "templates": {
    "customDir": null,  // 自定义模板目录（null = 使用内置模板）
    "overrides": {},    // 单独覆盖某个模板文件: { "typescript/interface.liquid": "路径" }
  },

  // 枚举自动检测：工具会从数据列中自动收集枚举值并按字母排序编号
  // 只需在类型行写枚举名（如 SkillType），无需额外配置

  // 排除的工作表名称（不会被解析为数据表）
  "excludeSheets": [],

  // 命名风格：sheetNameToTableName（表名→类名） / fieldNameToPropertyName（字段→属性名）
  // 可选值: "PascalCase" | "camelCase" | "snake_case" | "keep"
  "naming": {
    "sheetNameToTableName": "PascalCase",
    "fieldNameToPropertyName": "camelCase",
  },

  // 各语言专属设置
  "languageSettings": {
    "typescript": {
      "generateEnums": true,     // 是否生成枚举
      "useStringEnum": false,    // 是否使用字符串枚举（false = 数值枚举）
    },
    "csharp": {
      "namespace": "GameConfig", // 命名空间
      "generateEnums": true,
      "useJsonProperty": true,   // 是否添加 [JsonProperty] 特性
    },
    "java": {
      "package": "com.game.config", // 包名
      "generateEnums": true,
      "useLombok": false,           // 是否使用 Lombok 注解
      "useJackson": false,          // 是否使用 Jackson 注解
    },
  },

  // 是否从 Excel 自动检测枚举定义（推荐开启）
  "autoDetectEnums": true,

  // 是否默认输出详细日志（等同于 -v 参数）
  "verbose": false,
}
`;

export function initCommand(outputDir?: string): void {
  const targetDir = outputDir ? path.resolve(outputDir) : process.cwd();
  const configPath = path.join(targetDir, 'exceltools.config.json5');

  if (fs.existsSync(configPath)) {
    error(`配置文件已存在: ${configPath}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(configPath, DEFAULT_CONFIG_JSON5, 'utf-8');
  info(`已创建配置文件: ${configPath}`);
}
