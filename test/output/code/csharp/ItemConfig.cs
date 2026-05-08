// 自动生成于 sample.xlsx 时间: 2026-05-08T07:04:50.249Z
// 表: ItemConfig
// 请勿手动编辑此文件

using System.Collections.Generic;

namespace GameConfig
{
    /// <summary>
    /// ItemConfig 配置表
    /// </summary>
    public class ItemConfig
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
}
