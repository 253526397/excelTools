import * as fs from 'fs';
import * as path from 'path';
import type { Language } from '../config/config.interfaces';

/** 找到项目根目录（向上查找 package.json） */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const PROJECT_ROOT = findProjectRoot(__dirname);

/**
 * 解析模板文件的绝对路径。
 * 查找优先级：自定义目录 > liquidTemplate/（项目根目录）> 内置目录（兼容）
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

  // 2. 查项目根目录下的 liquidTemplate/
  const liquidDir = path.join(PROJECT_ROOT, 'liquidTemplate');
  const liquidPath = path.join(liquidDir, relativePath);
  if (fs.existsSync(liquidPath)) return liquidPath;

  throw new Error(`找不到模板 "${relativePath}": ${liquidPath}`);
}

/**
 * 列出某语言的所有可用模板名称
 */
export function listTemplates(lang: Language, customDir?: string | null): string[] {
  const templates = new Set<string>();

  const dirs = [path.join(PROJECT_ROOT, 'liquidTemplate', lang)];
  if (customDir) dirs.push(path.resolve(customDir, lang));

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith('.liquid')) {
          templates.add(file.replace('.liquid', ''));
        }
      }
    }
  }

  return Array.from(templates).sort();
}
