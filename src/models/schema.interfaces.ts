/**
 * 支持的字段类型
 */
export type FieldType =
  | 'int'
  | 'float'
  | 'string'
  | 'bool'
  | 'int[]'
  | 'float[]'
  | 'string[]'
  | 'bool[]'
  | 'object'
  | 'object[]'
  | string;  // 自定义枚举类型名，如 "SkillType"

export interface FieldSchema {
  name: string;
  type: FieldType;
  comment: string;
  columnIndex: number;
  isArray: boolean;
  is2DArray: boolean;
  isEnum: boolean;
  isNested: boolean;
  enumValues?: string[];
  defaultValue?: unknown;
}

export interface TableSchema {
  tableName: string;
  fields: FieldSchema[];
  sourceSheet: string;
  comment: string;
}
