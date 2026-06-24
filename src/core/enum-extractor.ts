import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { ValidationCollector } from './validation-collector';
import { ValidationSeverity, ValidationCategory } from '../models/validation.interfaces';
import { debug, warn } from '../utils/logger';

const BASE_TYPES = new Set(['int', 'float', 'string', 'bool', 'object']);

/**
 * 剥离末尾的数组标记 [][] 或 []，返回基础类型名
 */
function deriveBaseType(type: string): string {
  if (type.endsWith('[][]')) return type.slice(0, -4);
  if (type.endsWith('[]')) return type.slice(0, -2);
  return type;
}

/**
 * 扫描所有 Sheet 的 dataTypes 行，收集候选枚举名。
 * 候选条件：类型名去掉数组标记后，既不是基础类型也不在 config.enums 中。
 */
export function collectCandidateEnumNames(
  sheets: RawSheetData[],
  rowMapping: ExcelRowMapping,
  configEnums: Record<string, Record<string, number>>,
): Set<string> {
  const candidates = new Set<string>();
  const configEnumKeys = new Set(Object.keys(configEnums));
  const { dataTypes: dtRow } = rowMapping;

  for (const sheet of sheets) {
    if (dtRow < 0 || dtRow >= sheet.rowCount) continue;

    const types = sheet.rows[dtRow];
    for (const cell of types) {
      if (cell === null || cell === undefined || cell === '') continue;
      const typeStr = String(cell).trim();
      if (!typeStr) continue;

      const base = deriveBaseType(typeStr);
      if (!BASE_TYPES.has(base) && !configEnumKeys.has(base)) {
        candidates.add(base);
      }
    }
  }

  debug(`候选枚举名: ${[...candidates].join(', ') || '(无)'}`);
  return candidates;
}

/**
 * 将 Sheet 分类为"枚举定义表"和"数据表"。
 * 规则：sheetName 在 candidateEnumNames 中，且不在 configEnums 中 → 枚举表
 */
export function classifySheets(
  sheets: RawSheetData[],
  candidateEnumNames: Set<string>,
  configEnums: Record<string, Record<string, number>>,
  collector?: ValidationCollector,
): { enumSheets: RawSheetData[]; dataSheets: RawSheetData[] } {
  const enumSheets: RawSheetData[] = [];
  const dataSheets: RawSheetData[] = [];
  const configEnumKeys = new Set(Object.keys(configEnums));

  for (const sheet of sheets) {
    // config.enums 已定义的枚举不会被 Excel 枚举表覆盖（配置优先）
    if (candidateEnumNames.has(sheet.sheetName) && !configEnumKeys.has(sheet.sheetName)) {
      // 基本格式检查：枚举表至少需要2列
      if (sheet.colCount < 2) {
        collector?.add({
          severity: ValidationSeverity.WARNING,
          category: ValidationCategory.UNKNOWN_TYPE,
          location: { sheetName: sheet.sheetName, rowIndex: 0, columnIndex: 0 },
          message: `枚举定义表 "${sheet.sheetName}" 列数不足（需要至少2列: 名称 + 值），已跳过。`,
          suggestion: '枚举表第1列为成员名称，第2列为整数值。请补充列或删除该表。',
        });
        continue;
      }
      enumSheets.push(sheet);
    } else {
      dataSheets.push(sheet);
    }
  }

  return { enumSheets, dataSheets };
}

/**
 * 从枚举定义 Sheet 中提取枚举成员的名称和值。
 *
 * 格式约定（沿用 rowMapping）：
 *   列0 = 枚举成员名称（字符串）
 *   列1 = 枚举成员值（整数）
 *
 * 注意事项：
 *   - 从 rowMapping.dataStart 行开始读取
 *   - 名称为空的行跳过（WARNING）
 *   - 值列无法解析为整数的跳过（WARNING）
 *   - 重复成员名后者覆盖前者（WARNING）
 */
