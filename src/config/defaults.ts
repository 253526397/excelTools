import type { ExceltoolsConfig, LanguageSettings } from './config.interfaces';

export function defaultLanguageSettings(): LanguageSettings {
  return {
    generateEnums: true,
  };
}

export function defaultConfig(): ExceltoolsConfig {
  return {
    rowMapping: {
      fieldNames: 0,
      dataTypes: 1,
      comments: 2,
      dataStart: 3,
    },
    languages: ['typescript', 'csharp', 'java'],
    output: {
      json: './output/json',
      code: './output/code',
      jsonFormat: 'verbose',
      mergeJson: false,
      codeLangSubDir: true,
    },
    templates: {},
    excludeSheets: [],
    naming: {
      sheetNameToTableName: 'PascalCase',
      fieldNameToPropertyName: 'camelCase',
    },
    languageSettings: {
      typescript: { generateEnums: true, useStringEnum: false },
      csharp: { generateEnums: true, namespace: 'GameConfig', useJsonProperty: true },
      java: { generateEnums: true, package: 'com.game.config', useLombok: true, useJackson: true },
      python: { generateEnums: true },
      go: { generateEnums: true },
      php: { generateEnums: true },
    },
    autoDetectEnums: true,
    encrypt: {
      enabled: false,
      key: 'exceltools2024',
    },
    verbose: false,
  };
}
