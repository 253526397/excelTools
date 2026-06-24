import * as fs from 'fs';
import * as path from 'path';
import { parseExcel, detectFormulaCells } from '../../core/excel-parser';
import { buildTableSchema } from '../../core/schema-builder';
import { extractData } from '../../core/data-extractor';
import { serializeToJson } from '../../core/json-serializer';
import { encryptJsonFiles } from '../../utils/crypto';
import { generateCode } from '../../core/code-generator';
import { loadConfig } from '../../config/config-loader';
import { setLogLevel, info, error, debug, warn } from '../../utils/logger';
import { ValidationCollector, reportValidationIssues } from '../../core/validation-collector';
import {
  collectCandidateEnumNames,
  extractEnumsFromData,
} from '../../core/enum-extractor';

export interface ConvertOptions {
  config?: string;
  lang?: string;
  output?: string;
  sheets?: string;
  templates?: string;
  jsonOnly?: boolean;
  codeOnly?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  compact?: boolean;
}

export async function convertCommand(input: string, options: ConvertOptions): Promise<void> {
  setLogLevel(options.verbose ?? false);

  try {
    // 1. 加载配置
    const config = await loadConfig({
      configPath: options.config,
      lang: options.lang,
      output: options.output,
      templatesDir: options.templates,
      verbose: options.verbose,
    });

    // 2. 解析要处理的表名
    const requestedSheets = options.sheets
      ? options.sheets.split(',').map(s => s.trim())
      : [];

    // 3. 解析 Excel（支持单个文件或目录）
    const inputPath = path.resolve(input);
    const stat = fs.statSync(inputPath);

    let allSheets;
    if (stat.isDirectory()) {
      // 目录模式：收集所有 .xlsx 文件，合并所有 Sheet
      const xlsxFiles = fs.readdirSync(inputPath)
        .filter((f: string) => f.endsWith('.xlsx') && !f.startsWith('~$'))
        .map((f: string) => path.join(inputPath, f));

      if (xlsxFiles.length === 0) {
        error(`目录中未找到 .xlsx 文件: ${inputPath}`);
        process.exit(1);
      }

      info(`找到 ${xlsxFiles.length} 个 Excel 文件`);
      allSheets = [];
      for (const f of xlsxFiles) {
        debug(`解析文件: ${path.basename(f)}`);
        allSheets.push(...parseExcel(f, config.excludeSheets));
      }
    } else {
      // 单文件模式
      allSheets = parseExcel(inputPath, config.excludeSheets);
    }

    if (allSheets.length === 0) {
      error('未找到有效的工作表');
      process.exit(1);
    }

    // 4. 合并同名 Sheet + 提取常量表
    const { mergedSheets, constantSheets } = mergeAndClassify(allSheets, config.rowMapping);

    // 过滤指定的表
    const sheets = requestedSheets.length > 0
      ? mergedSheets.filter((s: { sheetName: string }) => requestedSheets.includes(s.sheetName))
      : mergedSheets;

    if (sheets.length === 0) {
      error(`未找到匹配的工作表: ${requestedSheets.join(', ')}`);
      process.exit(1);
    }

    info(`共 ${sheets.length} 个工作表`);

    // 4. 创建校验收集器 + 检测公式单元格
    const collector = new ValidationCollector();
    detectFormulaCells(allSheets, collector);

    // 5. 提取常量
    const allConstants = extractConstants(constantSheets, config.rowMapping);

    // 6. 自动检测枚举（从数据列收集）
    const dataSheets = sheets;
    let allEnums: Record<string, Record<string, number>> = {};
    let allEnumKeys = new Set<string>();

    if (config.autoDetectEnums !== false) {
      const candidateEnumNames = collectCandidateEnumNames(sheets, config.rowMapping);
      if (candidateEnumNames.size > 0) {
        allEnums = extractEnumsFromData(dataSheets, candidateEnumNames, config.rowMapping, collector);
        allEnumKeys = new Set(Object.keys(allEnums));
        if (Object.keys(allEnums).length > 0) {
          info(`自动检测到 ${Object.keys(allEnums).length} 个枚举: ${Object.keys(allEnums).join(', ')}`);
        }
      }
    }

    // 6. 构建 Schema 并提取数据（仅数据 Sheet）
    const tableDataList = [];

    for (const sheet of dataSheets) {
      const schema = buildTableSchema(sheet, config.rowMapping, allEnumKeys, collector);
      if (!schema) {
        debug(`跳过表 ${sheet.sheetName}：无法构建 Schema`);
        continue;
      }

      const data = extractData(sheet, schema, config.rowMapping, collector);
      if (data.rows.length === 0) {
        debug(`表 ${sheet.sheetName} 无数据行`);
      }

      tableDataList.push(data);
    }

    if (tableDataList.length === 0) {
      error('没有成功解析任何数据表');
      process.exit(1);
    }

    info(`成功解析 ${tableDataList.length} 个数据表`);

    // 7. 校验报告
    if (collector.hasIssues()) {
      reportValidationIssues(collector);
    }

    if (collector.hasErrors()) {
      error('表校验发现错误，转换已中止。请修正以上问题后重试。');
      process.exit(1);
    }

    // 8. Dry-run 模式
    if (options.dryRun) {
      info('[DRY RUN] 验证通过，未写入文件');
      for (const td of tableDataList) {
        info(`  - ${td.tableName}: ${td.rows.length} 行, ${td.fields.length} 字段`);
      }
      return;
    }

    // 9. 清理旧输出
    debug('清理输出目录...');
    cleanDir(path.resolve(config.output.json));
    cleanDir(path.resolve(config.output.code));

    // 10. 输出 JSON
    if (!options.codeOnly) {
      const jsonFormat = options.compact
        ? 'compact'
        : (config.output.jsonFormat ?? 'verbose');
      const jsonOutputDir = path.resolve(config.output.json);
      const mergeJson = config.output.mergeJson ?? false;
      serializeToJson(tableDataList, jsonOutputDir, jsonFormat, mergeJson);

      // 常量注入合并 JSON 或单独输出
      if (allConstants.length > 0) {
        const constObj: Record<string, unknown> = {};
        for (const c of allConstants) constObj[c.name] = c.value;
        const indent = jsonFormat === 'compact' ? 0 : 2;
        if (mergeJson) {
          const mergedPath = path.join(jsonOutputDir, 'config.json');
          if (fs.existsSync(mergedPath)) {
            const merged = JSON.parse(fs.readFileSync(mergedPath, 'utf-8'));
            merged['Config'] = constObj;
            fs.writeFileSync(mergedPath, JSON.stringify(merged, null, indent), 'utf-8');
            info(`常量已注入合并 JSON: ${mergedPath}`);
          }
        } else {
          const constPath = path.join(jsonOutputDir, 'config_constants.json');
          fs.writeFileSync(constPath, JSON.stringify(constObj, null, indent), 'utf-8');
          info(`常量 JSON 已输出: ${constPath}`);
        }
      }

      // 加密输出
      if (config.encrypt?.enabled) {
        const encryptOutputDir = path.resolve(config.output.json, '..', 'encrypt');
        encryptJsonFiles(jsonOutputDir, encryptOutputDir, config.encrypt.key);
      }
    }

    // 11. 生成代码（传入合并后的枚举）
    if (!options.jsonOnly) {
      const sourceFileName = path.basename(inputPath);
      await generateCode(tableDataList, config.languages, config, sourceFileName, allEnums, allConstants);
    }

    info('完成!');
  } catch (err) {
    error(`执行失败: ${err instanceof Error ? err.message : String(err)}`);
    if (options.verbose && err instanceof Error && err.stack) {
      debug(err.stack);
    }
    process.exit(1);
  }
}

