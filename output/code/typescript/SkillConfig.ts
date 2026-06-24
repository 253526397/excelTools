// 自动生成于 excel 时间: 2026-06-24T06:44:58.981Z
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

export class SkillConfig {
  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, ISkillConfig> = {};

  /** 根据 id 查询 */
  public static Get(key: number | string): ISkillConfig | undefined {
    return SkillConfig.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof ISkillConfig, value: any): ISkillConfig | undefined {
    for (const k in SkillConfig.dataMap) {
      if (SkillConfig.dataMap[k][field] == value) return SkillConfig.dataMap[k];
    }
    return undefined;
  }
}

/** SkillConfig 元信息 */
export const SkillConfigMeta = {
  keyField: 'id',
  fieldNames: ["id","name","damage","cost","skillType","targetTypes","effects","damageMatrix"],
};
