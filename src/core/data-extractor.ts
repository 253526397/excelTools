import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { TableSchema } from '../models/schema.interfaces';
import type { TableData } from '../models/data.interfaces';
import { warn, debug } from '../utils/logger';
import type { ValidationCollector } from './validation-collector';
import { ValidationSeverity, ValidationCategory } from '../models/validation.interfaces';

/**
 * 提取基础类型：去除末尾的 [] 或 [][]
 */
function getBaseType(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

/**
 * 将单元格字符串值按照声明的类型进行转换
 */
function coerceValue(
  raw: unknown,
  type: string,
  location: { sheetName: string; rowIndex: number; columnIndex: number; columnName: string },
  collector: ValidationCollector | undefined,
): unknown {
  if (raw === null || raw === undefined || raw === '') return null;

  const str = String(raw).trim();
  const baseType = getBaseType(type);
  const is2DArray = type.endsWith('[][]');
  const isArray = !is2DArray && type.endsWith('[]');

  if (is2DArray) {
    // 二维数组：object[][] 优先 JSON.parse
    if (baseType === 'object') {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])
          ? parsed
          : [parsed];
      } catch {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.JSON_PARSE_FAILURE,
          location,
          message: `无法将 "${str}" 解析为 JSON 对象，已回退到分隔符解析。`,
          rawValue: str,
          expectedType: type,
          suggestion: '请确保该单元格填写的是合法的 JSON 格式（如 [["a","b"],["c","d"]]）。',
        });
      }
    }

    // 按 ; 拆分行，再按 , 或 | 拆分列
    const rows = str.split(';').filter(r => r.trim() !== '');
    return rows.map(row => {
      const separator = row.includes('|') ? '|' : ',';
      return row.split(separator)
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(p => coerceScalar(p, baseType, location, collector));
    });
  }

  if (isArray) {
    // object[] 类型：优先尝试 JSON.parse 整个字符串
    if (baseType === 'object') {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.JSON_PARSE_FAILURE,
          location,
          message: `无法将 "${str}" 解析为 JSON 数组，已回退到分隔符解析。`,
          rawValue: str,
          expectedType: type,
          suggestion: '请确保该单元格填写的是合法的 JSON 数组格式（如 ["a","b","c"]）。',
        });
      }
    }

    // 一维数组：按分隔符拆分后逐个转换
    const separator = str.includes('|') ? '|' : str.includes(';') ? ';' : ',';
    const parts = str.split(separator).map(s => s.trim()).filter(s => s !== '');
    return parts.map(p => coerceScalar(p, baseType, location, collector));
  }

  // 非数组 object 类型：直接 JSON.parse
  if (baseType === 'object') {
    try {
      return JSON.parse(str);
    } catch {
      collector?.add({
        severity: ValidationSeverity.ERROR,
        category: ValidationCategory.JSON_PARSE_FAILURE,
        location,
        message: `无法将 "${str}" 解析为 JSON 对象，已保留原始字符串。`,
        rawValue: str,
        expectedType: type,
        suggestion: '请确保该单元格填写的是合法的 JSON 格式（如 {"key":"value"}）。',
      });
      return str;
    }
  }

  return coerceScalar(str, baseType, location, collector);
}

function coerceScalar(
  val: string,
  baseType: string,
  location: { sheetName: string; rowIndex: number; columnIndex: number; columnName: string },
  collector: ValidationCollector | undefined,
): unknown {
  switch (baseType) {
    case 'int': {
      const trimmed = val.trim();
      const n = parseInt(trimmed, 10);
      if (isNaN(n) || !/^-?\d+$/.test(trimmed)) {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.COERCION_FAILURE,
          location,
          message: `无法将 "${val}" 转换为 int 类型，已使用默认值 0。`,
          rawValue: val,
          expectedType: 'int',
          suggestion: '请确保该单元格填写的是整数（如 100），不包含字母、小数点或特殊字符。',
        });
        return 0;
      }
      return n;
    }
    case 'float': {
      const trimmed = val.trim();
      const n = parseFloat(trimmed);
      if (isNaN(n) || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.COERCION_FAILURE,
          location,
          message: `无法将 "${val}" 转换为 float 类型，已使用默认值 0。`,
          rawValue: val,
          expectedType: 'float',
          suggestion: '请确保该单元格填写的是数字（如 1.5 或 100），不包含字母或特殊字符。',
        });
        return 0;
      }
      return n;
    }
    case 'bool': {
      const lower = val.trim().toLowerCase();
      if (lower !== 'true' && lower !== 'false' && val.trim() !== '0' && val.trim() !== '1') {
        collector?.add({
          severity: ValidationSeverity.ERROR,
          category: ValidationCategory.COERCION_FAILURE,
          location,
          message: `无法将 "${val}" 转换为 bool 类型，已使用默认值 false。`,
          rawValue: val,
          expectedType: 'bool',
          suggestion: '请填写 true / false 或 1 / 0。',
        });
        return false;
      }
      return val.trim() === '1' || lower === 'true';
    }
    case 'string':
      return val;
    default:
      // 枚举类型保持原样（字符串）
      return val;
  }
}

export function extractData(
  raw: RawSheetData,
  schema: TableSchema,
  rowMapping: ExcelRowMapping,
  collector?: ValidationCollector,
): TableData {
  const { dataStart } = rowMapping;
  const dataRows: Record<string, unknown>[] = [];
  const keyField = schema.fields[0];
  const seenKeys = new Set<string>();

  for (let ri = dataStart; ri < raw.rowCount; ri++) {
    const row = raw.rows[ri];
    // 跳过全空行
    if (!row || row.every(c => c === null || c === '' || c === undefined)) {
      continue;
    }

    const dataRow: Record<string, unknown> = {};
    let hasValue = false;

    // 检测重复 key
    const rawKey = keyField.columnIndex < row.length ? row[keyField.columnIndex] : null;
    const keyStr = rawKey !== null && rawKey !== undefined ? String(rawKey) : '';
    if (keyStr && seenKeys.has(keyStr)) {
      collector?.add({
        severity: ValidationSeverity.ERROR,
        category: ValidationCategory.COERCION_FAILURE,
        location: { sourceFile: raw.sourceFile, sheetName: raw.sheetName, rowIndex: ri, columnIndex: keyField.columnIndex, columnName: keyField.name },
        message: `主键 "${keyStr}" 重复（与前面的数据行冲突），请检查 ${keyField.name} 列的值是否唯一。`,
        rawValue: rawKey,
        suggestion: '每行数据的第一个字段（主键）在同一个表内必须唯一，请修改重复的值。',
      });
    }
    if (keyStr) seenKeys.add(keyStr);

    for (const field of schema.fields) {
      const rawVal = field.columnIndex < row.length ? row[field.columnIndex] : null;
      const location = {
        sourceFile: raw.sourceFile,
        sheetName: raw.sheetName,
        rowIndex: ri,
        columnIndex: field.columnIndex,
        columnName: field.name,
      };
      const parsed = coerceValue(rawVal, field.type, location, collector);
      dataRow[field.name] = parsed;

      if (parsed !== null && parsed !== undefined && parsed !== '') {
        hasValue = true;
      }
    }

    if (hasValue) {
      dataRows.push(dataRow);
    }
  }

  debug(`表 "${schema.tableName}": 提取 ${dataRows.length} 行数据`);

  return {
    tableName: schema.tableName,
    sourceSheet: schema.sourceSheet,
    fields: schema.fields.map(f => ({
      name: f.name,
      type: f.type,
      comment: f.comment,
    })),
    rows: dataRows,
  };
}
