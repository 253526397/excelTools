# exceltools

将 Excel 游戏配置表转换为 JSON 数据文件，并使用 Liquid 模板自动生成 TypeScript / C# / Java 代码。

每个工作表（Sheet）生成一个对应的 `I{Name}` 接口 + `{Name}` 类，内嵌 `dataMap`（key-value 可遍历）、`Get(key)` 查询方法和 `parseData(obj)` 数据加载方法，并提供 `Config` 统一入口一键加载合并后的 JSON。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 编译
npm run build

# 3. 注册全局命令
npm link

# 4. 初始化配置文件（生成 exceltools.config.json5，带完整注释）
exceltools init

# 5. 转换 Excel 文件
exceltools convert ./GameConfig.xlsx
```

或使用开发模式（免编译）：

```bash
npx tsx bin/exceltools.ts init
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx
```

## CLI 命令

### convert — 转换 Excel 文件

```bash
exceltools convert <文件路径.xlsx> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-l, --lang <语言>` | 目标语言，逗号分隔：`typescript,csharp,java` | 全部三种 |
| `-o, --output <目录>` | 输出根目录 | `./output` |
| `-c, --config <路径>` | 指定配置文件路径（支持 .json5 / .json） | 自动搜索 |
| `-s, --sheets <名称>` | 只处理指定工作表，逗号分隔 | 全部工作表 |
| `-t, --templates <目录>` | 自定义 Liquid 模板目录 | 内置模板 |
| `--json-only` | 只生成 JSON，不生成代码 | `false` |
| `--code-only` | 只生成代码，不生成 JSON | `false` |
| `--compact` | 输出压缩格式 JSON（短键名 t/f/d，列式数据） | `false` |
| `--dry-run` | 只检查不写文件 | `false` |
| `-v, --verbose` | 详细日志 | `false` |

### init — 初始化配置文件

```bash
exceltools init [目录]
```

在当前目录（或指定目录）生成 `exceltools.config.json5` 配置文件（JSON5 格式，支持 `//` 注释和尾逗号）。

## Excel 表结构约定

每个工作表（Sheet）= 一张配置表。以 `#` 或 `_` 开头的工作表会被自动跳过。默认行布局（可通过配置调整）：

| 行 | 用途 | 说明 |
|----|------|------|
| 第1行（row 0） | 字段名 | 列的英文标识，不可重复、不可为空 |
| 第2行（row 1） | 数据类型 | `int` / `float` / `string` / `bool` / `object` / 自定义枚举名 |
| 第3行（row 2） | 注释/说明 | 字段的中文说明 |
| 第4行起（row 3） | 数据 | 实际配置值 |

### 支持的数据类型

| Excel 类型 | 说明 | TypeScript | C# | Java |
|-----------|------|-----------|-----|------|
| `int` | 整数 | `number` | `int` | `int` |
| `float` | 浮点数 | `number` | `float` | `double` |
| `string` | 字符串 | `string` | `string` | `String` |
| `bool` | 布尔值 | `boolean` | `bool` | `boolean` |
| `int[]` | 整数数组 | `number[]` | `List<int>` | `List<Integer>` |
| `float[]` | 浮点数数组 | `number[]` | `List<float>` | `List<Double>` |
| `string[]` | 字符串数组 | `string[]` | `List<string>` | `List<String>` |
| `bool[]` | 布尔数组 | `boolean[]` | `List<bool>` | `List<Boolean>` |
| `int[][]` | 二维整数数组 | `number[][]` | `List<List<int>>` | `List<List<Integer>>` |
| `float[][]` | 二维浮点数数组 | `number[][]` | `List<List<float>>` | `List<List<Double>>` |
| `string[][]` | 二维字符串数组 | `string[][]` | `List<List<string>>` | `List<List<String>>` |
| `bool[][]` | 二维布尔数组 | `boolean[][]` | `List<List<bool>>` | `List<List<Boolean>>` |
| `object` | JSON 对象 | `Record<string,unknown>` | `Dictionary<string,object>` | `Map<String,Object>` |
| `object[]` | JSON 对象数组 | `Record<string,unknown>[]` | `List<Dictionary<string,object>>` | `List<Map<String,Object>>` |

数组分隔符支持 `,` `;` `|`。二维数组用 `;` 分行，`,` 或 `|` 分列。

## 枚举系统

支持三种枚举定义方式，**零配置优先**，按优先级从高到低：

### 方式 1：配置文件精确定义（最高优先级）

在 `exceltools.config.json5` 的 `enums` 字段中手动定义，精确控制枚举值编号：

```json5
"enums": {
  "SkillType": { "Attack": 1, "Defense": 2, "Heal": 3, "Buff": 4 }
}
```

### 方式 2：Excel 专用枚举 Sheet

在 Excel 中新建一个与枚举名同名的 Sheet（如 `SkillType`），两列定义：

