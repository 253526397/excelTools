import * as fs from 'fs';
import * as path from 'path';
import type { Language, ExceltoolsConfig } from '../config/config.interfaces';
import type { TableData } from '../models/data.interfaces';
import type { FieldSchema } from '../models/schema.interfaces';
import { createTemplateContext } from '../templates/liquid-engine';
import { resolveTemplatePath } from '../templates/template-manager';
import { info, debug, warn } from '../utils/logger';

export async function generateCode(
  tableDataList: TableData[],
  languages: Language[],
  config: ExceltoolsConfig,
  sourceFile: string
): Promise<void> {
  const enumKeys = new Set(Object.keys(config.enums));

  for (const lang of languages) {
    const { liquid, buildVariables } = createTemplateContext(lang, enumKeys);
    const langOutputDir = path.resolve(config.output.code, lang);
    fs.mkdirSync(langOutputDir, { recursive: true });

    const langSettings = config.languageSettings[lang];

    for (const table of tableDataList) {
      // 判断此表是否为枚举表（由配置中的 enums 决定）
      // 或表数据结构的字段中引用了枚举类型
      const hasEnumFields = table.fields.some(
        (f: { type: string }) => enumKeys.has(f.type) || enumKeys.has(f.type.replace('[]', ''))
      );

      // 生成主代码文件
      const mainTemplateName = lang === 'typescript' ? 'interface' : 'class';

      try {
        const templatePath = resolveTemplatePath(
          mainTemplateName,
          lang,
          config.templates.customDir
        );
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const fieldSchemas: FieldSchema[] = table.fields.map(f => ({
          name: f.name,
          type: f.type as FieldSchema['type'],
          comment: f.comment,
          columnIndex: 0,
          isArray: f.type.endsWith('[]') && !f.type.endsWith('[][]'),
          is2DArray: f.type.endsWith('[][]'),
          isEnum: enumKeys.has(f.type.replace('[][]', '').replace('[]', '')),
          isNested: f.type.startsWith('object'),
        }));

        // 计算此表引用的枚举类型
        const importedEnums = fieldSchemas
          .filter(f => f.isEnum)
          .map(f => f.type.replace('[][]', '').replace('[]', ''))
          .filter((v, i, a) => a.indexOf(v) === i);

        const variables = buildVariables({
          tableName: table.tableName,
          sourceFile,
          fields: fieldSchemas,
          namespace: 'namespace' in (langSettings ?? {})
            ? (langSettings as { namespace?: string | null }).namespace
            : null,
          package: 'package' in (langSettings ?? {})
            ? (langSettings as { package?: string | null }).package
            : null,
          importedEnums,
        });

        const rendered = await liquid.parseAndRender(templateSource, variables);

        const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : 'java';
        const filePath = path.join(langOutputDir, `${table.tableName}.${ext}`);
        fs.writeFileSync(filePath, rendered, 'utf-8');
        info(`代码已生成: ${filePath}`);
      } catch (err) {
        warn(`生成 ${lang} 代码失败 (${table.tableName}): ${err instanceof Error ? err.message : err}`);
      }
    }

    // 生成枚举文件
    if (config.enums && Object.keys(config.enums).length > 0) {
      await generateEnumFiles(lang, config, langOutputDir, sourceFile);
    }
  }
}

async function generateEnumFiles(
  lang: Language,
  config: ExceltoolsConfig,
  outputDir: string,
  sourceFile: string
): Promise<void> {
  const { liquid, buildVariables } = createTemplateContext(lang, new Set());
  const langSettings = config.languageSettings[lang];

  for (const [enumName, values] of Object.entries(config.enums)) {
    try {
      const templatePath = resolveTemplatePath('enum', lang, config.templates.customDir);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');

      const variables = {
        enumName,
        values: Object.entries(values).map(([k, v]) => ({ name: k, value: v })),
        sourceFile,
        generatedAt: new Date().toISOString(),
        namespace: langSettings?.namespace ?? null,
        package: langSettings?.package ?? null,
      };

      const rendered = await liquid.parseAndRender(templateSource, variables);

      const ext = lang === 'typescript' ? 'ts' : lang === 'csharp' ? 'cs' : 'java';
      const filePath = path.join(outputDir, `${enumName}.${ext}`);
      fs.writeFileSync(filePath, rendered, 'utf-8');
      info(`枚举已生成: ${filePath}`);
    } catch (err) {
      warn(`生成枚举 ${enumName} (${lang}) 失败: ${err instanceof Error ? err.message : err}`);
    }
  }
}
