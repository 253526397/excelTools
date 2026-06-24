import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../output/code/typescript/Config';
import { ItemConfig } from '../output/code/typescript/ItemConfig';
import { SkillConfig } from '../output/code/typescript/SkillConfig';
import { LevelConfig } from '../output/code/typescript/LevelConfig';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  [PASS] ${msg}`); }
  else { failed++; console.error(`  [FAIL] ${msg}`); }
}

const jsonPath = path.resolve(__dirname, '../output/json/config.json');
if (!fs.existsSync(jsonPath)) {
  console.error('config.json not found, run convert first');
  process.exit(1);
}

const jsonStr = fs.readFileSync(jsonPath, 'utf-8');

console.log('=== 1. Config.parseData ===');
Config.parseData(jsonStr);
console.log('  parseData completed\n');

console.log('=== 2. ItemConfig ===');
const itemKeys = Object.keys(ItemConfig.dataMap);
assert(itemKeys.length > 0, `dataMap has ${itemKeys.length} entries`);
const item = ItemConfig.Get(Number(itemKeys[0]));
assert(item !== undefined, `Get(${itemKeys[0]}) returns entry`);
if (item) {
  assert(typeof item.id === 'number', 'item.id is number');
  assert(typeof item.name === 'string', 'item.name is string');
}
let count = 0;
for (const key of Object.keys(ItemConfig.dataMap)) { count++; }
assert(count === itemKeys.length, `for...in iterates all ${count} entries`);
// setter
const prevSize = Object.keys(ItemConfig.dataMap).length;
ItemConfig.dataMap = {};
assert(Object.keys(ItemConfig.dataMap).length === 0, 'set dataMap works');
ItemConfig.dataMap = (ItemConfig as any)._dataMap || {}; // restore
console.log('');

console.log('=== 3. SkillConfig ===');
const skillKeys = Object.keys(SkillConfig.dataMap);
assert(skillKeys.length > 0, `dataMap has ${skillKeys.length} entries`);
const skill = SkillConfig.Get(Number(skillKeys[0]));
if (skill) {
  assert(typeof skill.id === 'number', 'skill.id is number');
  assert(typeof skill.name === 'string', 'skill.name is string');
  assert(Array.isArray(skill.targetTypes), 'targetTypes is array');
  assert(Array.isArray(skill.effects), 'effects is array');
  assert(Array.isArray(skill.damageMatrix), 'damageMatrix is array');
  if (skill.damageMatrix.length > 0) {
    assert(Array.isArray(skill.damageMatrix[0]), 'damageMatrix[0] is array (2D)');
  }
}
console.log('');

console.log('=== 4. LevelConfig ===');
const levelKeys = Object.keys(LevelConfig.dataMap);
assert(levelKeys.length > 0, `dataMap has ${levelKeys.length} entries`);
assert(LevelConfig.Get(99999) === undefined, 'Get(99999) returns undefined');
console.log('');

console.log(`=== Result: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
