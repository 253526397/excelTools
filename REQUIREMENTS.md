# 需求文档：Excel → JSON + 代码 转换工具

## 项目概述

开发一个 CLI 工具，将游戏配置 Excel 表（.xlsx）转换为 JSON 数据文件，并基于表结构使用 Liquid 模板引擎自动生成多种目标语言的代码文件。

## 技术栈

- 工具语言：Node.js + TypeScript
- Excel 解析：xlsx (SheetJS)
- 模板引擎：liquidjs (Liquid)
- CLI 框架：commander
- 配置加载：cosmiconfig

## 功能需求

### 1. Excel 解析

- 支持读取 `.xlsx` 格式的 Excel 文件
- 每个工作表（Sheet）对应一张配置表
- 自动跳过以 `#` 或 `_` 开头的工作表（内部表/引用表）
- 支持通过配置文件排除指定工作表
- 自动跳过空行、空列
- 可配置的行映射，指定哪些行是字段名、类型、注释、数据起始行

### 2. Excel 表结构约定（默认）

| 行 | 用途 | 说明 |
|----|------|------|
| 第1行 | 字段名 | 列的英文标识，不可重复、不可为空 |
| 第2行 | 数据类型 | 支持 int, float, string, bool, 数组类型, 二维数组类型, 嵌套类型, 自定义枚举 |
| 第3行 | 注释说明 | 字段的中文说明/注释 |
| 第4行及以后 | 数据行 | 实际配置数据 |

### 3. 支持的数据类型

- 基础类型：`int`、`float`、`string`、`bool`
- 数组类型：`int[]`、`float[]`、`string[]`、`bool[]`（分隔符支持 `,` `;` `|`）
- 二维数组类型：`int[][]`、`float[][]`、`string[][]`、`bool[][]`（`;` 分行，`,` 或 `|` 分列）
- 嵌套类型：`object`（JSON对象）、`object[]`（JSON对象数组）
- 自定义枚举类型（需在配置文件的 `enums` 中预先定义）

### 4. 数据类型转换/映射规则

| Excel类型 | TypeScript | C# | Java |
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
| `object[]` | `Record<string,unknown>[]` | `List<Dictionary<string,object>>` | `List<Map<String,Object>>` |
| 自定义枚举名 | 枚举名 | 枚举名 | 枚举名 |

### 5. JSON 输出

- 每个工作表输出一个 `.json` 文件
- JSON 包含字段元信息（表名、字段列表含名称/类型/注释）和数据行
- 数据行中的值已按声明的类型完成转换
- JSON 文件默认输出到 `./output/json/` 目录

### 6. 代码生成（Liquid 模板）

- 每种目标语言使用对应的 Liquid 模板生成代码
- 内置模板支持三种语言：TypeScript、C#、Java
- 支持用户提供自定义模板目录覆盖内置模板
- 模板变量包含：表名、字段列表（含映射后的类型和命名）、命名空间/包名、生成时间、源文件名

#### TypeScript 输出

- 生成 `interface`（可选属性，数组除外）
- 生成 `enum`（数值枚举）
- 默认使用 camelCase 属性名

#### C# 输出

- 生成 `class`（带 `{ get; set; }` 属性，带 XML 注释）
- 生成 `enum`
- 默认使用 PascalCase 属性名
- 包含 `using System.Collections.Generic;`
- 支持命名空间配置

#### Java 输出

- 生成 POJO 类（私有字段 + getters/setters）
- 生成 `enum`（带 `fromValue` 静态方法）
- 默认使用 camelCase 属性名
- 包含必要的 `import` 语句
- 支持包名配置

### 7. 枚举系统

- 在配置文件的 `enums` 字段中预先定义所有枚举类型及其可选值
- 当 Excel 列的类型引用已定义的枚举名时，自动将该列映射为该枚举类型
- 代码生成时自动为所有已配置的枚举生成枚举代码文件
- 枚举类型同样支持数组形式（如 `SkillType[]`）

### 8. CLI 命令

#### `convert` 命令

```bash
exceltools convert <输入文件.xlsx> [选项]
```

选项：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-l, --lang <语言>` | 目标语言，逗号分隔 | 全部三种 (typescript,csharp,java) |
| `-o, --output <目录>` | 输出根目录 | ./output |
| `-c, --config <路径>` | 指定配置文件 | 自动搜索 |
| `-s, --sheets <名称>` | 只处理指定工作表 | 全部 |
| `-t, --templates <目录>` | 自定义模板目录 | 内置模板 |
| `--json-only` | 只生成JSON | false |
| `--code-only` | 只生成代码 | false |
| `--dry-run` | 只检查不写文件 | false |
| `-v, --verbose` | 详细日志 | false |

#### `init` 命令

```bash
exceltools init [目录]
```

在指定目录（默认当前目录）生成 `exceltools.config.json` 配置文件。

### 9. 配置文件（exceltools.config.json）

配置项：

- `rowMapping`：Excel 行映射（字段名行、类型行、注释行、数据起始行）
- `languages`：默认生成的目标语言列表
- `output`：JSON 和代码的输出目录
- `enums`：全局枚举注册表
- `excludeSheets`：排除的工作表名称列表
- `naming`：命名风格（sheetNameToTableName、fieldNameToPropertyName），支持 PascalCase / camelCase / snake_case / keep
- `templates`：自定义模板目录和覆盖
- `languageSettings`：各语言的专属配置（命名空间、包名、是否使用特定注解等）
- `verbose`：是否默认启用详细日志

配置优先级：CLI参数 > 配置文件 > 内置默认值

### 10. 自定义模板

- 内置模板位于项目 `src/templates/builtin/` 下
- 支持通过配置 `templates.customDir` 指定自定义模板目录
- 支持通过配置 `templates.overrides` 覆盖单个模板文件
- 模板查找优先级：自定义目录 > 内置目录

## 非功能需求

- TypeScript 严格模式编译通过
- 生成的 TypeScript / C# / Java 代码格式规范，可直接编译
- 错误处理友好，给出明确的错误信息（文件不存在、格式错误、工作表为空等）
- 支持 verbose 模式输出详细调试信息
- 支持 dry-run 模式预览转换结果而不实际写入文件
