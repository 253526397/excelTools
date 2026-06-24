// 自动生成于 excel 时间: 2026-06-24T06:44:58.976Z
// 表: LevelConfig
// 请勿手动编辑此文件

export interface ILevelConfig {
  /** 等级 */
  level?: number;
  /** 所需经验 */
  expRequired?: number;
  /** 最大HP */
  maxHp?: number;
  /** 最大MP */
  maxMp?: number;
  /** 解锁技能ID列表 */
  unlockSkills: number[];
}

export class LevelConfig {
  /** 数据 Map，key = level，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, ILevelConfig> = {};

  /** 根据 level 查询 */
  public static Get(key: number | string): ILevelConfig | undefined {
    return LevelConfig.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof ILevelConfig, value: any): ILevelConfig | undefined {
    for (const k in LevelConfig.dataMap) {
      if (LevelConfig.dataMap[k][field] == value) return LevelConfig.dataMap[k];
    }
    return undefined;
  }
}

/** LevelConfig 元信息 */
export const LevelConfigMeta = {
  keyField: 'level',
  fieldNames: ["level","expRequired","maxHp","maxMp","unlockSkills"],
};
