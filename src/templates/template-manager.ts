import * as fs from 'fs';
import * as path from 'path';
import type { Language } from '../config/config.interfaces';

/**
 * 解析模板文件的绝对路径。
 * 查找优先级：自定义目录 > 内置模板目录
 */
export function resolveTemplatePath(
  templateName: string,
  lang: Language,
  customDir?: string | null
): string {
  const relativePath = path.join(lang, `${templateName}.liquid`);

  // 1. 先查自定义目录
  if (customDir) {
    const customPath = path.resolve(customDir, relativePath);
    if (fs.existsSync(customPath)) return customPath;
  }

  // 2. 查内置模板目录（src/templates/builtin/）
  const builtinDir = path.resolve(__dirname, '..', 'templates', 'builtin');
  const builtinPath = path.join(builtinDir, relativePath);
  if (fs.existsSync(builtinPath)) return builtinPath;

  // 3. 查项目根目录下的 templates/ 目录
  const rootTemplatesDir = path.resolve(__dirname, '..', '..', 'templates');
  const rootPath = path.join(rootTemplatesDir, relativePath);
  if (fs.existsSync(rootPath)) return rootPath;

  throw new Error(`找不到模板 "${relativePath}"，已查找自定义目录和内置模板目录`);
}

/**
 * 列出某语言的所有可用模板名称
 */
export function listTemplates(lang: Language, customDir?: string | null): string[] {
  const templates = new Set<string>();

  // 内置模板
  const builtinDir = path.resolve(__dirname, '..', 'templates', 'builtin', lang);
  if (fs.existsSync(builtinDir)) {
    for (const file of fs.readdirSync(builtinDir)) {
      if (file.endsWith('.liquid')) {
        templates.add(file.replace('.liquid', ''));
      }
    }
  }

  // 自定义模板
  if (customDir) {
    const customLangDir = path.resolve(customDir, lang);
    if (fs.existsSync(customLangDir)) {
      for (const file of fs.readdirSync(customLangDir)) {
        if (file.endsWith('.liquid')) {
          templates.add(file.replace('.liquid', ''));
        }
      }
    }
  }

  return Array.from(templates).sort();
}
