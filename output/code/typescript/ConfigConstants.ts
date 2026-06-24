// 自动生成于 excel 时间: 2026-06-24T06:44:58.993Z
// 常量配置表
// 请勿手动编辑此文件

export class ConfigConstants {
  public static BagMaxCount: number = 0;
  public static IntArray: number[] = [];
  public static IntArray2D: number[][] = [];
  public static stringValue: string = "";
  public static StringArray: string[] = [];
  public static StringArray2D: string[][] = [];

  /** 从 JSON 数据加载常量 */
  public static parseData(obj: any): void {
    if (!obj) return;
    if (obj['BagMaxCount'] !== undefined) ConfigConstants.BagMaxCount = obj['BagMaxCount'];
    if (obj['IntArray'] !== undefined) ConfigConstants.IntArray = obj['IntArray'];
    if (obj['IntArray2D'] !== undefined) ConfigConstants.IntArray2D = obj['IntArray2D'];
    if (obj['stringValue'] !== undefined) ConfigConstants.stringValue = obj['stringValue'];
    if (obj['StringArray'] !== undefined) ConfigConstants.StringArray = obj['StringArray'];
    if (obj['StringArray2D'] !== undefined) ConfigConstants.StringArray2D = obj['StringArray2D'];
  }
}
