export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
}

export enum ValidationCategory {
  /** 单元格包含未计算的公式（以 = 开头） */
  FORMULA_CELL = 'FORMULA_CELL',
  /** 字段有名称但缺少类型声明 */
  MISSING_TYPE = 'MISSING_TYPE',
  /** 类型声明不在已知的基础类型或枚举中 */
  UNKNOWN_TYPE = 'UNKNOWN_TYPE',
  /** 列有类型但缺少字段名 */
  EMPTY_FIELD_NAME = 'EMPTY_FIELD_NAME',
  /** 数据类型转换失败（例如 "abc" 转 int） */
  COERCION_FAILURE = 'COERCION_FAILURE',
  /** JSON.parse 失败（嵌套对象列） */
  JSON_PARSE_FAILURE = 'JSON_PARSE_FAILURE',
}

export interface SourceLocation {
  sheetName: string;
  rowIndex: number;
  columnIndex: number;
  columnName?: string;
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  category: ValidationCategory;
  location: SourceLocation;
  /** 面向策划的中文错误描述 */
  message: string;
  /** 触发问题的原始单元格值 */
  rawValue?: unknown;
  /** 期望的类型（用于转换失败场景） */
  expectedType?: string;
  /** 修复建议 */
  suggestion?: string;
}
