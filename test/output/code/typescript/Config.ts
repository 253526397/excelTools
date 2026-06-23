// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.111Z
// 所有配置表统一入口
// 请勿手动编辑此文件
import { SkillConfig } from './SkillConfig';
import { ItemConfig } from './ItemConfig';
import { LevelConfig } from './LevelConfig';

export class Config {
  /**
   * 解析并加载所有配置表数据
   * @param jsonStr 合并后的 JSON 字符串（verbose 格式: { TableName: { data: [...] }, ... }）
   */
  public static parseData(jsonStr: string): void {
    const allData: Record<string, any> = JSON.parse(jsonStr);
    SkillConfig.parseData(allData['SkillConfig']);
    ItemConfig.parseData(allData['ItemConfig']);
    LevelConfig.parseData(allData['LevelConfig']);
  }
}