export function extractEnumDefinitions(
  enumSheets: RawSheetData[],
  rowMapping: ExcelRowMapping,
  collector?: ValidationCollector,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  const { dataStart } = rowMapping;

  for (const sheet of enumSheets) {
    const enumName = sheet.sheetName;
    const members: Record<string, number> = {};

    for (let ri = dataStart; ri < sheet.rowCount; ri++) {
      const row = sheet.rows[ri];

      // 跳过全空行
      if (!row || row.every(c => c === null || c === '' || c === undefined)) {
        continue;
      }

      const rawName = row[0];
      const rawValue = row[1];

      const memberName = rawName !== null && rawName !== undefined ? String(rawName).trim() : '';
      if (!memberName) {
        collector?.add({
          severity: ValidationSeverity.WARNING,
          category: ValidationCategory.EMPTY_FIELD_NAME,
          location: { sheetName: sheet.sheetName, rowIndex: ri, columnIndex: 0 },
          message: `枚举 "${enumName}": 第${ri + 1}行缺少成员名称，已跳过。`,
          suggestion: '请为每一行填写枚举成员名称。',
        });
        continue;
      }

      const valueStr = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';
      const value = parseInt(valueStr, 10);
      if (isNaN(value)) {
        collector?.add({
          severity: ValidationSeverity.WARNING,
          category: ValidationCategory.COERCION_FAILURE,
          location: {
            sheetName: sheet.sheetName,
            rowIndex: ri,
            columnIndex: 1,
            columnName: memberName,
          },
          message: `枚举 "${enumName}" 成员 "${memberName}" 的值 "${valueStr}" 无法解析为整数，已跳过。`,
          rawValue: valueStr,
          expectedType: 'int',
          suggestion: '请确保枚举值列为整数数字。',
        });
        continue;
      }

      if (memberName in members) {
        warn(`枚举 "${enumName}" 成员名 "${memberName}" 重复，后者覆盖前者`);
      }

      members[memberName] = value;
    }

    if (Object.keys(members).length === 0) {
      collector?.add({
        severity: ValidationSeverity.WARNING,
        category: ValidationCategory.UNKNOWN_TYPE,
        location: { sheetName: sheet.sheetName, rowIndex: 0, columnIndex: 0 },
        message: `枚举定义表 "${enumName}" 无有效枚举成员。`,
        suggestion: '请确保枚举表的数据行中填写了成员名称和值。',
      });
    }

    result[enumName] = members;
    debug(`从 Excel 提取枚举 "${enumName}": ${Object.keys(members).length} 个成员`);
  }

  return result;
}

/**
 * 从数据 Sheet 的列值中自动收集枚举成员。
 *
 * 当某个候选枚举名没有对应的专用枚举 Sheet 时，就从所有数据表中
 * 引用该类型的列中收集出现过的唯一值，自动编号生成枚举。
 *
 * 例如：
 *   SkillConfig 表的 skillType 列类型为 SkillType，数据中有 Attack/Defense/Heal/Buff
 *   → 自动生成 SkillType 枚举: { Attack: 1, Defense: 2, Heal: 3, Buff: 4 }
 *
 * 对于数组类型列（如 SkillType[]），会按分隔符拆分后收集每个元素。
 *
 * @param dataSheets 数据表列表
 * @param pendingEnumNames 尚未找到专用枚举 Sheet 的候选枚举名
 * @param rowMapping 行映射配置
 * @param collector 校验收集器
 * @returns 从数据中提取的枚举定义，key 为枚举名，value 为 { 成员名: 自增值 }
 */
export function extractEnumsFromData(
  dataSheets: RawSheetData[],
  pendingEnumNames: Set<string>,
  rowMapping: ExcelRowMapping,
  collector?: ValidationCollector,
): Record<string, Record<string, number>> {
  if (pendingEnumNames.size === 0) return {};

  const result: Record<string, Record<string, number>> = {};
  const { dataTypes: dtRow, dataStart } = rowMapping;

  // pendingEnumNames → 收集到的所有唯一值
  const collectedValues = new Map<string, Set<string>>();
  for (const name of pendingEnumNames) {
    collectedValues.set(name, new Set());
  }

  // 遍历所有数据 Sheet，找出引用候选枚举的列，收集数据值
  for (const sheet of dataSheets) {
    if (dtRow < 0 || dtRow >= sheet.rowCount) continue;

    const types = sheet.rows[dtRow];

    for (let ci = 0; ci < types.length; ci++) {
      const cell = types[ci];
      if (cell === null || cell === undefined || cell === '') continue;

      const typeStr = String(cell).trim();
      if (!typeStr) continue;

      const baseType = deriveBaseType(typeStr);
      if (!pendingEnumNames.has(baseType)) continue;

      // 该列引用了候选枚举类型，收集所有数据行的值
      const isArrayType = typeStr.endsWith('[]') && !typeStr.endsWith('[][]');
      const values = collectedValues.get(baseType)!;

      for (let ri = dataStart; ri < sheet.rowCount; ri++) {
        const row = sheet.rows[ri];
        const rawVal = ci < row.length ? row[ci] : null;
        if (rawVal === null || rawVal === undefined || rawVal === '') continue;

        const strVal = String(rawVal).trim();
        if (!strVal) continue;

        if (isArrayType) {
          // 数组类型：按分隔符拆分，收集每个元素
          const separator = strVal.includes('|') ? '|' : strVal.includes(';') ? ';' : ',';
          const parts = strVal.split(separator).map(s => s.trim()).filter(s => s !== '');
          for (const part of parts) {
            values.add(part);
          }
        } else {
          values.add(strVal);
        }
      }
    }
  }

  // 为收集到的值自动编号（按字母排序，编号从 1 开始）
  for (const [enumName, values] of collectedValues) {
    if (values.size === 0) continue;

    const sorted = [...values].sort();
    const members: Record<string, number> = {};
    for (let i = 0; i < sorted.length; i++) {
      members[sorted[i]] = i + 1;
    }

    result[enumName] = members;
    debug(`从数据列自动提取枚举 "${enumName}": ${sorted.length} 个成员 (${sorted.join(', ')})`);
  }

  return result;
}