/** 清空目录（不存在则忽略） */
function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ========== Sheet 合并与常量提取 ==========

/**
 * 合并同名 Sheet 并分离常量表。
 * - 同名 Sheet：按 key 去重（后面覆盖前面），字段取并集
 * - 常量表（sheetName 以 Config 结尾或等于 Config）：单独提取
 */
function mergeAndClassify(
  allSheets: ReturnType<typeof import('../../core/excel-parser')['parseExcel']>,
  rowMapping: { fieldNames: number; dataTypes: number; comments: number; dataStart: number },
): { mergedSheets: typeof allSheets; constantSheets: typeof allSheets } {
  const { fieldNames: fnRow, dataStart } = rowMapping;

  // 分组
  const groups = new Map<string, typeof allSheets>();
  for (const sheet of allSheets) {
    const name = sheet.sheetName;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(sheet);
  }

  const mergedSheets: typeof allSheets = [];
  const constantSheets: typeof allSheets = [];
  let mergeCount = 0;

  for (const [name, sheets] of groups) {
    // 常量表：仅 sheetName === "Config"（大小写不敏感）
    if (name.toLowerCase() === 'config') {
      constantSheets.push(...sheets);
      continue;
    }

    if (sheets.length === 1) {
      mergedSheets.push(sheets[0]);
      continue;
    }

    // 多个同名 Sheet → 合并
    mergeCount++;
    const merged = mergeSheets(sheets, fnRow, dataStart);
    mergedSheets.push(merged);
  }

  if (mergeCount > 0) info(`合并了 ${mergeCount} 组同名 Sheet`);
  if (constantSheets.length > 0) info(`找到 ${constantSheets.length} 个常量表: ${constantSheets.map(s => s.sheetName).join(', ')}`);

  return { mergedSheets, constantSheets };
}

