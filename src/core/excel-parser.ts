import * as XLSX from 'xlsx';
import * as path from 'path';
import type { RawSheetData, CellValue } from '../models/excel.interfaces';
import { debug, warn } from '../utils/logger';
import type { ValidationCollector } from './validation-collector';
import { ValidationSeverity, ValidationCategory } from '../models/validation.interfaces';

export function parseExcel(
  filePath: string,
  excludeSheets: string[] = []
): RawSheetData[] {
  const workbook = XLSX.readFile(filePath);
  const sourceFile = path.basename(filePath);
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
      sourceFile,
      rows,
      rowCount: rows.length,
      colCount,
    });
  }

  return results;
}

/** 检测原始工作表中未计算的公式单元格（以 = 开头） */
export function detectFormulaCells(
  sheets: RawSheetData[],
  collector: ValidationCollector,
): void {
  for (const sheet of sheets) {
    for (let ri = 0; ri < sheet.rowCount; ri++) {
      const row = sheet.rows[ri];
      for (let ci = 0; ci < row.length; ci++) {
        const cell = row[ci];
        if (typeof cell === 'string' && /^=/.test(cell)) {
          collector.add({
            severity: ValidationSeverity.ERROR,
            category: ValidationCategory.FORMULA_CELL,
            location: { sheetName: sheet.sheetName, rowIndex: ri, columnIndex: ci },
            message: `单元格包含未计算的公式: "${cell}"。请在 Excel 中保存文件以计算公式，或删除公式并直接填写值。`,
            rawValue: cell,
            suggestion:
              '单元格输入了公式但工具无法计算结果。确认公式正确后，在 Excel 中按 Ctrl+S 保存，确保公式被计算为值后重新导出。',
          });
        }
      }
    }
  }
}
