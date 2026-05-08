import * as fs from 'fs';
import * as path from 'path';
import { info, error } from '../../utils/logger';

const DEFAULT_CONFIG = {
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
  },
  templates: {
    customDir: null,
    overrides: {},
  },
  enums: {
    SkillType: {
      Attack: 1,
      Defense: 2,
      Heal: 3,
      Buff: 4,
    },
  },
  excludeSheets: [],
  naming: {
    sheetNameToTableName: 'PascalCase',
    fieldNameToPropertyName: 'camelCase',
  },
  languageSettings: {
    typescript: {
      generateEnums: true,
      useStringEnum: false,
    },
    csharp: {
      namespace: 'GameConfig',
      generateEnums: true,
      useJsonProperty: true,
    },
    java: {
      package: 'com.game.config',
      generateEnums: true,
      useLombok: false,
      useJackson: false,
    },
  },
  verbose: false,
};

export function initCommand(outputDir?: string): void {
  const targetDir = outputDir ? path.resolve(outputDir) : process.cwd();
  const configPath = path.join(targetDir, 'exceltools.config.json');

  if (fs.existsSync(configPath)) {
    error(`配置文件已存在: ${configPath}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  info(`已创建配置文件: ${configPath}`);
}
