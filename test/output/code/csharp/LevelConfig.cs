// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.128Z
// 表: LevelConfig
// 请勿手动编辑此文件

using System.Collections.Generic;
using System.Text.Json;

namespace GameConfig
{
    /// <summary>
    /// LevelConfig 配置表接口
    /// </summary>
    public interface ILevelConfig
    {
        /// <summary>等级</summary>
        int Level { get; set; }
        /// <summary>所需经验</summary>
        int ExpRequired { get; set; }
        /// <summary>最大HP</summary>
        int MaxHp { get; set; }
        /// <summary>最大MP</summary>
        int MaxMp { get; set; }
        /// <summary>解锁技能ID列表</summary>
        List<int> UnlockSkills { get; set; }
    }

    /// <summary>
    /// LevelConfig 配置表
    /// </summary>
    public class LevelConfig : ILevelConfig
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
        public List<int> UnlockSkills { get; set; } = new();
    }

    /// <summary>
    /// LevelConfig 数据存储（key = level，可遍历）
    /// </summary>
    public static class LevelConfigData
    {
        /// <summary>全部数据，可通过 foreach / LINQ 遍历</summary>
        public static Dictionary<string, LevelConfig> All { get; } = new();

        /// <summary>根据 level 查询</summary>
        public static LevelConfig Get(string key)
        {
            return All.TryGetValue(key, out var value) ? value : null;
        }

        /// <summary>从 JSON 数据加载（自动兼容 verbose / compact / 纯数组格式）</summary>
        public static void ParseData(JsonElement obj)
        {
            var map = new Dictionary<string, LevelConfig>();
            JsonElement rows;

            if (obj.ValueKind == JsonValueKind.Array)
            {
                rows = obj;
            }
            else if (obj.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Array)
            {
                rows = dataProp;
            }
            else if (obj.TryGetProperty("d", out var dProp) && dProp.ValueKind == JsonValueKind.Array)
            {
                rows = dProp;
            }
            else
            {
                return;
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            foreach (var item in rows.EnumerateArray())
            {
                var record = JsonSerializer.Deserialize<LevelConfig>(item.GetRawText(), options);
                if (record != null)
                {
                    var keyValue = item.GetProperty("level").ToString();
                    map[keyValue] = record;
                }
            }
            All = map;
        }
    }
}
