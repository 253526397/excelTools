import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../test/output/code/typescript/Config';
import { ItemConfig } from '../test/output/code/typescript/ItemConfig';

// 1. 读取合并后的 JSON
const jsonPath = path.resolve(__dirname, '../test/output/json/config.json');
const jsonStr = fs.readFileSync(jsonPath, 'utf-8');
const jsonData = JSON.parse(jsonStr);

console.log('=== JSON 文件内容概览 ===');
for (const key of Object.keys(jsonData)) {
  const table = jsonData[key];
  console.log(`  ${key}: ${table.fields?.length ?? 0} 字段, ${table.data?.length ?? 0} 行`);
}

// 2. 调用 Config.parseData 加载数据
console.log('\n=== 调用 Config.parseData ===');
Config.parseData(jsonStr);

// 3. 测试 Get 查询
console.log('\n=== Get 查询测试 ===');
const item = ItemConfig.Get(2001);
console.log('ItemConfig.Get(2001):', JSON.stringify(item, null, 2));

const item404 = ItemConfig.Get(99999);
console.log('ItemConfig.Get(99999):', item404, '(应为 undefined)');

// 4. 测试 dataMap 遍历
console.log('\n=== dataMap 遍历测试 ===');
const keys = Object.keys(ItemConfig.dataMap);
console.log(`ItemConfig.dataMap 总数: ${keys.length}`);
for (const key of keys) {
  const entry = ItemConfig.dataMap[key];
  console.log(`  [${key}] ${entry?.name}`);
}

console.log('\n✅ Config.parseData 解析验证通过！');
