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
    },
    templates: {},
    enums: {},
    excludeSheets: [],
    naming: {
      sheetNameToTableName: 'PascalCase',
      fieldNameToPropertyName: 'camelCase',
    },
    languageSettings: {
      typescript: { generateEnums: true, useStringEnum: false },
      csharp: { generateEnums: true, namespace: 'GameConfig', useJsonProperty: true },
      java: { generateEnums: true, package: 'com.game.config', useLombok: true, useJackson: true },
    },
    verbose: false,
  };
}