/** 合并多个同名 Sheet：字段取并集，数据行按第一列去重（后面覆盖前面） */
function mergeSheets(
  sheets: ReturnType<typeof import('../../core/excel-parser')['parseExcel']>,
  fnRow: number,
  dataStart: number,
): (typeof sheets)[0] {
  if (sheets.length === 0) throw new Error('empty sheets');
  const first = sheets[0];

  // 收集所有字段名（并集）
  const fieldSet = new Map<string, number>(); // name → columnIndex
  const allNames: string[][] = [];
  for (const sheet of sheets) {
    const names = fnRow < sheet.rowCount ? sheet.rows[fnRow].map(c => String(c ?? '').trim()).filter(Boolean) : [];
    allNames.push(names);
    for (let i = 0; i < names.length; i++) {
      if (!fieldSet.has(names[i])) fieldSet.set(names[i], fieldSet.size);
    }
  }
  const mergedFields = [...fieldSet.keys()];
  const colCount = mergedFields.length;

  // 构建新的 rows（重新映射列）
  // 复制第一张表的元数据行（fieldNames, dataTypes, comments）
  const headerRows: any[][] = [];
  for (let r = 0; r < dataStart && r < first.rowCount; r++) {
    const row: any[] = new Array(colCount).fill(null);
    // 取第一个有这行的 sheet 来填充
    for (const sheet of sheets) {
      if (r < sheet.rowCount) {
        const srcRow = sheet.rows[r];
        const srcNames = allNames[sheets.indexOf(sheet)];
        for (let ci = 0; ci < srcNames.length; ci++) {
          const targetCi = fieldSet.get(srcNames[ci]);
          if (targetCi !== undefined && row[targetCi] === null) {
            row[targetCi] = srcRow[ci] ?? null;
          }
        }
      }
    }
    headerRows.push(row);
  }

  // 合并数据行（按第一列 key 去重，后面覆盖前面）
  const dataMap = new Map<string, any[]>();
  const overwrittenKeys: string[] = [];
  for (const sheet of sheets) {
    const srcNames = allNames[sheets.indexOf(sheet)];
    for (let r = dataStart; r < sheet.rowCount; r++) {
      const srcRow = sheet.rows[r];
      if (!srcRow || srcRow.every(c => c === null || c === '' || c === undefined)) continue;

      const row: any[] = new Array(colCount).fill(null);
      const keyVal = String(srcRow[0] ?? '');
      const existing = dataMap.get(keyVal);
      if (existing) {
        for (let ci = 0; ci < colCount; ci++) row[ci] = existing[ci];
        overwrittenKeys.push(keyVal);
      }

      // 覆盖当前 sheet 的列
      for (let ci = 0; ci < srcNames.length; ci++) {
        const targetCi = fieldSet.get(srcNames[ci]);
        if (targetCi !== undefined) {
          row[targetCi] = srcRow[ci] ?? null;
        }
      }
      dataMap.set(keyVal, row);
    }
  }

  if (overwrittenKeys.length > 0) {
    warn(`合并 "${first.sheetName}": ${overwrittenKeys.length} 条数据被覆盖, key: [${overwrittenKeys.join(', ')}]`);
  }

  const allRows = [...headerRows, ...dataMap.values()];

  return {
    sheetName: first.sheetName,
    sourceFile: sheets.map(s => s.sourceFile).filter(Boolean).join(', '),
    rows: allRows,
    rowCount: allRows.length,
    colCount,
  };
}

