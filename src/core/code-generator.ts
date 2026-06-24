import * as fs from 'fs';
import * as path from 'path';
import type { Language, ExceltoolsConfig } from '../config/config.interfaces';
import type { TableData } from '../models/data.interfaces';
import type { FieldSchema } from '../models/schema.interfaces';
import { createTemplateContext } from '../templates/liquid-engine';
import { resolveTemplatePath } from '../templates/template-manager';
import { info, debug, warn } from '../utils/logger';
import { toCase } from '../templates/filters/naming';

export async function generateCode(
  tableDataList: TableData[],
  languages: Language[],
  config: ExceltoolsConfig,
  sourceFile: string,
  allEnums?: Record<string, Record<string, number>>,
  constants?: { name: string; type: string; value: unknown; comment: string }[],
): Promise<void> {
  const mergedEnums = allEnums ?? {};
  const enumKeys = new Set(Object.keys(mergedEnums));

  for (const lang of languages) {
    const { liquid, buildVariables } = createTemplateContext(lang, enumKeys);
    const langOutputDir = config.output.codeLangSubDir !== false
      ? path.resolve(config.output.code, lang)
      : path.resolve(config.output.code);
    fs.mkdirSync(langOutputDir, { recursive: true });

    const langSettings = config.languageSettings[lang];

    for (const table of tableDataList) {
      const mainTemplateName = lang === 'typescript' ? 'interface' : lang === 'go' ? 'struct' : 'class';

      try {
        const templatePath = resolveTemplatePath(
          mainTemplateName,
          lang,
          config.templates.customDir
        );
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const fieldSchemas: FieldSchema[] = table.fields.map(f => ({
          name: f.name,
          type: f.type as FieldSchema['type'],
          comment: f.comment,
          columnIndex: 0,
          isArray: f.type.endsWith('[]') && !f.type.endsWith('[][]'),
          is2DArray: f.type.endsWith('[][]'),
          isEnum: enumKeys.has(f.type.replace('[][]', '').replace('[]', '')),
          isNested: f.type.startsWith('object'),
        }));

        const importedEnums = fieldSchemas
          .filter(f => f.isEnum)
          .map(f => f.type.replace('[][]', '').replace('[]', ''))
          .filter((v, i, a) => a.indexOf(v) === i);

        // 预格式化每行数据为目标语言字面量
        const keyField = fieldSchemas[0];
        const dataEntries = table.rows.map(row => ({
          keyLiteral: formatValue(row[keyField.name], keyField, lang),
          rowLiteral: formatRow(row, fieldSchemas, lang, table.tableName),
        }));

        const variables = buildVariables({
          tableName: table.tableName,
          sourceFile,
          fields: fieldSchemas,
          dataRows: table.rows,
          dataEntries,
          namespace: 'namespace' in (langSettings ?? {})
            ? (langSettings as { namespace?: string | null }).namespace
            : null,
          package: 'package' in (langSettings ?? {})
            ? (langSettings as { package?: string | null }).package
            : null,
          importedEnums,
        });

        const rendered = await liquid.parseAndRender(templateSource, variables);

        const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : lang === 'java' ? 'java' : lang === 'python' ? 'py' : lang === 'go' ? 'go' : 'php';
        const filePath = path.join(langOutputDir, `${table.tableName}.${ext}`);
        fs.writeFileSync(filePath, rendered, 'utf-8');
        info(`代码已生成: ${filePath}`);
      } catch (err) {
        warn(`生成 ${lang} 代码失败 (${table.tableName}): ${err instanceof Error ? err.message : err}`);
      }
    }

    // 生成 Config 统一入口
    if (tableDataList.length > 0) {
      await generateConfigFile(lang, tableDataList, config, langOutputDir, sourceFile, constants);
    }

    // 生成常量文件
    if (constants && constants.length > 0) {
      await generateConstantsFile(lang, constants, config, langOutputDir, sourceFile);
    }

    // 生成枚举文件
    if (mergedEnums && Object.keys(mergedEnums).length > 0) {
      await generateEnumFiles(lang, mergedEnums, config, langOutputDir, sourceFile);
    }
  }
}