| name | value |
|------|-------|
| Attack | 1 |
| Defense | 2 |
| Heal | 3 |
| Buff | 4 |

### 方式 3：从数据列自动收集（零配置）

**什么都不用做**。只要在类型行写了一个非基础类型的名字（如 `SkillType`），工具就会自动扫描所有数据表中该类型列出现过的所有值，按字母排序自动编号。`SkillType[]` 数组列的值也会自动拆分收集。

## 配置文件

配置文件使用 **JSON5** 格式（支持 `//` 注释、尾逗号），命名为 `exceltools.config.json5`（也兼容旧的 `.json` 文件）。通过 `exceltools init` 可生成带完整中文注释的模板。

### 完整配置项

```json5
{
  // Excel 行映射（0-based，即第1行 = 0）
  "rowMapping": {
    "fieldNames": 0,   // 字段名所在行
    "dataTypes": 1,    // 数据类型所在行
    "comments": 2,     // 注释说明所在行（-1 表示无注释行）
    "dataStart": 3,    // 数据起始行
  },

  // 默认生成的目标语言
  "languages": ["typescript", "csharp", "java"],

  // 输出目录配置
  "output": {
    "json": "./output/json",   // JSON 输出目录
    "code": "./output/code",   // 代码输出目录
    "jsonFormat": "verbose",   // "verbose" = 完整结构 / "compact" = 压缩短键名
    "mergeJson": false,        // false = 每表独立文件 / true = 所有表合并到 config.json
  },

  // 模板配置
  "templates": {
    "customDir": null,  // 自定义模板目录（null = 使用内置模板）
    "overrides": {},    // 单独覆盖某个模板文件
  },

  // 全局枚举注册表（可留空 {}，工具会自动从 Excel 检测枚举）
  "enums": {},

  // 排除的工作表名称
  "excludeSheets": [],

  // 命名风格：PascalCase | camelCase | snake_case | keep
  "naming": {
    "sheetNameToTableName": "PascalCase",
    "fieldNameToPropertyName": "camelCase",
  },

  // 各语言专属设置
  "languageSettings": {
    "typescript": {
      "generateEnums": true,
      "useStringEnum": false,
    },
    "csharp": {
      "namespace": "GameConfig",
      "generateEnums": true,
      "useJsonProperty": true,
    },
    "java": {
      "package": "com.game.config",
      "generateEnums": true,
      "useLombok": false,
      "useJackson": false,
    },
  },

  // 是否从 Excel 自动检测枚举（推荐开启）
  "autoDetectEnums": true,

  // 默认详细日志
  "verbose": false,
}
```

配置优先级：**CLI 参数 > 配置文件 > 内置默认值**

## 输出结构

转换一个包含 `SkillConfig`、`ItemConfig`、`LevelConfig` 三张表的 Excel 文件后，输出目录如下：

```
output/
├── json/
│   ├── config.json          ← mergeJson=true 时合并输出
│   └── (或 SkillConfig.json, ItemConfig.json, LevelConfig.json)
└── code/
    ├── typescript/
    │   ├── Config.ts         ← 统一入口，Config.parseData(jsonStr)
    │   ├── ConfigEnums.ts    ← 所有枚举合并
    │   ├── SkillConfig.ts    ← ISkillConfig + SkillConfig + dataMap + Get + parseData
    │   ├── ItemConfig.ts
    │   └── LevelConfig.ts
    ├── csharp/
    │   ├── Config.cs
    │   ├── ConfigEnums.cs
    │   ├── SkillConfig.cs
    │   ├── ItemConfig.cs
    │   └── LevelConfig.cs
    └── java/
        ├── Config.java
        ├── SkillType.java    ← Java 枚举保持独立文件
        ├── SkillConfig.java
        ├── ItemConfig.java
        └── LevelConfig.java
```

### 生成的代码结构（以 TypeScript 为例）

```typescript
// SkillConfig.ts
import { SkillType } from './ConfigEnums';

// 接口
export interface ISkillConfig {
  id?: number;
  name?: string;
  damage?: number;
  skillType?: SkillType;
  targetTypes: SkillType[] = [];
}

// 数据类
export class SkillConfig implements ISkillConfig {
  id?: number;
  name?: string;
  damage?: number;
  skillType?: SkillType;
  targetTypes: SkillType[] = [];

  private static _dataMap: Record<string, ISkillConfig> = {};

  /** 数据 Map（key = id，可遍历） */
  public static get dataMap(): Record<string, ISkillConfig> {
    return SkillConfig._dataMap;
  }

  /** 根据 id 查询 */
  public static Get(key: number | string): ISkillConfig | undefined {
    return SkillConfig.dataMap[String(key)];
  }

  /** 从 JSON 加载（兼容 verbose / compact / 纯数组格式） */
  public static parseData(obj: any): void { ... }
}
```

