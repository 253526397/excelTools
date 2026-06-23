// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.097Z
// 表: ItemConfig
// 请勿手动编辑此文件

export interface IItemConfig {
  /** 道具ID */
  id?: number;
  /** 道具名称 */
  name?: string;
  /** 类型 */
  type?: string;
  /** 价格 */
  price?: number;
  /** 可堆叠 */
  stackable?: boolean;
  /** 属性 */
  attributes?: Record<string, unknown>;
}

export class ItemConfig implements IItemConfig {
  /** 道具ID */
  id?: number;
  /** 道具名称 */
  name?: string;
  /** 类型 */
  type?: string;
  /** 价格 */
  price?: number;
  /** 可堆叠 */
  stackable?: boolean;
  /** 属性 */
  attributes?: Record<string, unknown>;

  private static _dataMap: Record<string, IItemConfig> = {};

  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static get dataMap(): Record<string, IItemConfig> {
    return ItemConfig._dataMap;
  }

  /** 根据 id 查询 */
  public static Get(key: number | string): IItemConfig | undefined {
    return ItemConfig.dataMap[String(key)];
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
      ItemConfig._dataMap = obj;
      return;
    }
    const map: Record<string, IItemConfig> = {};
    for (const row of rows) {
      map[String(row.id)] = row as IItemConfig;
    }
    ItemConfig._dataMap = map;
  }
}
