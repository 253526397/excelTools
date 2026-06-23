import * as path from 'path';
import { parseExcel, detectFormulaCells } from '../../core/excel-parser';
import { buildTableSchema } from '../../core/schema-builder';
import { extractData } from '../../core/data-extractor';
import { serializeToJson } from '../../core/json-serializer';
import { generateCode } from '../../core/code-generator';
import { loadConfig } from '../../config/config-loader';
import { setLogLevel, info, error, debug } from '../../utils/logger';
import { ValidationCollector, reportValidationIssues } from '../../core/validation-collector';
import {
  collectCandidateEnumNames,
  classifySheets,
  extractEnumDefinitions,
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

    // 3. 解析 Excel
    const inputPath = path.resolve(input);
    const allSheets = parseExcel(inputPath, config.excludeSheets);

    if (allSheets.length === 0) {
      error('未找到有效的工作表');
      process.exit(1);
    }

    // 过滤指定的表
    const sheets = requestedSheets.length > 0
      ? allSheets.filter(s => requestedSheets.includes(s.sheetName))
      : allSheets;

    if (sheets.length === 0) {
      error(`未找到匹配的工作表: ${requestedSheets.join(', ')}`);
      process.exit(1);
    }

    info(`找到 ${sheets.length} 个工作表`);

    // 4. 创建校验收集器 + 检测公式单元格
    const collector = new ValidationCollector();
    detectFormulaCells(allSheets, collector);

    // 5. 决定枚举数据来源
    let allEnums: Record<string, Record<string, number>>;
    let allEnumKeys: Set<string>;
    let dataSheets = sheets;

    if (config.autoDetectEnums !== false) {
      // === 自动检测 Excel 枚举 ===

      // Pass 1: 扫描所有 Sheet 的类型行，收集候选枚举名
      const candidateEnumNames = collectCandidateEnumNames(sheets, config.rowMapping, config.enums);

      // Pass 2: 将 Sheet 分类为枚举定义表 / 数据表
      const classification = classifySheets(
        sheets, candidateEnumNames, config.enums, collector
      );
      const { enumSheets } = classification;
      dataSheets = classification.dataSheets;

      info(`枚举定义表: ${enumSheets.length} 个, 数据表: ${dataSheets.length} 个`);

      // Pass 3: 方式一 —— 从专用枚举 Sheet 提取
      const sheetExtractedEnums = extractEnumDefinitions(enumSheets, config.rowMapping, collector);

      // Pass 4: 方式二 —— 剩余候选枚举名（无专用 Sheet）从数据列中自动收集
      const sheetEnumKeys = new Set(Object.keys(sheetExtractedEnums));
      const configEnumKeys = new Set(Object.keys(config.enums));
      const pendingEnumNames = new Set(
        [...candidateEnumNames].filter(name => !sheetEnumKeys.has(name) && !configEnumKeys.has(name))
      );
      const dataExtractedEnums = extractEnumsFromData(
        dataSheets, pendingEnumNames, config.rowMapping, collector
      );

      // 合并枚举（优先级：config.enums > 专用Sheet > 数据列自动收集）
      allEnums = { ...dataExtractedEnums, ...sheetExtractedEnums, ...config.enums };
      allEnumKeys = new Set(Object.keys(allEnums));

      if (Object.keys(sheetExtractedEnums).length > 0) {
        info(`从专用枚举表提取了 ${Object.keys(sheetExtractedEnums).length} 个枚举: ${Object.keys(sheetExtractedEnums).join(', ')}`);
      }
      if (Object.keys(dataExtractedEnums).length > 0) {
        info(`从数据列自动收集了 ${Object.keys(dataExtractedEnums).length} 个枚举: ${Object.keys(dataExtractedEnums).join(', ')}`);
      }
    } else {
      // === 旧流程：仅使用 config.enums ===
      debug('autoDetectEnums=false，仅使用配置文件中的枚举定义');
      allEnums = config.enums;
      allEnumKeys = new Set(Object.keys(allEnums));
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

    // 9. 输出 JSON
    if (!options.codeOnly) {
      const jsonFormat = options.compact
        ? 'compact'
        : (config.output.jsonFormat ?? 'verbose');
      const jsonOutputDir = path.resolve(config.output.json);
      const mergeJson = config.output.mergeJson ?? false;
      serializeToJson(tableDataList, jsonOutputDir, jsonFormat, mergeJson);
    }

    // 10. 生成代码（传入合并后的枚举）
    if (!options.jsonOnly) {
      const sourceFileName = path.basename(inputPath);
      await generateCode(tableDataList, config.languages, config, sourceFileName, allEnums);
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
