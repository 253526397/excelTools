import type { ValidationIssue } from '../models/validation.interfaces';
import { ValidationSeverity } from '../models/validation.interfaces';
import { columnLetter } from '../models/excel.interfaces';

export class ValidationCollector {
  private issues: ValidationIssue[] = [];

  add(issue: ValidationIssue): void { this.issues.push(issue); }
  addAll(issues: ValidationIssue[]): void { this.issues.push(...issues); }
  getAll(): ValidationIssue[] { return this.issues; }
  getErrors(): ValidationIssue[] { return this.issues.filter(i => i.severity === ValidationSeverity.ERROR); }
  getWarnings(): ValidationIssue[] { return this.issues.filter(i => i.severity === ValidationSeverity.WARNING); }
  hasErrors(): boolean { return this.issues.some(i => i.severity === ValidationSeverity.ERROR); }
  hasIssues(): boolean { return this.issues.length > 0; }
}

export function reportValidationIssues(collector: ValidationCollector): void {
  const all = collector.getAll();
  if (all.length === 0) return;

  const errorCount = collector.getErrors().length;
  const warnCount = collector.getWarnings().length;
  const prefix = errorCount > 0 ? 'FAIL' : 'PASS';

  console.error(`\n========================================`);
  console.error(`  [${prefix}] 表校验: ${errorCount} 错误, ${warnCount} 警告`);
  console.error(`========================================`);

  // 按文件 → 工作表分组
  const byFile = new Map<string, Map<string, ValidationIssue[]>>();
  for (const issue of all) {
    const file = issue.location.sourceFile || '(未知文件)';
    if (!byFile.has(file)) byFile.set(file, new Map());
    const sheets = byFile.get(file)!;
    const key = issue.location.sheetName;
    if (!sheets.has(key)) sheets.set(key, []);
    sheets.get(key)!.push(issue);
  }

  for (const [file, sheets] of byFile) {
    if (byFile.size > 1) console.error(`\n文件: ${file}`);

    for (const [sheetName, issues] of sheets) {
      console.error(`\n  [${sheetName}] ${issues.length} 个问题:`);
      issues.sort((a, b) => a.location.rowIndex - b.location.rowIndex || a.location.columnIndex - b.location.columnIndex);

      for (const issue of issues) {
        const tag = issue.severity === 'error' ? '[错误]' : '[警告]';
        const pos = `行${issue.location.rowIndex + 1} 列${columnLetter(issue.location.columnIndex)}(${issue.location.columnIndex + 1})`;
        const field = issue.location.columnName ? ` [${issue.location.columnName}]` : '';
        console.error(`    ${tag} ${pos}${field}`);
        console.error(`          ${issue.message}`);
        if (issue.rawValue !== undefined && issue.rawValue !== null) {
          const raw = typeof issue.rawValue === 'string' ? issue.rawValue : JSON.stringify(issue.rawValue);
          console.error(`          原始值: ${raw}`);
        }
        if (issue.expectedType) {
          console.error(`          期望类型: ${issue.expectedType}`);
        }
        if (issue.suggestion) {
          console.error(`          → ${issue.suggestion}`);
        }
      }
    }
  }

  console.error(`\n========================================`);
  console.error(`  共计: ${errorCount} 错误, ${warnCount} 警告`);
  console.error(`========================================\n`);
}
