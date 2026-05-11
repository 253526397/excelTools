import * as path from 'path';
import { parseExcel, detectFormulaCells } from '../../core/excel-parser';
import { buildTableSchema } from '../../core/schema-builder';
import { extractData } from '../../core/data-extractor';
import { serializeToJson } from '../../core/json-serializer';
import { generateCode } from '../../core/code-generator';
import { loadConfig } from '../../config/config-loader';
import { setLogLevel, info, error, debug } from '../../utils/logger';
import { ValidationCollector, reportValidationIssues } from '../../core/validation-collector';

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

    // 5. 构建 Schema 并提取数据
    const enumKeys = new Set(Object.keys(config.enums));
    const tableDataList = [];

    for (const sheet of sheets) {
      const schema = buildTableSchema(sheet, config.rowMapping, enumKeys, collector);
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

    // 6. 校验报告
    if (collector.hasIssues()) {
      reportValidationIssues(collector);
    }

    if (collector.hasErrors()) {
      error('表校验发现错误，转换已中止。请修正以上问题后重试。');
      process.exit(1);
    }

    // 7. Dry-run 模式
    if (options.dryRun) {
      info('[DRY RUN] 验证通过，未写入文件');
      for (const td of tableDataList) {
        info(`  - ${td.tableName}: ${td.rows.length} 行, ${td.fields.length} 字段`);
      }
      return;
    }

    // 8. 输出 JSON
    if (!options.codeOnly) {
      const jsonFormat = options.compact
        ? 'compact'
        : (config.output.jsonFormat ?? 'verbose');
      const jsonOutputDir = path.resolve(config.output.json);
      serializeToJson(tableDataList, jsonOutputDir, jsonFormat);
    }

    // 7. 生成代码
    if (!options.jsonOnly) {
      const sourceFileName = path.basename(inputPath);
      await generateCode(tableDataList, config.languages, config, sourceFileName);
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
