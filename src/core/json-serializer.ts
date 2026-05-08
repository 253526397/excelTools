import * as fs from 'fs';
import * as path from 'path';
import type { TableData, SerializableTable } from '../models/data.interfaces';
import { info, debug } from '../utils/logger';

export function serializeToJson(tableDataList: TableData[], outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const table of tableDataList) {
    const serializable: SerializableTable = {
      tableName: table.tableName,
      sourceSheet: table.sourceSheet,
      fields: table.fields,
      data: table.rows,
    };

    const filePath = path.join(outputDir, `${table.tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
    info(`JSON 已输出: ${filePath}`);
    debug(`  ${table.rows.length} 行数据, ${table.fields.length} 个字段`);
  }
}
