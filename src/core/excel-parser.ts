import * as XLSX from 'xlsx';
import type { RawSheetData, CellValue } from '../models/excel.interfaces';
import { debug, warn } from '../utils/logger';

export function parseExcel(
  filePath: string,
  excludeSheets: string[] = []
): RawSheetData[] {
  const workbook = XLSX.readFile(filePath);
  const results: RawSheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    // 跳过隐藏工作表（以 # 或 _ 开头的内部表）
    if (sheetName.startsWith('#') || sheetName.startsWith('_')) {
      debug(`跳过内部工作表: ${sheetName}`);
      continue;
    }

    if (excludeSheets.includes(sheetName)) {
      debug(`跳过排除工作表: ${sheetName}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    // header: 1 表示返回二维数组，不以第一行为键
    const raw = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    }) as CellValue[][];

    if (raw.length === 0) {
      warn(`工作表 "${sheetName}" 为空，已跳过`);
      continue;
    }

    // 找出最大列数
    const colCount = Math.max(...raw.map(row => row.length), 0);
    if (colCount === 0) {
      warn(`工作表 "${sheetName}" 无有效列，已跳过`);
      continue;
    }

    // 补齐每行列数并过滤全空行
    const rows = raw
      .map(row => {
        const padded = [...row];
        while (padded.length < colCount) padded.push(null);
        return padded;
      })
      .filter(row => row.some(cell => cell !== null && cell !== ''));

    if (rows.length === 0) {
      warn(`工作表 "${sheetName}" 无有效数据行，已跳过`);
      continue;
    }

    debug(`解析工作表: ${sheetName} (${rows.length}行 x ${colCount}列)`);

    results.push({
      sheetName,
      rows,
      rowCount: rows.length,
      colCount,
    });
  }

  return results;
}
