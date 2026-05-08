export type CaseStyle = 'PascalCase' | 'camelCase' | 'snake_case' | 'keep';

export function toCase(str: string, style: CaseStyle): string {
  if (!str) return str;

  switch (style) {
    case 'PascalCase':
      return toPascalCase(str);
    case 'camelCase':
      return toCamelCase(str);
    case 'snake_case':
      return toSnakeCase(str);
    case 'keep':
    default:
      return str;
  }
}

function toPascalCase(str: string): string {
  // 先按分隔符拆词（下划线、连字符、空格、点号）
  const words = splitWords(str);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join('_');
}

function splitWords(str: string): string[] {
  // 按分隔符或大写字母边界拆分
  // 先按分隔符拆分，然后对每个部分按驼峰边界再拆
  const parts = str.split(/[_\-.\s]+/).filter(Boolean);
  const result: string[] = [];

  for (const part of parts) {
    // 对驼峰式进行拆分：abcDef → abc, Def; ABCDef → ABC, Def
    const words = part.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/).filter(Boolean);
    result.push(...words);
  }

  return result.length > 0 ? result : [str];
}
