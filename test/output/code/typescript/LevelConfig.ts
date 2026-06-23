// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.104Z
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

export class LevelConfig implements ILevelConfig {
  /** 等级 */
  level?: number;
  /** 所需经验 */
  expRequired?: number;
  /** 最大HP */
  maxHp?: number;
  /** 最大MP */
  maxMp?: number;
  /** 解锁技能ID列表 */
  unlockSkills: number[] = [];

  private static _dataMap: Record<string, ILevelConfig> = {};

  /** 数据 Map，key = level，可直接 for...in / Object.keys 遍历 */
  public static get dataMap(): Record<string, ILevelConfig> {
    return LevelConfig._dataMap;
  }

  /** 根据 level 查询 */
  public static Get(key: number | string): ILevelConfig | undefined {
    return LevelConfig.dataMap[String(key)];
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
      LevelConfig._dataMap = obj;
      return;
    }
    const map: Record<string, ILevelConfig> = {};
    for (const row of rows) {
      map[String(row.level)] = row as ILevelConfig;
    }
    LevelConfig._dataMap = map;
  }
}
