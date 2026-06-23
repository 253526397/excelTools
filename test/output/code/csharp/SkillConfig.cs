// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.116Z
// 表: SkillConfig
// 请勿手动编辑此文件

using System.Collections.Generic;
using System.Text.Json;

namespace GameConfig
{
    /// <summary>
    /// SkillConfig 配置表接口
    /// </summary>
    public interface ISkillConfig
    {
        /// <summary>技能ID</summary>
        int Id { get; set; }
        /// <summary>技能名称</summary>
        string Name { get; set; }
        /// <summary>伤害值</summary>
        float Damage { get; set; }
        /// <summary>消耗MP</summary>
        int Cost { get; set; }
        /// <summary>技能类型</summary>
        SkillType SkillType { get; set; }
        /// <summary>目标类型列表</summary>
        List<SkillType> TargetTypes { get; set; }
        /// <summary>附加效果</summary>
        List<Dictionary<string, object>> Effects { get; set; }
        /// <summary>伤害矩阵</summary>
        List<List<int>> DamageMatrix { get; set; }
    }

    /// <summary>
    /// SkillConfig 配置表
    /// </summary>
    public class SkillConfig : ISkillConfig
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
        public List<SkillType> TargetTypes { get; set; } = new();
        /// <summary>附加效果</summary>
        public List<Dictionary<string, object>> Effects { get; set; } = new();
        /// <summary>伤害矩阵</summary>
        public List<List<int>> DamageMatrix { get; set; } = new();
    }

    /// <summary>
    /// SkillConfig 数据存储（key = id，可遍历）
    /// </summary>
    public static class SkillConfigData
    {
        /// <summary>全部数据，可通过 foreach / LINQ 遍历</summary>
        public static Dictionary<string, SkillConfig> All { get; } = new();

        /// <summary>根据 id 查询</summary>
        public static SkillConfig Get(string key)
        {
            return All.TryGetValue(key, out var value) ? value : null;
        }

        /// <summary>从 JSON 数据加载（自动兼容 verbose / compact / 纯数组格式）</summary>
        public static void ParseData(JsonElement obj)
        {
            var map = new Dictionary<string, SkillConfig>();
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
                var record = JsonSerializer.Deserialize<SkillConfig>(item.GetRawText(), options);
                if (record != null)
                {
                    var keyValue = item.GetProperty("id").ToString();
                    map[keyValue] = record;
                }
            }
            All = map;
        }
    }
}
