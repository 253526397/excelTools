import type { CellValue } from './excel.interfaces';
import type { FieldType } from './schema.interfaces';

export interface TypedValue {
  raw: CellValue;
  parsed: unknown;
  fieldType: FieldType;
}

export type DataRow = Record<string, TypedValue>;

export interface TableData {
  tableName: string;
  sourceSheet: string;
  fields: { name: string; type: FieldType; comment: string }[];
  rows: Record<string, unknown>[];  // 纯数据，已类型转换，可直接 JSON 序列化
}

export interface SerializableTable {
  tableName: string;
  sourceSheet: string;
  fields: { name: string; type: string; comment: string }[];
  data: Record<string, unknown>[];
}

export interface CompactTable {
  t: string;
  f: [string, string, string][];
  d: unknown[][];
}
