// 自动生成于 sample.xlsx 时间: 2026-06-23T12:44:21.234Z
// 表: ItemConfig
// 请勿手动编辑此文件

using System.Collections.Generic;
using System.Text.Json;

namespace GameConfig
{
    /// <summary>
    /// ItemConfig 配置表接口
    /// </summary>
    public interface IItemConfig
    {
        /// <summary>道具ID</summary>
        int Id { get; set; }
        /// <summary>道具名称</summary>
        string Name { get; set; }
        /// <summary>类型</summary>
        string Type { get; set; }
        /// <summary>价格</summary>
        int Price { get; set; }
        /// <summary>可堆叠</summary>
        bool Stackable { get; set; }
        /// <summary>属性</summary>
        Dictionary<string, object> Attributes { get; set; }
    }

    /// <summary>
    /// ItemConfig 配置表
    /// </summary>
    public class ItemConfig : IItemConfig
    {
        /// <summary>道具ID</summary>
        public int Id { get; set; }
        /// <summary>道具名称</summary>
        public string Name { get; set; }
        /// <summary>类型</summary>
        public string Type { get; set; }
        /// <summary>价格</summary>
        public int Price { get; set; }
        /// <summary>可堆叠</summary>
        public bool Stackable { get; set; }
        /// <summary>属性</summary>
        public Dictionary<string, object> Attributes { get; set; }
    }

    /// <summary>
    /// ItemConfig 数据存储（key = id，可遍历）
    /// </summary>
    public static class ItemConfigData
    {
        /// <summary>全部数据，可通过 foreach / LINQ 遍历</summary>
        public static Dictionary<string, ItemConfig> All { get; } = new();

        /// <summary>根据 id 查询</summary>
        public static ItemConfig Get(string key)
        {
            return All.TryGetValue(key, out var value) ? value : null;
        }

        /// <summary>从 JSON 数据加载（自动兼容 verbose / compact / 纯数组格式）</summary>
        public static void ParseData(JsonElement obj)
        {
            var map = new Dictionary<string, ItemConfig>();
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
                var record = JsonSerializer.Deserialize<ItemConfig>(item.GetRawText(), options);
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