/** 从常量表中提取常量定义 */
function extractConstants(
  sheets: ReturnType<typeof import('../../core/excel-parser')['parseExcel']>,
  rowMapping: { fieldNames: number; dataTypes: number; comments: number; dataStart: number },
): { name: string; type: string; value: unknown; comment: string }[] {
  const { dataStart } = rowMapping;
  const allConstants: { name: string; type: string; value: unknown; comment: string }[] = [];

  for (const sheet of sheets) {
    for (let ri = dataStart; ri < sheet.rowCount; ri++) {
      const row = sheet.rows[ri];
      if (!row || row.every(c => c === null || c === '' || c === undefined)) continue;

      const key = String(row[0] ?? '').trim();
      if (!key) continue;

      const type = String(row[1] ?? 'string').trim() || 'string';
      const rawValue = row[2];
      const comment = String(row[3] ?? '').trim();

      allConstants.push({ name: key, type, value: coerceConstValue(rawValue, type), comment });
    }
  }

  debug(`提取常量: ${allConstants.length} 个`);
  return allConstants;
}

/** 将常量原始值按类型声明转换 */
function coerceConstValue(raw: unknown, type: string): unknown {
  if (raw === null || raw === undefined || raw === '') return null;

  const str = String(raw).trim();
  if (!str) return null;

  const is2D = type.endsWith('[][]');
  const isArray = !is2D && type.endsWith('[]');
  const bt = is2D ? type.slice(0, -4) : isArray ? type.slice(0, -2) : type;

  // 二维数组
  if (is2D) {
    const rows = str.split(';').filter(r => r.trim());
    return rows.map(row => {
      const sep = row.includes('|') ? '|' : ',';
      return row.split(sep).map(s => s.trim()).filter(s => s !== '').map(p => coerceScalarConst(p, bt));
    });
  }

  // 一维数组
  if (isArray) {
    const sep = str.includes('|') ? '|' : str.includes(';') ? ';' : ',';
    return str.split(sep).map(s => s.trim()).filter(s => s !== '').map(p => coerceScalarConst(p, bt));
  }

  return coerceScalarConst(str, bt);
}

function coerceScalarConst(str: string, bt: string): unknown {
  switch (bt) {
    case 'int': { const n = parseInt(str, 10); return isNaN(n) ? 0 : n; }
    case 'float': { const n = parseFloat(str); return isNaN(n) ? 0 : n; }
    case 'bool': return str === 'true' || str === '1';
    case 'string': default: return str;
  }
}
