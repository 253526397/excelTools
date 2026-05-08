import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { TableSchema, FieldSchema, FieldType } from '../models/schema.interfaces';
import { warn, error } from '../utils/logger';

const BASE_TYPES = new Set(['int', 'float', 'string', 'bool', 'object']);

function deriveIs2DArray(type: string): boolean {
  return type.endsWith('[][]');
}

function deriveIsArray(type: string): boolean {
  return type.endsWith('[]') && !type.endsWith('[][]');
}

function deriveBaseType(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

function deriveIsEnum(type: string, enumKeys: Set<string>): boolean {
  const base = deriveBaseType(type);
  return !BASE_TYPES.has(base) && enumKeys.has(base);
}

function deriveIsNested(type: string): boolean {
  const base = deriveBaseType(type);
  return base === 'object';
}

export function buildTableSchema(
  raw: RawSheetData,
  rowMapping: ExcelRowMapping,
  enumKeys: Set<string>
): TableSchema | null {
  const { fieldNames: fnRow, dataTypes: dtRow, comments: cmRow } = rowMapping;

  if (fnRow >= raw.rowCount) {
    error(`工作表 "${raw.sheetName}": 字段名行(${fnRow})超出总行数(${raw.rowCount})`);
    return null;
  }

  const names = raw.rows[fnRow];
  const types = dtRow < raw.rowCount ? raw.rows[dtRow] : [];
  const comments = cmRow >= 0 && cmRow < raw.rowCount ? raw.rows[cmRow] : [];

  const fields: FieldSchema[] = [];

  for (let ci = 0; ci < raw.colCount; ci++) {
    const name = String(names[ci] ?? '').trim();
    if (!name) continue; // 跳过无名字段

    const typeStr = String(types[ci] ?? 'string').trim();
    const type: FieldType = typeStr || 'string';
    const comment = String(comments[ci] ?? '').trim();

    const is2DArray = deriveIs2DArray(typeStr);
    const isArray = deriveIsArray(typeStr);
    const isEnum = deriveIsEnum(typeStr, enumKeys);
    const isNested = deriveIsNested(typeStr);

    const field: FieldSchema = {
      name,
      type,
      comment,
      columnIndex: ci,
      isArray,
      is2DArray,
      isEnum,
      isNested,
    };

    // 检查重复字段名
    if (fields.some(f => f.name === name)) {
      warn(`工作表 "${raw.sheetName}": 字段名 "${name}" 重复，第2次出现已跳过`);
      continue;
    }

    fields.push(field);
  }

  if (fields.length === 0) {
    warn(`工作表 "${raw.sheetName}": 未找到有效字段定义`);
    return null;
  }

  return {
    tableName: raw.sheetName,
    fields,
    sourceSheet: raw.sheetName,
    comment: '',
  };
}
