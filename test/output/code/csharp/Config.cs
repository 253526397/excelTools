// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.131Z
// 所有配置表统一入口
// 请勿手动编辑此文件

using System;
using System.Text.Json;

namespace GameConfig
{
    /// <summary>
    /// 配置表统一入口
    /// </summary>
    public static class Config
    {
        /// <summary>
        /// 解析并加载所有配置表数据
        /// </summary>
        /// <param name="json">合并后的 JSON 字符串（verbose 格式）</param>
        public static void ParseData(string json)
        {
            using var doc = JsonDocument.Parse(json);
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                switch (prop.Name)
                {
                    case "SkillConfig":
                        SkillConfigData.ParseData(prop.Value);
                        break;
                    case "ItemConfig":
                        ItemConfigData.ParseData(prop.Value);
                        break;
                    case "LevelConfig":
                        LevelConfigData.ParseData(prop.Value);
                        break;
                }
            }
        }
    }
}