// ========== 常量文件生成 ==========

/**
 * 解析常量值：根据 Excel 类型和原始字符串值，转换为目标语言字面量
 * 复用 formatValue 处理数组/2D 数组的序列化
 */
function formatConstValue(val: unknown, type: string, lang: Language): string {
  if (val === null || val === undefined) return lang === 'python' ? 'None' : lang === 'go' || lang === 'php' ? 'null' : 'null';

  const str = String(val).trim();
  if (!str) return lang === 'python' ? 'None' : lang === 'go' || lang === 'php' ? 'null' : 'null';

  const is2D = type.endsWith('[][]');
  const isArray = !is2D && type.endsWith('[]');
  const bt = is2D ? type.slice(0, -4) : isArray ? type.slice(0, -2) : type;

  // 二维数组
  if (is2D) {
    const rows = str.split(';').filter(r => r.trim());
    const parsed = rows.map(row => {
      const sep = row.includes('|') ? '|' : ',';
      return row.split(sep).map(s => s.trim()).filter(Boolean).map(p => formatScalarConst(p, bt, lang));
    });
    if (lang === 'typescript') return `[${parsed.map(r => `[${r.join(', ')}]`).join(', ')}]`;
    if (lang === 'python') return `[${parsed.map(r => `[${r.join(', ')}]`).join(', ')}]`;
    if (lang === 'go') return `[][]${goType(bt)}{${parsed.map(r => `{${r.join(', ')}}`).join(', ')}}`;
    return `[${parsed.map(r => `[${r.join(', ')}]`).join(', ')}]`;
  }

  // 一维数组
  if (isArray) {
    const sep = str.includes('|') ? '|' : str.includes(';') ? ';' : ',';
    const parts = str.split(sep).map(s => s.trim()).filter(Boolean).map(p => formatScalarConst(p, bt, lang));
    if (lang === 'typescript') return `[${parts.join(', ')}]`;
    if (lang === 'python') return `[${parts.join(', ')}]`;
    if (lang === 'go') return `[]${goType(bt)}{${parts.join(', ')}}`;
    if (lang === 'csharp') return `new List<${bt}> { ${parts.join(', ')} }`;
    if (lang === 'java') return `Arrays.asList(${parts.join(', ')})`;
    if (lang === 'php') return `[${parts.join(', ')}]`;
    return `[${parts.join(', ')}]`;
  }

  return formatScalarConst(str, bt, lang);
}

