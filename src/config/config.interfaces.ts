export type JsonFormat = 'verbose' | 'compact';

export type Language = 'typescript' | 'csharp' | 'java';

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
  };
  templates: {
    customDir?: string | null;
    overrides?: Record<string, string | null>;
  };
  enums: Record<string, Record<string, number>>;
  excludeSheets: string[];
  naming: {
    sheetNameToTableName: CaseStyle;
    fieldNameToPropertyName: CaseStyle;
  };
  languageSettings: Partial<Record<Language, LanguageSettings>>;
  /** 是否从 Excel 中自动检测枚举定义表（默认 true） */
  autoDetectEnums?: boolean;
  verbose: boolean;
}
