import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { TableSchema } from '../models/schema.interfaces';
import type { TableData } from '../models/data.interfaces';
import { warn, debug } from '../utils/logger';

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
function coerceValue(raw: unknown, type: string): unknown {
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
        // 回退到分隔逻辑
      }
    }

    // 按 ; 拆分行，再按 , 或 | 拆分列
    const rows = str.split(';').filter(r => r.trim() !== '');
    return rows.map(row => {
      const separator = row.includes('|') ? '|' : ',';
      return row.split(separator)
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(p => coerceScalar(p, baseType));
    });
  }

  if (isArray) {
    // object[] 类型：优先尝试 JSON.parse 整个字符串
    if (baseType === 'object') {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // 回退到普通分隔逻辑
      }
    }

    // 一维数组：按分隔符拆分后逐个转换
    const separator = str.includes('|') ? '|' : str.includes(';') ? ';' : ',';
    const parts = str.split(separator).map(s => s.trim()).filter(s => s !== '');
    return parts.map(p => coerceScalar(p, baseType));
  }

  // 非数组 object 类型：直接 JSON.parse
  if (baseType === 'object') {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  return coerceScalar(str, baseType);
}

function coerceScalar(val: string, baseType: string): unknown {
  switch (baseType) {
    case 'int':
      return parseInt(val, 10) || 0;
    case 'float':
      return parseFloat(val) || 0;
    case 'bool':
      return val === '1' || val.toLowerCase() === 'true';
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
  rowMapping: ExcelRowMapping
): TableData {
  const { dataStart } = rowMapping;
  const dataRows: Record<string, unknown>[] = [];

  for (let ri = dataStart; ri < raw.rowCount; ri++) {
    const row = raw.rows[ri];
    // 跳过全空行
    if (!row || row.every(c => c === null || c === '' || c === undefined)) {
      continue;
    }

    const dataRow: Record<string, unknown> = {};
    let hasValue = false;

    for (const field of schema.fields) {
      const rawVal = field.columnIndex < row.length ? row[field.columnIndex] : null;
      const parsed = coerceValue(rawVal, field.type);
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