function formatScalarConst(str: string, bt: string, lang: Language): string {
  switch (bt) {
    case 'int': return String(parseInt(str, 10) || 0);
    case 'float': return String(parseFloat(str) || 0);
    case 'bool':
      if (lang === 'python') return str === 'true' || str === '1' ? 'True' : 'False';
      if (lang === 'go' || lang === 'php') return str === 'true' || str === '1' ? 'true' : 'false';
      return str === 'true' || str === '1' ? 'true' : 'false';
    case 'string': default:
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
}

function goType(bt: string): string {
  const m: Record<string, string> = { int: 'int', float: 'float64', string: 'string', bool: 'bool' };
  return m[bt] ?? bt;
}

/** Java 类型装箱 + elementClass */
function javaBoxConst(type: string): { type: string; innerType?: string; elementClass: string } {
  const BOX: Record<string, string> = { int: 'Integer', float: 'Double', bool: 'Boolean', string: 'String' };
  const is2D = type.endsWith('[][]');
  const isArr = !is2D && type.endsWith('[]');
  const bt = is2D ? type.slice(0, -4) : isArr ? type.slice(0, -2) : type;
  const boxed = BOX[bt] ?? bt;
  if (is2D) return { type: `List<List<${boxed}>>`, innerType: `List<${boxed}>`, elementClass: `${boxed}.class` };
  if (isArr) return { type: `List<${boxed}>`, elementClass: `${boxed}.class` };
  return { type: boxed, elementClass: `${boxed}.class` };
}

function getConstDefault(type: string, lang: Language): string {
  const is2D = type.endsWith('[][]');
  const isArray = !is2D && type.endsWith('[]');
  if (is2D) {
    if (lang === 'typescript') return '[]';
    if (lang === 'python' || lang === 'php') return '[]';
    if (lang === 'go') return 'nil';
    if (lang === 'csharp') return 'new List<List<>>()';
    if (lang === 'java') return 'new ArrayList<>()';
    return '[]';
  }
  if (isArray) {
    if (lang === 'python' || lang === 'php') return '[]';
    if (lang === 'go') return 'nil';
    if (lang === 'csharp') return 'new List<>()';
    if (lang === 'java') return 'new ArrayList<>()';
    return '[]';
  }
  const bt = type;
  if (bt === 'int' || bt === 'float') return '0';
  if (bt === 'bool') return lang === 'python' ? 'False' : lang === 'go' ? 'false' : 'false';
  if (bt === 'string') return lang === 'python' ? '""' : lang === 'go' || lang === 'php' ? '""' : '""';
  return lang === 'python' ? 'None' : lang === 'go' || lang === 'php' ? 'null' : 'null';
}

/** 将 Excel 类型映射到目标语言类型（复用 type-mapping） */
function mapConstType(type: string, lang: Language): string {
  const bt = type.endsWith('[][]') ? type.slice(0, -4) : type.endsWith('[]') ? type.slice(0, -2) : type;
  const is2D = type.endsWith('[][]');
  const isArray = !is2D && type.endsWith('[]');

  // 基础类型映射
  const BASE: Record<string, Record<string, string>> = {
    int: { typescript: 'number', csharp: 'int', java: 'int', python: 'int', go: 'int', php: 'int' },
    float: { typescript: 'number', csharp: 'float', java: 'double', python: 'float', go: 'float64', php: 'float' },
    string: { typescript: 'string', csharp: 'string', java: 'String', python: 'str', go: 'string', php: 'string' },
    bool: { typescript: 'boolean', csharp: 'bool', java: 'boolean', python: 'bool', go: 'bool', php: 'bool' },
  };

  const base = BASE[bt]?.[lang] ?? bt;

  if (is2D) {
    if (lang === 'typescript') return `${base}[][]`;
    if (lang === 'python') return `list[list[${base}]]`;
    if (lang === 'go') return `[][]${base}`;
    if (lang === 'php') return 'array';
    return `List<List<${base}>>`;
  }
  if (isArray) {
    if (lang === 'typescript') return `${base}[]`;
    if (lang === 'python') return `list[${base}]`;
    if (lang === 'go') return `[]${base}`;
    if (lang === 'csharp') return `List<${base}>`;
    if (lang === 'java') return `List<${base}>`;
    if (lang === 'php') return 'array';
    return `${base}[]`;
  }
  return base;
}

async function generateConstantsFile(
  lang: Language,
  constants: { name: string; type: string; value: unknown; comment: string }[],
  config: ExceltoolsConfig,
  outputDir: string,
  sourceFile: string,
): Promise<void> {
  try {
    const { liquid } = createTemplateContext(lang, new Set());
    const templatePath = resolveTemplatePath('constant', lang, config.templates.customDir);
    if (!fs.existsSync(templatePath)) return;
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    const items = constants.map(c => {
      const base = {
        name: c.name,
        type: mapConstType(c.type, lang),
        value: formatConstValue(c.value, c.type, lang),
        defaultValue: getConstDefault(c.type, lang),
        comment: c.comment,
      } as Record<string, unknown>;
      // Java 泛型需要装箱类型 + elementClass
      if (lang === 'java') {
        const jBoxed = javaBoxConst(c.type);
        base.type = jBoxed.type;
        base.innerType = jBoxed.innerType;
        base.elementClass = jBoxed.elementClass;
      }
      return base;
    });

    const langSettings = config.languageSettings[lang];
    const variables = {
      sourceFile,
      generatedAt: new Date().toISOString(),
      constants: items,
      namespace: 'namespace' in (langSettings ?? {})
        ? (langSettings as { namespace?: string | null }).namespace : null,
      package: 'package' in (langSettings ?? {})
        ? (langSettings as { package?: string | null }).package : null,
    };
    const rendered = await liquid.parseAndRender(templateSource, variables);

    const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : lang === 'java' ? 'java' : lang === 'python' ? 'py' : lang === 'go' ? 'go' : 'php';
    const filePath = path.join(outputDir, `ConfigConstants.${ext}`);
    fs.writeFileSync(filePath, rendered, 'utf-8');
    info(`常量已生成: ${filePath}`);
  } catch (err) {
    warn(`生成常量 (${lang}) 失败: ${err instanceof Error ? err.message : err}`);
  }
}

// ========== Config.ts 统一入口 ==========

async function generateConfigFile(
  lang: Language,
  tableDataList: TableData[],
  config: ExceltoolsConfig,
  outputDir: string,
  sourceFile: string,
  constants?: { name: string; type: string; value: unknown; comment: string }[],
): Promise<void> {
  try {
    const { liquid } = createTemplateContext(lang, new Set());
    const templatePath = resolveTemplatePath('config', lang, config.templates.customDir);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    const langSettings = config.languageSettings[lang];
    const hasConstants = constants && constants.length > 0;
    const variables = {
      sourceFile,
      generatedAt: new Date().toISOString(),
      namespace: 'namespace' in (langSettings ?? {})
        ? (langSettings as { namespace?: string | null }).namespace : null,
      package: 'package' in (langSettings ?? {})
        ? (langSettings as { package?: string | null }).package : null,
      tables: tableDataList.map(t => ({ tableName: t.tableName })),
      hasConstants,
    };

    const rendered = await liquid.parseAndRender(templateSource, variables);

    const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : lang === 'java' ? 'java' : lang === 'python' ? 'py' : lang === 'go' ? 'go' : 'php';
    const filePath = path.join(outputDir, `Config.${ext}`);
    fs.writeFileSync(filePath, rendered, 'utf-8');
    info(`配置入口已生成: ${filePath}`);
  } catch (err) {
    warn(`生成 Config (${lang}) 失败: ${err instanceof Error ? err.message : err}`);
  }
}

// ========== 值序列化 ==========

/** 判断字段的数组维度 */
function getArrayDepth(field: Pick<FieldSchema, 'isArray' | 'is2DArray'>): number {
  if (field.is2DArray) return 2;
  if (field.isArray) return 1;
  return 0;
}

/** 去掉数组标记得到基础类型名 */
function baseTypeName(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

/** 将单个值格式化为目标语言字面量 */
function formatValue(
  val: unknown,
  field: Pick<FieldSchema, 'type' | 'isArray' | 'is2DArray' | 'isEnum' | 'isNested'>,
  lang: Language,
): string {
  if (val === null || val === undefined) return nullLiteral(lang);

  const depth = getArrayDepth(field);

  // 数组类型
  if (depth === 1 && Array.isArray(val)) {
    const items = val.map(v => formatScalar(v, field, lang)).join(', ');
    return listWrapper(items, field, lang, 1);
  }
  if (depth === 2 && Array.isArray(val)) {
    const rows = val.map((inner: unknown[]) => {
      const items = (Array.isArray(inner) ? inner : [inner])
        .map((v: unknown) => formatScalar(v, field, lang))
        .join(', ');
      return listWrapper(items, field, lang, 1);
    }).join(', ');
    return listWrapper(rows, field, lang, 2);
  }

  return formatScalar(val, field, lang);
}

function formatScalar(
  val: unknown,
  field: Pick<FieldSchema, 'type' | 'isEnum' | 'isNested'>,
  lang: Language,
): string {
  const bt = baseTypeName(field.type);

  if (field.isEnum) {
    // 枚举: SkillType.Attack (C#/Java) 或 SkillType.Attack (TS)
    const memberName = String(val).trim();
    return lang === 'typescript' ? `${bt}.${memberName}` : `${bt}.${memberName}`;
  }

  if (field.isNested) {
    if (typeof val === 'object') {
      return lang === 'typescript' ? JSON.stringify(val) : 'null';
    }
    return nullLiteral(lang);
  }

  switch (bt) {
    case 'int':
    case 'float':
      return String(Number(val));
    case 'bool':
      return String(Boolean(val));
    case 'string':
    default: {
      const escaped = String(val)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
      return `"${escaped}"`;
    }
  }
}

function nullLiteral(lang: Language): string {
  if (lang === 'csharp') return 'null';
  if (lang === 'java') return 'null';
  return 'null';
}

function listWrapper(items: string, _field: unknown, lang: Language, depth: number): string {
  const inner = items || '';
  if (lang === 'csharp') {
    if (depth === 2) return `new List<List<object>> { ${inner} }`;
    return `new List<object> { ${inner} }`;
  }
  if (lang === 'java') {
    return `Arrays.asList(${inner})`;
  }
  return `[${inner}]`;
}

/** 将整行格式化为目标语言的对象字面量 */
function formatRow(
  row: Record<string, unknown>,
  fields: FieldSchema[],
  lang: Language,
  tableName: string,
): string {
  switch (lang) {
    case 'typescript': {
      const parts = fields.map(f => {
        const propName = toCase(f.name, 'camelCase');
        const val = formatValue(row[f.name], f, lang);
        return `${propName}: ${val}`;
      });
      return `{ ${parts.join(', ')} } as ${tableName}`;
    }
    case 'csharp': {
      const parts = fields.map(f => {
        const propName = toCase(f.name, 'PascalCase');
        const val = formatValue(row[f.name], f, lang);
        return `${propName} = ${val}`;
      });
      return `new ${tableName} { ${parts.join(', ')} }`;
    }
    case 'java': {
      const parts = fields.map(f => formatValue(row[f.name], f, lang));
      return `new ${tableName}(${parts.join(', ')})`;
    }
    default:
      return JSON.stringify(row);
  }
}

// ========== 枚举文件生成 ==========

async function generateEnumFiles(
  lang: Language,
  enums: Record<string, Record<string, number>>,
  config: ExceltoolsConfig,
  outputDir: string,
  sourceFile: string,
): Promise<void> {
  const { liquid } = createTemplateContext(lang, new Set());
  const langSettings = config.languageSettings[lang];

  const enumEntries = Object.entries(enums).map(([name, values]) => ({
    name,
    values: Object.entries(values).map(([k, v]) => ({ name: k, value: v })),
  }));

  if (lang === 'typescript' || lang === 'csharp' || lang === 'python' || lang === 'php') {
    try {
      const templatePath = resolveTemplatePath('enum', lang, config.templates.customDir);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');

      const variables = {
        enums: enumEntries,
        sourceFile,
        generatedAt: new Date().toISOString(),
        namespace: langSettings?.namespace ?? null,
      };

      const rendered = await liquid.parseAndRender(templateSource, variables);

      const ext = lang === 'python' ? 'py' : lang === 'php' ? 'php' : lang === 'typescript' ? 'ts' : 'cs';
      const filePath = path.join(outputDir, `ConfigEnums.${ext}`);
      fs.writeFileSync(filePath, rendered, 'utf-8');
      info(`枚举已生成: ${filePath}`);
    } catch (err) {
      warn(`生成 ${lang} 枚举文件失败: ${err instanceof Error ? err.message : err}`);
    }
  } else {
    for (const entry of enumEntries) {
      try {
        const templatePath = resolveTemplatePath('enum', lang, config.templates.customDir);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const variables = {
          enumName: entry.name,
          values: entry.values,
          sourceFile,
          generatedAt: new Date().toISOString(),
          package: langSettings?.package ?? null,
        };

        const rendered = await liquid.parseAndRender(templateSource, variables);

        const perExt = lang === 'go' ? 'go' : 'java';
        const filePath = path.join(outputDir, `${entry.name}.${perExt}`);
        fs.writeFileSync(filePath, rendered, 'utf-8');
        info(`枚举已生成: ${filePath}`);
      } catch (err) {
        warn(`生成枚举 ${entry.name} (${lang}) 失败: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
