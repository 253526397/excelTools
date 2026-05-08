import * as fs from 'fs';
import * as path from 'path';
import type { TableData, SerializableTable, CompactTable } from '../models/data.interfaces';
import { info, debug } from '../utils/logger';

export function serializeToJson(
  tableDataList: TableData[],
  outputDir: string,
  format: 'verbose' | 'compact' = 'verbose',
): void {
  fs.mkdirSync(outputDir, { recursive: true });

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
