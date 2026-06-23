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
): Promise<void> {
  const mergedEnums = allEnums ?? config.enums;
  const enumKeys = new Set(Object.keys(mergedEnums));

  for (const lang of languages) {
    const { liquid, buildVariables } = createTemplateContext(lang, enumKeys);
    const langOutputDir = path.resolve(config.output.code, lang);
    fs.mkdirSync(langOutputDir, { recursive: true });

    const langSettings = config.languageSettings[lang];

    for (const table of tableDataList) {
      const mainTemplateName = lang === 'typescript' ? 'interface' : 'class';

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

        const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : 'java';
        const filePath = path.join(langOutputDir, `${table.tableName}.${ext}`);
        fs.writeFileSync(filePath, rendered, 'utf-8');
        info(`代码已生成: ${filePath}`);
      } catch (err) {
        warn(`生成 ${lang} 代码失败 (${table.tableName}): ${err instanceof Error ? err.message : err}`);
      }
    }

    // 生成 Config 统一入口
    if (tableDataList.length > 0) {
      await generateConfigFile(lang, tableDataList, config, langOutputDir, sourceFile);
    }

    // 生成枚举文件
    if (mergedEnums && Object.keys(mergedEnums).length > 0) {
      await generateEnumFiles(lang, mergedEnums, config, langOutputDir, sourceFile);
    }
  }
}

// ========== Config.ts 统一入口 ==========

async function generateConfigFile(
  lang: Language,
  tableDataList: TableData[],
  config: ExceltoolsConfig,
  outputDir: string,
  sourceFile: string,
): Promise<void> {
  try {
    const { liquid } = createTemplateContext(lang, new Set());
    const templatePath = resolveTemplatePath('config', lang, config.templates.customDir);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    const langSettings = config.languageSettings[lang];
    const variables = {
      sourceFile,
      generatedAt: new Date().toISOString(),
      namespace: 'namespace' in (langSettings ?? {})
        ? (langSettings as { namespace?: string | null }).namespace : null,
      package: 'package' in (langSettings ?? {})
        ? (langSettings as { package?: string | null }).package : null,
      tables: tableDataList.map(t => ({ tableName: t.tableName })),
    };

    const rendered = await liquid.parseAndRender(templateSource, variables);

    const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : 'java';
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

  if (lang === 'typescript' || lang === 'csharp') {
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

      const ext = lang === 'typescript' ? 'ts' : 'cs';
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

        const filePath = path.join(outputDir, `${entry.name}.java`);
        fs.writeFileSync(filePath, rendered, 'utf-8');
        info(`枚举已生成: ${filePath}`);
      } catch (err) {
        warn(`生成枚举 ${entry.name} (java) 失败: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
