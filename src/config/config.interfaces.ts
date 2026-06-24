export type JsonFormat = 'verbose' | 'compact';

export type Language = 'typescript' | 'csharp' | 'java' | 'python' | 'go' | 'php';

export type CaseStyle = 'PascalCase' | 'camelCase' | 'snake_case' | 'keep';

export interface LanguageSettings {
  namespace?: string | null;
  package?: string | null;
  generateEnums: boolean;
  useStringEnum?: boolean;
  useJsonProperty?: boolean;
  useLombok?: boolean;
  useJackson?: boolean;
}

export interface ExceltoolsConfig {
  rowMapping: {
    fieldNames: number;
    dataTypes: number;
    comments: number;
    dataStart: number;
  };
  languages: Language[];
  output: {
    json: string;
    code: string;
    jsonFormat?: JsonFormat;
    /** 将所有表的 JSON 合并输出到单个文件（默认 false，每个表独立文件） */
    mergeJson?: boolean;
    /** 代码输出是否按语言分目录（默认 true） */
    codeLangSubDir?: boolean;
  };
  templates: {
    customDir?: string | null;
    overrides?: Record<string, string | null>;
  };
  excludeSheets: string[];
  naming: {
    sheetNameToTableName: CaseStyle;
    fieldNameToPropertyName: CaseStyle;
  };
  languageSettings: Partial<Record<Language, LanguageSettings>>;
  /** 是否从 Excel 中自动检测枚举定义表（默认 true） */
  autoDetectEnums?: boolean;
  /** 加密配置 */
  encrypt?: {
    /** 是否启用加密输出（输出 .dat 文件） */
    enabled: boolean;
    /** 加密密钥 */
    key: string;
  };
  verbose: boolean;
}
