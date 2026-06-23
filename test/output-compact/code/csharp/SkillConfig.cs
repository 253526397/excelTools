// 自动生成于 sample.xlsx 时间: 2026-06-23T11:34:32.042Z
// 表: SkillConfig
// 请勿手动编辑此文件

using System.Collections.Generic;

namespace GameConfig
{
    /// <summary>
    /// SkillConfig 配置表
    /// </summary>
    public class SkillConfig
    {
        /// <summary>技能ID</summary>
        public int Id { get; set; }
        /// <summary>技能名称</summary>
        public string Name { get; set; }
        /// <summary>伤害值</summary>
        public float Damage { get; set; }
        /// <summary>消耗MP</summary>
        public int Cost { get; set; }
        /// <summary>技能类型</summary>
        public SkillType SkillType { get; set; }
        /// <summary>目标类型列表</summary>
        public List<SkillType> TargetTypes { get; set; }
        /// <summary>附加效果</summary>
        public List<Dictionary<string, object>> Effects { get; set; }
        /// <summary>伤害矩阵</summary>
        public List<List<int>> DamageMatrix { get; set; }
    }
}
