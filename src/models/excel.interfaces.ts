/**
 * Excel 行映射配置：定义哪一行分别对应字段名、类型、注释、数据起始
 */
export interface ExcelRowMapping {
  fieldNames: number;  // 字段名所在行（0-based）
  dataTypes: number;   // 数据类型所在行（0-based）
  comments: number;    // 注释说明所在行（0-based，-1 表示无注释行）
  dataStart: number;   // 数据起始行（0-based）
}

export type CellValue = string | number | boolean | null;

/**
 * 原始工作表数据（Excel 解析后的中间格式）
 */
export interface RawSheetData {
  sheetName: string;
  rows: CellValue[][];   // [rowIndex][colIndex]
  rowCount: number;
  colCount: number;
}
