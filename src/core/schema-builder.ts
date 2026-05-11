import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { TableSchema, FieldSchema, FieldType } from '../models/schema.interfaces';
import { warn, error } from '../utils/logger';
import type { ValidationCollector } from './validation-collector';
import { ValidationSeverity, ValidationCategory } from '../models/validation.interfaces';

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
  enumKeys: Set<string>,
  collector?: ValidationCollector,
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

    // 缺少字段名但填写了类型 → 警告
    if (!name) {
      const typeVal = types[ci];
      if (typeVal !== null && typeVal !== undefined && String(typeVal).trim() !== '') {
        collector?.add({
          severity: ValidationSeverity.WARNING,
          category: ValidationCategory.EMPTY_FIELD_NAME,
          location: {
            sheetName: raw.sheetName,
            rowIndex: dtRow < raw.rowCount ? dtRow : -1,
            columnIndex: ci,
          },
          message: `第${ci + 1}列声明了数据类型 "${String(typeVal).trim()}" 但缺少字段名，此列将被跳过。`,
          rawValue: typeVal,
          suggestion:
            '请在字段名行为该列填写字段名，或删除类型行中该列的内容。',
        });
      }
      continue;
    }

    const typeStr = String(types[ci] ?? '').trim();

    // 缺少类型声明 → 错误
    if (!typeStr) {
      collector?.add({
        severity: ValidationSeverity.ERROR,
        category: ValidationCategory.MISSING_TYPE,
        location: {
          sheetName: raw.sheetName,
          rowIndex: dtRow < raw.rowCount ? dtRow : -1,
          columnIndex: ci,
          columnName: name,
        },
        message: `字段 "${name}" (第${ci + 1}列) 缺少数据类型声明，已默认使用 string 类型。`,
        suggestion:
          '请在类型行填写正确的数据类型。支持: int, float, string, bool 及其数组形式，或已配置的枚举名。',
      });
    }

    const type: FieldType = typeStr || 'string';

    // 未知类型 → 错误
    if (typeStr) {
      const base = deriveBaseType(typeStr);
      if (!BASE_TYPES.has(base) && !enumKeys.has(base)) {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.UNKNOWN_TYPE,
          location: {
            sheetName: raw.sheetName,
            rowIndex: dtRow < raw.rowCount ? dtRow : -1,
            columnIndex: ci,
            columnName: name,
          },
          message: `字段 "${name}" (第${ci + 1}列) 的类型 "${typeStr}" 无法识别。`,
          rawValue: typeStr,
          suggestion:
            `可用的基础类型: int, float, string, bool, object 及其数组形式。如需使用自定义枚举 "${base}"，请在配置文件的 enums 中定义它。`,
        });
      }
    }

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
