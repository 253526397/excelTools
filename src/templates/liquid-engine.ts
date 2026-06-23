import { Liquid } from 'liquidjs';
import type { Language } from '../config/config.interfaces';
import type { FieldSchema } from '../models/schema.interfaces';
import { mapFieldType, getDefaultValue } from './filters/type-mapping';
import { toCase } from './filters/naming';

let engine: Liquid | null = null;

export function getLiquidEngine(): Liquid {
  if (!engine) {
    engine = new Liquid({
      cache: true,
      strictFilters: true,
      strictVariables: false,
    });
  }
  return engine;
}

/**
 * 为特定语言和枚举集合创建一个渲染上下文，
 * 返回带有自定义过滤器的 Liquid 实例 + 模板变量增强函数
 */
/** Java 基础类型 → 包装类型 */
function boxJavaType(t: string): string {
  const base = t.replace(/\[\]|\[\]\[\]/g, '');
  const map: Record<string, string> = {
    int: 'Integer',
    float: 'Double',
    bool: 'Boolean',
    string: 'String',
  };
  return map[base] ?? t;
}

export function createTemplateContext(
  lang: Language,
  enumKeys: Set<string>
) {
  const liquid = getLiquidEngine();

  // 注册自定义 filter：将值序列化为目标语言的合法字面量
  liquid.registerFilter('literal', (val: unknown) => formatLiteralValue(val, lang, enumKeys));

  return {
    liquid,

    /**
     * 构建模板变量
     */
    buildVariables(params: {
      tableName: string;
      sourceFile: string;
      fields: FieldSchema[];
      namespace?: string | null;
      package?: string | null;
      importedEnums?: string[];
      /** 数据行（key-value 形式） */
      dataRows?: Record<string, unknown>[];
      /** 预格式化的数据条目（由 code-generator 提供） */
      dataEntries?: { keyLiteral: string; rowLiteral: string }[];
    }) {
      const { tableName, sourceFile, fields, namespace, package: pkg, importedEnums, dataRows, dataEntries } = params;

      const enrichedFields = fields.map((field) => ({
        name: field.name,
        type: field.type,
        comment: field.comment,
        isArray: field.isArray,
        is2DArray: field.is2DArray,
        isEnum: field.isEnum,
        isNested: field.isNested,
        mappedType: mapFieldType(field, lang, enumKeys),
        defaultValue: getDefaultValue(field, lang),
        propertyName: toCase(field.name, 'camelCase'),
        pascalName: toCase(field.name, 'PascalCase'),
      }));

      // 第一个字段作为 key
      const keyField = enrichedFields[0];

      // 使用预格式化的 dataEntries（由 code-generator 提供）或从 dataRows 构建
      const entries = dataEntries ?? (dataRows ?? []).map(row => {
        const keyValue = row[keyField.name];
        return { keyLiteral: String(keyValue), rowLiteral: '', keyValue };
      });

      // Java 泛型需要包装类型
      const boxedKeyType = lang === 'java' ? boxJavaType(keyField.mappedType) : keyField.mappedType;

      return {
        tableName,
        sourceFile,
        fields: enrichedFields,
        keyField,
        keyFieldName: keyField.propertyName,
        keyType: keyField.mappedType,
        boxedKeyType,
        namespace: namespace ?? null,
        package: pkg ?? null,
        generatedAt: new Date().toISOString(),
        importedEnums: importedEnums ?? [],
        enumFileName: lang === 'typescript' ? 'ConfigEnums' : lang === 'csharp' ? 'ConfigEnums' : null,
        dataEntries: entries,
      };
    },
  };
}

/**
 * 将值序列化为目标语言的合法字面量
 */
function formatLiteralValue(val: unknown, lang: Language, enumKeys: Set<string>): string {
  if (val === null || val === undefined) {
    return lang === 'csharp' ? 'null' : 'null';
  }

  if (typeof val === 'boolean') {
    return lang === 'java' ? String(val) : String(val);
  }

  if (typeof val === 'number') {
    return String(val);
  }

  if (typeof val === 'string') {
    // 检查是否为枚举值
    if (enumKeys.has(val)) {
      return `${val}.${val}`; // fallback: string value
    }
    // 转义字符串
    const escaped = val
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    return `"${escaped}"`;
  }

  if (Array.isArray(val)) {
    const items = val.map(v => formatLiteralValue(v, lang, enumKeys)).join(', ');
    if (lang === 'csharp') return `new List<> { ${items} }`;
    if (lang === 'java') return `Arrays.asList(${items})`;
    return `[${items}]`;
  }

  if (typeof val === 'object') {
    if (lang === 'typescript') return JSON.stringify(val);
    return 'null'; // C#/Java 嵌套对象太复杂，回退到 null
  }

  return 'null';
}

export function resetEngine(): void {
  engine = null;
}
