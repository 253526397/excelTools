# exceltools

将 Excel 游戏配置表转换为 JSON 数据文件，并使用 Liquid 模板自动生成 TypeScript / C# / Java 代码。

## 快速开始

```bash
# 安装依赖
npm install

# 初始化配置文件（可选，会生成带默认值的 exceltools.config.json）
npx tsx bin/exceltools.ts init

# 转换 Excel 文件
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx
```

## CLI 命令

### convert — 转换 Excel 文件

```bash
npx tsx bin/exceltools.ts convert <文件路径.xlsx> [选项]
```

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-l, --lang <语言>` | 目标语言，逗号分隔：`typescript,csharp,java` | 全部三种 |
| `-o, --output <目录>` | 输出根目录 | `./output` |
| `-c, --config <路径>` | 指定配置文件路径 | 自动搜索 |
| `-s, --sheets <名称>` | 只处理指定工作表，逗号分隔 | 全部工作表 |
| `-t, --templates <目录>` | 自定义 Liquid 模板目录 | 内置模板 |
| `--json-only` | 只生成 JSON，不生成代码 | `false` |
| `--code-only` | 只生成代码，不生成 JSON | `false` |
| `--dry-run` | 只检查不写文件 | `false` |
| `-v, --verbose` | 详细日志 | `false` |

**示例：**

```bash
# 全量转换（JSON + 三种语言代码）
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx

# 只生成 TypeScript
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx --lang typescript -o ./src/generated

# 只处理指定工作表
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx --sheets SkillConfig,ItemConfig

# 预览模式（不写文件）
npx tsx bin/exceltools.ts convert ./GameConfig.xlsx --dry-run -v
```

### init — 初始化配置文件

```bash
npx tsx bin/exceltools.ts init [目录]
```

在当前目录（或指定目录）生成 `exceltools.config.json` 配置文件。

## Excel 表结构约定

每个工作表（Sheet）= 一张配置表。默认行布局如下（可通过配置调整）：

| 行 | 用途 | 示例 |
|----|------|------|
| 第1行 | 字段名 | `id`, `name`, `damage`, `skillType` |
| 第2行 | 数据类型 | `int`, `string`, `float`, `bool`, 自定义枚举名 |
| 第3行 | 注释/说明 | `技能唯一ID`, `技能名称`, ... |
| 第4行+ | 数据 | `1001`, `火球术`, `150`, ... |

### 支持的数据类型

| Excel 类型 | 说明 | 示例值 |
|-----------|------|--------|
| `int` | 整数 | `100` |
| `float` | 浮点数 | `3.14` |
| `string` | 字符串 | `火球术` |
| `bool` | 布尔值 | `true` 或 `1` |
| `int[]` | 整数数组（分隔符 `,` `;` `\|`） | `1,2,3` |
| `float[]` | 浮点数数组 | `1.5,2.3` |
| `string[]` | 字符串数组 | `attack,defense` |
| `bool[]` | 布尔数组 | `true,false` |
| `int[][]` | 二维整数数组（`;` 分行，`,`/`\|` 分列） | `1,2;3,4` |
| `float[][]` | 二维浮点数数组 | `1.5,2.3;3.0,4.0` |
| `string[][]` | 二维字符串数组 | `a,b;c,d` |
| `bool[][]` | 二维布尔数组 | `true,false;true,true` |
| `object` | JSON 对象 | `{"hp":100}` |
| `object[]` | JSON 对象数组 | `[{"hp":100},{"mp":50}]` |
| 自定义名称 | 枚举类型（需在配置中定义） | `Attack` |

## 配置文件

`exceltools.config.json` 完整配置项：

```json
{
  "rowMapping": {
    "fieldNames": 0,
    "dataTypes": 1,
    "comments": 2,
    "dataStart": 3
  },
  "languages": ["typescript", "csharp", "java"],
  "output": {
    "json": "./output/json",
    "code": "./output/code"
  },
  "enums": {
    "SkillType": {
      "Attack": 1,
      "Defense": 2,
      "Heal": 3,
      "Buff": 4
    }
  },
  "excludeSheets": [],
  "naming": {
    "sheetNameToTableName": "PascalCase",
    "fieldNameToPropertyName": "camelCase"
  },
  "templates": {
    "customDir": null,
    "overrides": {}
  },
  "languageSettings": {
    "typescript": {
      "generateEnums": true,
      "useStringEnum": false
    },
    "csharp": {
      "namespace": "GameConfig",
      "generateEnums": true,
      "useJsonProperty": true
    },
    "java": {
      "package": "com.game.config",
      "generateEnums": true,
      "useLombok": false,
      "useJackson": false
    }
  }
}
```

### 配置项说明

- **rowMapping**：自定义 Excel 中字段名/类型/注释/数据所在的行号（0 基准）。例如你的表第1行是类型、第2行是字段名，则设置 `"fieldNames": 1, "dataTypes": 0`
- **enums**：全局枚举注册表。key 是枚举类型名，value 是 `{ 枚举项名: 数值 }` 的映射。配置后工具会自动检测引用该枚举类型的字段并生成对应的枚举代码文件
- **excludeSheets**：跳过的工作表名称列表（如 `#Internal`, `Changelog`）
- **naming**：命名风格转换。`sheetNameToTableName` 控制表名 → 类名/接口名；`fieldNameToPropertyName` 控制字段名 → 属性名
- **templates.customDir**：自定义 Liquid 模板目录。目录结构需与内置模板一致（`typescript/interface.liquid` 等）
- **languageSettings**：各语言的专属设置（命名空间、包名、是否生成 Lombok/Jackson 注解等）

