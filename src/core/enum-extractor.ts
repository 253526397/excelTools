import type { RawSheetData, ExcelRowMapping } from '../models/excel.interfaces';
import type { ValidationCollector } from './validation-collector';
import { debug } from '../utils/logger';

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
): Set<string> {
  const candidates = new Set<string>();
  const { dataTypes: dtRow } = rowMapping;

  for (const sheet of sheets) {
    if (dtRow < 0 || dtRow >= sheet.rowCount) continue;

    const types = sheet.rows[dtRow];
    for (const cell of types) {
      if (cell === null || cell === undefined || cell === '') continue;
      const typeStr = String(cell).trim();
      if (!typeStr) continue;

      const base = deriveBaseType(typeStr);
      if (!BASE_TYPES.has(base)) {
        candidates.add(base);
      }
    }
  }

  debug(`候选枚举名: ${[...candidates].join(', ') || '(无)'}`);
  return candidates;
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
