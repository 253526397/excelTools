// 自动生成于 excel 时间: 2026-06-24T06:58:07.128Z
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
  /** 描述 */
  des?: string;
}

export class ItemConfig {
  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, IItemConfig> = {};

  /** 根据 id 查询 */
  public static Get(key: number | string): IItemConfig | undefined {
    return ItemConfig.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof IItemConfig, value: any): IItemConfig | undefined {
    for (const k in ItemConfig.dataMap) {
      if (ItemConfig.dataMap[k][field] == value) return ItemConfig.dataMap[k];
    }
    return undefined;
  }
}

/** ItemConfig 元信息 */
export const ItemConfigMeta = {
  keyField: 'id',
  fieldNames: ["id","name","type","price","stackable","attributes","des"],
};
