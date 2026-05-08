import * as fs from 'fs';
import * as path from 'path';
import { cosmiconfig } from 'cosmiconfig';
import type { ExceltoolsConfig, Language } from './config.interfaces';
import { defaultConfig } from './defaults';
import { debug } from '../utils/logger';

const ALL_LANGUAGES: Language[] = ['typescript', 'csharp', 'java'];

/**
 * 合并配置：用户配置 + CLI参数 → 最终配置
 * 优先级：CLI参数 > 用户配置文件 > 内置默认值
 */
export async function loadConfig(options: {
  configPath?: string;
  lang?: string;
  output?: string;
  sheets?: string;
  templatesDir?: string;
  jsonOnly?: boolean;
  codeOnly?: boolean;
  verbose?: boolean;
}): Promise<ExceltoolsConfig> {
  // 1. 加载内置默认值
  const config = defaultConfig();

  // 2. 尝试从文件加载配置
  let fileConfig: Partial<ExceltoolsConfig> | null = null;

  if (options.configPath) {
    // 指定配置文件路径
    const configPath = path.resolve(options.configPath);
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      debug(`加载配置文件: ${configPath}`);
    }
  } else {
    // 使用 cosmiconfig 自动搜索
    try {
      const explorer = cosmiconfig('exceltools');
      const result = await explorer.search();
      if (result && !result.isEmpty) {
        fileConfig = result.config as Partial<ExceltoolsConfig>;
        debug(`自动发现配置文件: ${result.filepath}`);
      }
    } catch {
      // cosmiconfig 可能找不到配置，使用默认值即可
    }
  }

  // 3. 合并文件配置
  if (fileConfig) {
    deepMerge(config as any, fileConfig as any);
  }

  // 4. 应用 CLI 参数覆盖
  if (options.lang) {
    config.languages = options.lang.split(',') as Language[];
    validateLanguages(config.languages);
  }

  if (options.output) {
    config.output.json = path.join(options.output, 'json');
    config.output.code = path.join(options.output, 'code');
  }

  if (options.templatesDir) {
    config.templates.customDir = options.templatesDir;
  }

  if (options.verbose !== undefined) {
    config.verbose = options.verbose;
  }

  return config;
}

function validateLanguages(langs: string[]): asserts langs is Language[] {
  const valid = new Set(ALL_LANGUAGES);
  for (const l of langs) {
    if (!valid.has(l as Language)) {
      throw new Error(
        `不支持的语言: "${l}"。支持的语言: ${ALL_LANGUAGES.join(', ')}`
      );
    }
  }
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): void {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];

    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (tv && typeof tv === 'object' && !Array.isArray(tv)) {
        deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
        continue;
      }
    }

    // 直接覆盖
    (target as Record<string, unknown>)[key] = sv;
  }
}
