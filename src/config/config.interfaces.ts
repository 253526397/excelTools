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
  verbose: boolean;
}
