import * as XLSX from 'xlsx';

// 用代码生成一个示例 Excel 文件用于测试
const workbook = XLSX.utils.book_new();

// Sheet 1: SkillConfig（技能配置表）
const skillData = [
  ['id', 'name', 'damage', 'cost', 'skillType', 'targetTypes', 'effects', 'damageMatrix'],
  ['int', 'string', 'float', 'int', 'SkillType', 'SkillType[]', 'object[]', 'int[][]'],
  ['技能ID', '技能名称', '伤害值', '消耗MP', '技能类型', '目标类型列表', '附加效果', '伤害矩阵'],
  [1001, '火球术', 150.5, 30, 'Attack', 'Enemy', '[{"type":"burn","value":10}]', '10,20,30;40,50,60;70,80,90'],
  [1002, '冰霜箭', 80, 25, 'Attack', 'Enemy', '[{"type":"slow","value":0.3}]', '5,10,15;20,25,30'],
  [1003, '治愈术', 0, 50, 'Heal', 'Ally', '[{"type":"heal","value":200}]', '0,0,0;0,50,0;0,0,0'],
  [1004, '力量祝福', 0, 40, 'Buff', 'Ally', '[{"type":"atkUp","value":0.2}]', '1,2;3,4'],
  [1005, '暗影打击', 300, 60, 'Attack', 'Enemy', '[{"type":"dot","value":50}]', '100,200;300,400;500,600'],
];
const skillSheet = XLSX.utils.aoa_to_sheet(skillData);
XLSX.utils.book_append_sheet(workbook, skillSheet, 'SkillConfig');

// Sheet 2: ItemConfig（道具配置表）
const itemData = [
  ['id', 'name', 'type', 'price', 'stackable', 'attributes'],
  ['int', 'string', 'string', 'int', 'bool', 'object'],
  ['道具ID', '道具名称', '类型', '价格', '可堆叠', '属性'],
  [2001, '生命药水', 'Consumable', 100, true, '{"hp":100}'],
  [2002, '魔法药水', 'Consumable', 120, true, '{"mp":50}'],
  [2003, '铁剑', 'Weapon', 500, false, '{"atk":15,"def":0}'],
  [2004, '皮甲', 'Armor', 300, false, '{"atk":0,"def":10}'],
];
const itemSheet = XLSX.utils.aoa_to_sheet(itemData);
XLSX.utils.book_append_sheet(workbook, itemSheet, 'ItemConfig');

// Sheet 3: LevelConfig（等级配置表）
const levelData = [
  ['level', 'expRequired', 'maxHp', 'maxMp', 'unlockSkills'],
  ['int', 'int', 'int', 'int', 'int[]'],
  ['等级', '所需经验', '最大HP', '最大MP', '解锁技能ID列表'],
  [1, 0, 100, 50, '1001'],
  [2, 100, 150, 75, '1001,1002'],
  [3, 250, 220, 100, '1001,1002,1003'],
  [4, 500, 300, 130, '1001,1002,1003,1004'],
  [5, 1000, 400, 170, '1001,1002,1003,1004,1005'],
];
const levelSheet = XLSX.utils.aoa_to_sheet(levelData);
XLSX.utils.book_append_sheet(workbook, levelSheet, 'LevelConfig');

XLSX.writeFile(workbook, 'test/fixtures/sample.xlsx');
console.log('示例 Excel 已生成: test/fixtures/sample.xlsx');
