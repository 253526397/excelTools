// 自动生成于 excel 时间: 2026-06-24T06:44:58.988Z
// 所有配置表统一入口
// 请勿手动编辑此文件
import { ItemConfig, ItemConfigMeta } from './ItemConfig';
import { LevelConfig, LevelConfigMeta } from './LevelConfig';
import { SkillConfig, SkillConfigMeta } from './SkillConfig';
import { ConfigConstants } from './ConfigConstants';

export class Config {
  /**
   * 解析并加载所有配置表数据
   * @param jsonStr 合并后的 JSON 字符串
   */
  public static parseData(jsonStr: string): void {
    const allData: Record<string, any> = JSON.parse(jsonStr);
    Config.loadTable(allData['ItemConfig'], ItemConfigMeta, ItemConfig);
    Config.loadTable(allData['LevelConfig'], LevelConfigMeta, LevelConfig);
    Config.loadTable(allData['SkillConfig'], SkillConfigMeta, SkillConfig);
    // 常量表
    if (allData['Config']) ConfigConstants.parseData(allData['Config']);
  }

  /**
   * 泛型数据加载：将 JSON 对象解析为 key-value map 并注入目标表
   * 自动兼容 verbose / compact（列式→对象重建）/ 纯数组格式
   */
  private static loadTable<T>(
    obj: any,
    meta: { keyField: string; fieldNames: string[] },
    target: { dataMap: Record<string, T> },
  ): void {
    let rows: any[];
    if (Array.isArray(obj)) {
      rows = obj;
    } else if (obj && Array.isArray(obj.data)) {
      rows = obj.data;
    } else if (obj && Array.isArray(obj.d)) {
      // compact 格式：列式数据 → 对象数组
      const names: string[] = obj.f?.map((f: any[]) => f[0]) ?? meta.fieldNames;
      rows = obj.d.map((vals: any[]) => {
        const row: any = {};
        for (let i = 0; i < names.length; i++) {
          row[names[i]] = vals[i];
        }
        return row;
      });
    } else {
      target.dataMap = obj;
      return;
    }
    const map: Record<string, T> = {};
    for (const row of rows) {
      map[String(row[meta.keyField])] = row as T;
    }
    target.dataMap = map;
  }
}
