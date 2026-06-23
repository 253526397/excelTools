import * as fs from 'fs';
import * as path from 'path';
import type { TableData, SerializableTable, CompactTable } from '../models/data.interfaces';
import { info, debug } from '../utils/logger';

export function serializeToJson(
  tableDataList: TableData[],
  outputDir: string,
  format: 'verbose' | 'compact' = 'verbose',
  mergeIntoOne: boolean = false,
): void {
  fs.mkdirSync(outputDir, { recursive: true });

  if (mergeIntoOne) {
    // 合并模式：所有表输出到一个文件（按表名索引）
    const merged: Record<string, SerializableTable | CompactTable> = {};

    for (const table of tableDataList) {
      if (format === 'compact') {
        const fieldNames = table.fields.map(f => f.name);
        const fieldCount = fieldNames.length;
        const columnarData: unknown[][] = [];
        for (const row of table.rows) {
          const arr = new Array(fieldCount);
          for (let i = 0; i < fieldCount; i++) {
            arr[i] = row[fieldNames[i]];
          }
          columnarData.push(arr);
        }
        merged[table.tableName] = {
          t: table.tableName,
          f: table.fields.map(f => [f.name, f.type, f.comment]),
          d: columnarData,
        };
      } else {
        merged[table.tableName] = {
          tableName: table.tableName,
          sourceSheet: table.sourceSheet,
          fields: table.fields,
          data: table.rows,
        };
      }
    }

    const filename = format === 'compact' ? 'config.json' : 'config.json';
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
    info(`JSON 已合并输出: ${filePath}`);
    debug(`  ${tableDataList.length} 个表`);
  } else {
    // 独立模式：每个表一个文件
    for (const table of tableDataList) {
      const filePath = path.join(outputDir, `${table.tableName}.json`);

      if (format === 'compact') {
        const fieldNames = table.fields.map(f => f.name);
        const fieldCount = fieldNames.length;
        const columnarData: unknown[][] = [];
        for (const row of table.rows) {
          const arr = new Array(fieldCount);
          for (let i = 0; i < fieldCount; i++) {
            arr[i] = row[fieldNames[i]];
          }
          columnarData.push(arr);
        }

        const compact: CompactTable = {
          t: table.tableName,
          f: table.fields.map(f => [f.name, f.type, f.comment]),
          d: columnarData,
        };

        fs.writeFileSync(filePath, JSON.stringify(compact), 'utf-8');
      } else {
        const serializable: SerializableTable = {
          tableName: table.tableName,
          sourceSheet: table.sourceSheet,
          fields: table.fields,
          data: table.rows,
        };

        fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
      }

      info(`JSON 已输出: ${filePath}`);
      debug(`  ${table.rows.length} 行数据, ${table.fields.length} 个字段`);
    }
  }
}
