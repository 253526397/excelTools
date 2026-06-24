# exceltools

将 Excel 游戏配置表转换为 JSON 数据文件 + 加密 `.dat` 文件，并使用 Liquid 模板生成 6 种语言的代码。

## 快速开始

```bash
npm install
npm run build     # 编译
npm link          # 注册全局命令（可选，之后直接敲 exceltools）
```

### 双击使用

将 `exceltools.bat` 放到任意项目目录，编辑第一行的 `TOOLS_DIR` 指向本工程，双击即可。

## CLI 命令

### convert

```bash
exceltools convert <文件或目录> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-l, --lang` | 目标语言，逗号分隔 | 全部六种 |
| `-o, --output` | 输出根目录 | `./output` |
| `-c, --config` | 配置文件路径 | 自动搜索 `exceltools.config.json5` |
| `-s, --sheets` | 只处理指定工作表 | 全部 |
| `--json-only` | 只生成 JSON | `false` |
| `--code-only` | 只生成代码 | `false` |
| `--compact` | 压缩格式 JSON | `false` |
| `--dry-run` | 只检查不写文件 | `false` |
| `-v, --verbose` | 详细日志 | `false` |

### init

```bash
exceltools init [目录]
```

生成带完整注释的 `exceltools.config.json5`。

## Excel 表结构约定

以 `#` 或 `_` 开头的工作表自动跳过。默认行布局（0-based，可通过 `rowMapping` 配置调整）：

| 行 | 用途 | 说明 |
|----|------|------|
| 第1行 | 字段名 | 英文标识，不可重复 |
| 第2行 | 数据类型 | `int` `float` `string` `bool` `object` 或自定义枚举名 |
| 第3行 | 注释 | 中文说明 |
| 第4行+ | 数据 | 实际配置值 |

### 常量表（Config Sheet）

Sheet 名为 `Config` 的工作表按常量处理，结构为三列：

| key | type | value |
|-----|------|-------|
| MaxLevel | int | 100 |
| DefaultName | string | 未命名 |

生成 `ConfigConstants.ts` 文件，通过 `parseData` 从 JSON 加载，不硬编码值。

### 枚举

**零配置，全自动**。在类型行填写非基础类型名（如 `SkillType`），工具自动扫描所有数据表的该列，收集唯一值，按字母排序编号。`SkillType[]` 数组列也会自动拆分收集。

### 同名 Sheet 合并

多个 Excel 文件中有同名 Sheet 时，按第一列 key 去重合并，后面的覆盖前面的，字段取并集。

## 配置文件

使用 JSON5 格式（`//` 注释、尾逗号），`exceltools init` 一键生成。

```json5
{
  "rowMapping": {
    "fieldNames": 0,   // 字段名所在行
    "dataTypes": 1,    // 数据类型所在行（-1 = 全部默认 string）
    "comments": 2,     // 注释行（-1 = 无）
    "dataStart": 3,    // 数据起始行
  },
  "languages": ["typescript", "csharp", "java", "python", "go", "php"],
  "output": {
    "json": "./output/json",
    "code": "./output/code",
    "jsonFormat": "verbose",  // "verbose" | "compact"
    "mergeJson": false,       // false = 每表独立 / true = 合并到 config.json
  },
  "encrypt": {
    "enabled": false,         // 启用 AES 加密（JSON → .dat）
    "key": "exceltools2024",  // 加密密钥
  },
  "templates": { "customDir": null, "overrides": {} },
  "excludeSheets": [],
  "naming": {
    "sheetNameToTableName": "PascalCase",   // PascalCase | camelCase | snake_case | keep
    "fieldNameToPropertyName": "camelCase",
  },
  "languageSettings": {
    "typescript": { "generateEnums": true, "useStringEnum": false },
    "csharp": { "namespace": "GameConfig", "generateEnums": true, "useJsonProperty": true },
    "java": { "package": "com.game.config", "generateEnums": true },
    "python": { "generateEnums": true },
    "go": { "generateEnums": true },
    "php": { "generateEnums": true },
  },
  "autoDetectEnums": true,
  "verbose": false,
}
```

## 数据类型映射

| Excel | TS | C# | Java | Python | Go | PHP |
|--------|----|----|------|--------|----|----|
| `int` | `number` | `int` | `int` | `int` | `int` | `int` |
| `float` | `number` | `float` | `double` | `float` | `float64` | `float` |
| `string` | `string` | `string` | `String` | `str` | `string` | `string` |
| `bool` | `boolean` | `bool` | `boolean` | `bool` | `bool` | `bool` |
| `int[]` | `number[]` | `List<int>` | `List<Integer>` | `list[int]` | `[]int` | `array` |
| `int[][]` | `number[][]` | `List<List<int>>` | `List<List<Integer>>` | `list[list[int]]` | `[][]int` | `array` |
| `object` | `Record<string,unknown>` | `Dictionary<string,object>` | `Map<String,Object>` | `dict[str,Any]` | `map[string]interface{}` | `array` |

分隔符：`,` `;` `|`。二维数组 `;` 分行，`,`/`|` 分列。

## 输出结构

```
output/
├── json/
│   └── config.json            ← mergeJson=true 时合并（含 __constants__）
├── encrypt/
│   └── config.dat             ← 加密输出（encrypt.enabled=true 时）
└── code/
    ├── typescript/
    │   ├── Config.ts           ← 入口，Config.parseData(jsonStr)
    │   ├── ConfigEnums.ts      ← 所有枚举
    │   ├── ConfigConstants.ts  ← 常量（parseData 加载）
    │   └── {Table}.ts          ← I{Name} + 类 + dataMap + Get + Find + Meta
    ├── csharp/
    │   ├── Config.cs
    │   ├── ConfigEnums.cs
    │   └── ConfigConstants.cs
    ├── java/
    │   ├── Config.java         ← Java 枚举独立文件
    │   └── ConfigConstants.java
    ├── python/
    ├── go/
    └── php/
```

## 代码示例

```typescript
// ItemConfig.ts
export interface IItemConfig { id?: number; name?: string; ... }

export class ItemConfig {
  public static dataMap: Record<string, IItemConfig> = {};
  public static Get(key: number|string): IItemConfig | undefined { ... }
  public static Find(field: keyof IItemConfig, value: any): IItemConfig | undefined { ... }
}
export const ItemConfigMeta = { keyField: 'id', fieldNames: [...], };

// Config.ts — 泛型 loadTable 统一加载所有表 + 常量
Config.parseData(jsonStr);
// → ItemConfig.dataMap 自动填充
// → ConfigConstants.parseData 自动调用
```

## 自定义模板

模板位于 `liquidTemplate/`，目录结构：

```
liquidTemplate/
├── typescript/  (interface / enum / config / constant)
├── csharp/      (class / enum / config / constant)
├── java/        (class / enum / config / constant)
├── python/      (class / enum / config / constant)
├── go/          (struct / enum / config / constant)
└── php/         (class / enum / config / constant)
```

通过 `templates.customDir` 或 `-t` 指定自定义目录。

## 技术栈

TypeScript · [SheetJS](https://sheetjs.com/) · [LiquidJS](https://liquidjs.com/) · [commander](https://github.com/tj/commander.js) · [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) · [JSON5](https://json5.org/) · pako · crypto-js
