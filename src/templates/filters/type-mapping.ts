import type { Language } from '../../config/config.interfaces';
import type { FieldSchema } from '../../models/schema.interfaces';

const TYPE_MAP: Record<string, Record<string, string>> = {
  int:    { typescript: 'number',  csharp: 'int',    java: 'int',      python: 'int',    go: 'int',    php: 'int' },
  float:  { typescript: 'number',  csharp: 'float',  java: 'double',   python: 'float',  go: 'float64', php: 'float' },
  string: { typescript: 'string',  csharp: 'string', java: 'String',   python: 'str',    go: 'string',  php: 'string' },
  bool:   { typescript: 'boolean', csharp: 'bool',   java: 'boolean',  python: 'bool',   go: 'bool',    php: 'bool' },
};

const ARRAY_TYPE_MAP: Record<string, Record<string, string>> = {
  int:    { typescript: 'number[]',    csharp: 'List<int>',     java: 'List<Integer>',  python: 'list[int]',    go: '[]int',    php: 'array' },
  float:  { typescript: 'number[]',    csharp: 'List<float>',   java: 'List<Double>',   python: 'list[float]',  go: '[]float64', php: 'array' },
  string: { typescript: 'string[]',    csharp: 'List<string>',  java: 'List<String>',   python: 'list[str]',    go: '[]string',  php: 'array' },
  bool:   { typescript: 'boolean[]',   csharp: 'List<bool>',    java: 'List<Boolean>',  python: 'list[bool]',   go: '[]bool',    php: 'array' },
};

function getBaseType(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

/** Java 基础类型 → 包装类型（泛型必须用包装类型） */
const JAVA_BOXED: Record<string, string> = {
  int: 'Integer',
  double: 'Double',
  float: 'Float',
  boolean: 'Boolean',
};

function wrap2D(inner: string, lang: Language): string {
  switch (lang) {
    case 'typescript': return `${inner}[][]`;
    case 'python': return `list[list[${inner}]]`;
    case 'go': return `[][]${inner}`;
    case 'php': return 'array';
    default: {
      const boxed = lang === 'java' ? (JAVA_BOXED[inner] ?? inner) : inner;
      return `List<List<${boxed}>>`;
    }
  }
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
    let nestedType: string;
    switch (lang) {
      case 'typescript': nestedType = 'Record<string, unknown>'; break;
      case 'csharp': nestedType = 'Dictionary<string, object>'; break;
      case 'java': nestedType = 'Map<String, Object>'; break;
      case 'python': nestedType = 'dict[str, Any]'; break;
      case 'go': nestedType = 'map[string]interface{}'; break;
      case 'php': nestedType = 'array'; break;
    }
    if (field.is2DArray) return wrap2D(nestedType, lang);
    if (field.isArray) {
      return lang === 'typescript' ? `${nestedType}[]`
        : lang === 'python' ? `list[${nestedType}]`
        : lang === 'go' ? `[]${nestedType}`
        : lang === 'php' ? 'array'
        : `List<${nestedType}>`;
    }
    return nestedType;
  }

  // 二维数组基础类型
  if (field.is2DArray) {
    const mapped = TYPE_MAP[baseType]?.[lang] ?? baseType;
    const inner = lang === 'java' ? (JAVA_BOXED[mapped] ?? mapped) : mapped;
    return wrap2D(inner, lang);
  }

  // 一维数组基础类型
  if (field.isArray) {
    return ARRAY_TYPE_MAP[baseType]?.[lang] ?? (
      lang === 'typescript' ? `${baseType}[]`
      : lang === 'python' ? `list[${baseType}]`
      : lang === 'go' ? `[]${baseType}`
      : `${baseType}[]`
    );
  }

  return TYPE_MAP[baseType]?.[lang] ?? baseType;
}

export function getDefaultValue(field: FieldSchema, lang: Language): string {
  if (field.is2DArray) {
    if (lang === 'typescript') return '[][]';
    if (lang === 'python' || lang === 'php') return '[]';
    if (lang === 'go') return 'nil';
    if (lang === 'csharp') return 'new List<List<>>()';
    return 'new ArrayList<>()';
  }
  if (field.isArray) {
    if (lang === 'python' || lang === 'php') return '[]';
    if (lang === 'go') return 'nil';
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
      return lang === 'go' ? 'false' : 'false';
    case 'string':
      return lang === 'csharp' ? 'string.Empty'
        : lang === 'java' ? '""'
        : lang === 'python' ? '""'
        : lang === 'go' ? '""'
        : "''";
    case 'object':
      return lang === 'python' ? 'None'
        : lang === 'go' ? 'nil'
        : lang === 'php' ? 'null'
        : 'null';
    default:
      return lang === 'python' ? 'None'
        : lang === 'go' ? 'nil'
        : lang === 'php' ? 'null'
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
