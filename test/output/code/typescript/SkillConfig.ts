// 自动生成于 sample.xlsx 时间: 2026-05-08T07:04:50.230Z
// 表: SkillConfig
// 请勿手动编辑此文件
import { SkillType } from './SkillType';

export interface SkillConfig {
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
