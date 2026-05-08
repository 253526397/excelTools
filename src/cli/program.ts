import { Command } from 'commander';
import { convertCommand } from './commands/convert.command';
import { initCommand } from './commands/init.command';

const program = new Command();

program
  .name('exceltools')
  .description('将 Excel 配置表转换为 JSON 数据文件和代码文件')
  .version('1.0.0');

program
  .command('convert')
  .description('转换 Excel 文件为 JSON 数据和代码文件')
  .argument('<input>', '输入的 Excel 文件路径 (.xlsx)')
  .option('-l, --lang <languages>', '目标语言(逗号分隔): typescript,csharp,java')
  .option('-o, --output <dir>', '输出根目录', './output')
  .option('-c, --config <path>', '配置文件路径')
  .option('-s, --sheets <names>', '只处理指定工作表(逗号分隔)')
  .option('-t, --templates <dir>', '自定义模板目录')
  .option('--compact', '输出压缩格式的 JSON（列式数据 + 短键名）')
  .option('--json-only', '只生成 JSON 文件')
  .option('--code-only', '只生成代码文件')
  .option('--dry-run', '只检查不写入文件')
  .option('-v, --verbose', '详细日志输出')
  .action(convertCommand);

program
  .command('init')
  .description('在当前目录创建默认的 exceltools.config.json')
  .argument('[dir]', '目标目录（默认为当前目录）')
  .action(initCommand);

export { program };
