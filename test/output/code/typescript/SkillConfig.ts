// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.080Z
// 表: SkillConfig
// 请勿手动编辑此文件
import { SkillType } from './ConfigEnums';

export interface ISkillConfig {
  /** 技能ID */
  id?: number;
  /** 技能名称 */
  name?: string;
  /** 伤害值 */
  damage?: number;
  /** 消耗MP */
  cost?: number;
  /** 技能类型 */
  skillType?: SkillType;
  /** 目标类型列表 */
  targetTypes: SkillType[];
  /** 附加效果 */
  effects: Record<string, unknown>[];
  /** 伤害矩阵 */
  damageMatrix: number[][];
}

export class SkillConfig implements ISkillConfig {
  /** 技能ID */
  id?: number;
  /** 技能名称 */
  name?: string;
  /** 伤害值 */
  damage?: number;
  /** 消耗MP */
  cost?: number;
  /** 技能类型 */
  skillType?: SkillType;
  /** 目标类型列表 */
  targetTypes: SkillType[] = [];
  /** 附加效果 */
  effects: Record<string, unknown>[] = [];
  /** 伤害矩阵 */
  damageMatrix: number[][] = [];

  private static _dataMap: Record<string, ISkillConfig> = {};

  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static get dataMap(): Record<string, ISkillConfig> {
    return SkillConfig._dataMap;
  }

  /** 根据 id 查询 */
  public static Get(key: number | string): ISkillConfig | undefined {
    return SkillConfig.dataMap[String(key)];
  }

  /** 从 JSON 数据加载（自动兼容 verbose / compact / 纯数组格式） */
  public static parseData(obj: any): void {
    // verbose 格式: { tableName, fields, data[] } → 取 data
    // compact 格式: { f, d[] } → 取 d
    // 纯数组格式: [...] → 直接使用
    let rows: any[];
    if (Array.isArray(obj)) {
      rows = obj;
    } else if (obj && Array.isArray(obj.data)) {
      rows = obj.data;
    } else if (obj && Array.isArray(obj.d)) {
      rows = obj.d;
    } else {
      // 已经是 key→value 映射
      SkillConfig._dataMap = obj;
      return;
    }
    const map: Record<string, ISkillConfig> = {};
    for (const row of rows) {
      map[String(row.id)] = row as ISkillConfig;
    }
    SkillConfig._dataMap = map;
  }
}
