import type { Language } from '../../config/config.interfaces';
import type { FieldSchema } from '../../models/schema.interfaces';

const TYPE_MAP: Record<string, Record<string, string>> = {
  int: { typescript: 'number', csharp: 'int', java: 'int' },
  float: { typescript: 'number', csharp: 'float', java: 'double' },
  string: { typescript: 'string', csharp: 'string', java: 'String' },
  bool: { typescript: 'boolean', csharp: 'bool', java: 'boolean' },
};

const ARRAY_TYPE_MAP: Record<string, Record<string, string>> = {
  int: { typescript: 'number[]', csharp: 'List<int>', java: 'List<Integer>' },
  float: { typescript: 'number[]', csharp: 'List<float>', java: 'List<Double>' },
  string: { typescript: 'string[]', csharp: 'List<string>', java: 'List<String>' },
  bool: { typescript: 'boolean[]', csharp: 'List<bool>', java: 'List<Boolean>' },
};

function getBaseType(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

function wrap2D(inner: string, lang: Language): string {
  return lang === 'typescript' ? `${inner}[][]`
    : `List<List<${inner}>>`;
}

export function mapFieldType(field: FieldSchema, lang: Language, enumKeys: Set<string>): string {
  const baseType = getBaseType(field.type);

  // 枚举类型
  if (field.isEnum || enumKeys.has(baseType)) {
    if (field.is2DArray) return wrap2D(baseType, lang);
    if (field.isArray) {
      return lang === 'typescript' ? `${baseType}[]`
        : lang === 'csharp' ? `List<${baseType}>`
        : `List<${baseType}>`;
    }
    return baseType;
  }

  // 嵌套类型
  if (field.isNested) {
    const nestedType = lang === 'typescript' ? 'Record<string, unknown>'
      : lang === 'csharp' ? 'Dictionary<string, object>'
      : 'Map<String, Object>';
    if (field.is2DArray) return wrap2D(nestedType, lang);
    if (field.isArray) {
      return lang === 'typescript' ? `${nestedType}[]`
        : `List<${nestedType}>`;
    }
    return nestedType;
  }

  // 二维数组基础类型
  if (field.is2DArray) {
    const mapped = TYPE_MAP[baseType]?.[lang] ?? baseType;
    return lang === 'typescript' ? `${mapped}[][]`
      : `List<List<${mapped}>>`;
  }

  // 一维数组基础类型
  if (field.isArray) {
    return ARRAY_TYPE_MAP[baseType]?.[lang] ?? `${baseType}[]`;
  }

  return TYPE_MAP[baseType]?.[lang] ?? baseType;
}

export function getDefaultValue(field: FieldSchema, lang: Language): string {
  if (field.is2DArray) {
    if (lang === 'typescript') return '[][]';
    if (lang === 'csharp') return 'new List<List<>>()';
    return 'new ArrayList<>()';
  }
  if (field.isArray) {
    return lang === 'csharp' ? 'new List<>()'
      : lang === 'java' ? 'new ArrayList<>()'
      : '[]';
  }

  const baseType = getBaseType(field.type);

  switch (baseType) {
    case 'int':
    case 'float':
      return '0';
    case 'bool':
      return lang === 'java' ? 'false' : 'false';
    case 'string':
      return lang === 'csharp' ? 'string.Empty'
        : lang === 'java' ? '""'
        : "''";
    case 'object':
      return lang === 'csharp' ? 'null'
        : lang === 'java' ? 'null'
        : 'null';
    default:
      // 枚举类型
      return lang === 'csharp' ? 'null'
        : lang === 'java' ? 'null'
        : 'null';
  }
}

export function getLanguageImports(lang: Language): string[] {
  switch (lang) {
    case 'csharp':
      return ['System.Collections.Generic'];
    case 'java':
      return ['java.util.List', 'java.util.ArrayList', 'java.util.Map', 'java.util.HashMap'];
    case 'typescript':
    default:
      return [];
  }
}
