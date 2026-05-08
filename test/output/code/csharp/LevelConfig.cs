// 自动生成于 sample.xlsx 时间: 2026-05-08T07:04:50.251Z
// 表: LevelConfig
// 请勿手动编辑此文件

using System.Collections.Generic;

namespace GameConfig
{
    /// <summary>
    /// LevelConfig 配置表
    /// </summary>
    public class LevelConfig
    {
        /// <summary>等级</summary>
        public int Level { get; set; }
        /// <summary>所需经验</summary>
        public int ExpRequired { get; set; }
        /// <summary>最大HP</summary>
        public int MaxHp { get; set; }
        /// <summary>最大MP</summary>
        public int MaxMp { get; set; }
        /// <summary>解锁技能ID列表</summary>
        public List<int> UnlockSkills { get; set; }
    }
}