## 自定义模板

内置模板位于 `src/templates/builtin/`，也可通过配置指定自定义模板目录。模板目录结构：

```
custom-templates/
├── typescript/
│   ├── interface.liquid
│   └── enum.liquid
├── csharp/
│   ├── class.liquid
│   └── enum.liquid
└── java/
    ├── class.liquid
    └── enum.liquid
```

模板引擎使用 [LiquidJS](https://liquidjs.com/)。每个模板可访问以下变量：

### interface/class 模板变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `tableName` | string | 表名 |
| `sourceFile` | string | 源 Excel 文件名 |
| `generatedAt` | string | 生成时间（ISO 格式） |
| `namespace` | string \| null | C# 命名空间 |
| `package` | string \| null | Java 包名 |
| `fields` | Field[] | 字段列表 |

**Field 对象：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | string | 原始字段名 |
| `type` | string | 原始类型 |
| `comment` | string | 注释 |
| `isArray` | boolean | 是否为一维数组 |
| `is2DArray` | boolean | 是否为二维数组 |
| `isEnum` | boolean | 是否为枚举类型 |
| `mappedType` | string | 映射到目标语言的类型 |
| `defaultValue` | string | 目标语言的默认值 |
| `propertyName` | string | 转换为命名风格的属性名 |
| `pascalName` | string | PascalCase 命名 |

### enum 模板变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `enumName` | string | 枚举名称 |
| `values` | {name, value}[] | 枚举值列表 |
| `sourceFile` | string | 源 Excel 文件名 |
| `namespace` / `package` | string \| null | 命名空间/包名 |

## 类型映射表

| Excel 类型 | TypeScript | C# | Java |
|-----------|-----------|-----|------|
| `int` | `number` | `int` | `int` |
| `float` | `number` | `float` | `double` |
| `string` | `string` | `string` | `String` |
| `bool` | `boolean` | `bool` | `boolean` |
| `int[]` | `number[]` | `List<int>` | `List<Integer>` |
| `float[]` | `number[]` | `List<float>` | `List<Double>` |
| `string[]` | `string[]` | `List<string>` | `List<String>` |
| `bool[]` | `boolean[]` | `List<bool>` | `List<Boolean>` |
| `int[][]` | `number[][]` | `List<List<int>>` | `List<List<Integer>>` |
| `float[][]` | `number[][]` | `List<List<float>>` | `List<List<Double>>` |
| `string[][]` | `string[][]` | `List<List<string>>` | `List<List<String>>` |
| `bool[][]` | `boolean[][]` | `List<List<bool>>` | `List<List<Boolean>>` |
| `object` | `Record<string,unknown>` | `Dictionary<string,object>` | `Map<String,Object>` |
| 自定义枚举 | 枚举名 | 枚举名 | 枚举名 |

## 输出示例

输入 Excel 表 `SkillConfig`（技能配置表）：

| id | name | damage | skillType |
|----|------|--------|-----------|
| int | string | float | SkillType |
| 技能ID | 技能名称 | 伤害值 | 技能类型 |
| 1001 | 火球术 | 150 | Attack |

### JSON 输出

```json
{
  "tableName": "SkillConfig",
  "fields": [
    { "name": "id", "type": "int", "comment": "技能ID" },
    { "name": "name", "type": "string", "comment": "技能名称" }
  ],
  "data": [
    { "id": 1001, "name": "火球术", "damage": 150, "skillType": "Attack" }
  ]
}
```

### TypeScript 输出

```typescript
export enum SkillType {
  Attack = 1,
  Defense = 2,
  Heal = 3,
  Buff = 4,
}

export interface SkillConfig {
  /** 技能ID */
  id?: number;
  /** 技能名称 */
  name?: string;
  /** 伤害值 */
  damage?: number;
  /** 技能类型 */
  skillType?: SkillType;
}
```

### C# 输出

```csharp
namespace GameConfig
{
    public enum SkillType
    {
        Attack = 1,
        Defense = 2,
        Heal = 3,
        Buff = 4,
    }

    public class SkillConfig
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public float Damage { get; set; }
        public SkillType SkillType { get; set; }
    }
}
```

### Java 输出

```java
package com.game.config;

public enum SkillType {
    Attack(1),
    Defense(2),
    Heal(3),
    Buff(4);

    private final int value;
    SkillType(int value) { this.value = value; }
    public int getValue() { return value; }
}

public class SkillConfig {
    private int id;
    private String name;
    private double damage;
    private SkillType skillType;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    // ... 其余 getters/setters
}
```

## 项目脚本

```bash
npm run dev          # 开发模式运行 CLI
npm run build        # TypeScript 编译
npm test             # 运行测试
```

## 技术栈

- TypeScript
- [xlsx](https://sheetjs.com/) — Excel 解析
- [LiquidJS](https://liquidjs.com/) — 模板引擎
- [commander](https://github.com/tj/commander.js) — CLI 框架
- [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) — 配置加载
