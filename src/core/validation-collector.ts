import type { ValidationIssue } from '../models/validation.interfaces';
import { ValidationSeverity } from '../models/validation.interfaces';

export class ValidationCollector {
  private issues: ValidationIssue[] = [];

  add(issue: ValidationIssue): void {
    this.issues.push(issue);
  }

  addAll(issues: ValidationIssue[]): void {
    this.issues.push(...issues);
  }

  getAll(): ValidationIssue[] {
    return this.issues;
  }

  getErrors(): ValidationIssue[] {
    return this.issues.filter(i => i.severity === ValidationSeverity.ERROR);
  }

  getWarnings(): ValidationIssue[] {
    return this.issues.filter(i => i.severity === ValidationSeverity.WARNING);
  }

  hasErrors(): boolean {
    return this.issues.some(i => i.severity === ValidationSeverity.ERROR);
  }

  hasIssues(): boolean {
    return this.issues.length > 0;
  }
}

export function reportValidationIssues(collector: ValidationCollector): void {
  const all = collector.getAll();
  if (all.length === 0) return;

  const errorCount = collector.getErrors().length;
  const warnCount = collector.getWarnings().length;

  console.error(`\n========================================`);
  console.error(`  表校验报告`);
  console.error(`========================================`);

  // 按工作表分组
  const bySheet = new Map<string, ValidationIssue[]>();
  for (const issue of all) {
    const key = issue.location.sheetName;
    if (!bySheet.has(key)) bySheet.set(key, []);
    bySheet.get(key)!.push(issue);
  }

  for (const [sheetName, issues] of bySheet) {
    console.error(`\n--- 工作表: ${sheetName} (${issues.length} 个问题) ---`);
    issues.sort(
      (a, b) =>
        a.location.rowIndex - b.location.rowIndex ||
        a.location.columnIndex - b.location.columnIndex,
    );

    for (const issue of issues) {
      const prefix = issue.severity === 'error' ? '[错误]' : '[警告]';
      const pos = `行${issue.location.rowIndex + 1} 列${issue.location.columnIndex + 1}`;
      const field = issue.location.columnName ? ` [字段: ${issue.location.columnName}]` : '';
      console.error(`  ${prefix} (${pos}${field}) ${issue.message}`);
      if (issue.suggestion) {
        console.error(`         建议: ${issue.suggestion}`);
      }
    }
  }

  console.error(`\n========================================`);
  console.error(`  总计: ${errorCount} 个错误, ${warnCount} 个警告`);
  console.error(`========================================\n`);
}