```typescript
// Config.ts — 统一入口
import { SkillConfig } from './SkillConfig';
import { ItemConfig } from './ItemConfig';
import { LevelConfig } from './LevelConfig';

export class Config {
  public static parseData(jsonStr: string): void {
    const allData = JSON.parse(jsonStr);
    SkillConfig.parseData(allData['SkillConfig']);
    ItemConfig.parseData(allData['ItemConfig']);
    LevelConfig.parseData(allData['LevelConfig']);
  }
}
```

### 使用方式

```typescript
import { Config } from './output/code/typescript/Config';
import { ItemConfig } from './output/code/typescript/ItemConfig';
import * as fs from 'fs';

// 1. 加载合并后的 JSON
const jsonStr = fs.readFileSync('./output/json/config.json', 'utf-8');
Config.parseData(jsonStr);

// 2. 按 key 查询
const item = ItemConfig.Get(2001);
console.log(item?.name); // "生命药水"

// 3. 遍历全部数据
for (const key of Object.keys(ItemConfig.dataMap)) {
  console.log(key, ItemConfig.dataMap[key]?.name);
}
```

## JSON 输出格式

### verbose（默认）

```json
{
  "SkillConfig": {
    "tableName": "SkillConfig",
    "sourceSheet": "SkillConfig",
    "fields": [
      { "name": "id", "type": "int", "comment": "技能ID" },
      { "name": "name", "type": "string", "comment": "技能名称" }
    ],
    "data": [
      { "id": 1001, "name": "火球术" }
    ]
  }
}
```

### compact（`--compact` 或配置 `jsonFormat: "compact"`）

```json
{
  "SkillConfig": {
    "t": "SkillConfig",
    "f": [["id", "int", "技能ID"], ["name", "string", "技能名称"]],
    "d": [[1001, "火球术"]]
  }
}
```

`parseData` 方法自动兼容两种格式。

## 自定义模板

内置模板位于 `src/templates/builtin/`：

```
builtin/
├── typescript/
│   ├── interface.liquid    ← I{Name} 接口 + 类 + dataMap + Get + parseData
│   ├── enum.liquid         ← 合并枚举文件
│   └── config.liquid       ← Config 入口
├── csharp/
│   ├── class.liquid        ← I{Name} 接口 + 类 + Data + Get + ParseData
│   ├── enum.liquid
│   └── config.liquid
└── java/
    ├── class.liquid        ← I{Name} 接口 + 类 + Data + get + parseData
    ├── enum.liquid
    └── config.liquid
```

自定义模板目录结构与内置模板一致即可，通过配置 `templates.customDir` 或 `-t` 参数指定。

### 模板变量

**interface/class 模板**可用变量：

| 变量 | 类型 | 说明 |
|------|------|------|
| `tableName` | string | 表名 |
| `sourceFile` | string | 源 Excel 文件名 |
| `generatedAt` | string | 生成时间（ISO 格式） |
| `namespace` | string \| null | 命名空间（C#） |
| `package` | string \| null | 包名（Java） |
| `importedEnums` | string[] | 本表引用的枚举名列表 |
| `enumFileName` | string | 枚举文件名（TS/CS: `ConfigEnums`） |
| `keyField` | Field | key 字段信息 |
| `keyFieldName` | string | key 字段属性名（camelCase） |
| `keyType` | string | key 字段映射类型 |
| `fieldNames` | string | 字段名 JSON 数组 |
| `fields` | Field[] | 字段列表 |

**Field 对象：**

| 属性 | 说明 |
|------|------|
| `name` | 原始字段名 |
| `type` | 原始类型声明 |
| `comment` | 注释 |
| `isArray` / `is2DArray` / `isEnum` / `isNested` | 类型标记 |
| `mappedType` | 目标语言类型 |
| `defaultValue` | 目标语言默认值 |
| `propertyName` | camelCase 属性名 |
| `pascalName` | PascalCase 属性名 |

**enum 模板**可用变量：

| 变量 | 说明 |
|------|------|
| `enums` | `[{ name, values: [{ name, value }] }]` — 所有枚举 |
| `enumName` | 单个枚举名（Java 独立文件模式） |
| `values` | 单个枚举值列表（Java 独立文件模式） |

## 项目脚本

```bash
npm run dev          # 开发模式运行 CLI（tsx）
npm run build        # TypeScript 编译
npm test             # 运行测试
npm link             # 全局注册 exceltools 命令
```

## 技术栈

- TypeScript
- [xlsx](https://sheetjs.com/) — Excel 解析
- [LiquidJS](https://liquidjs.com/) — 模板引擎
- [commander](https://github.com/tj/commander.js) — CLI 框架
- [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) — 配置加载
- [json5](https://json5.org/) — JSON5 配置解析
