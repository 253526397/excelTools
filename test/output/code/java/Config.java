// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.155Z
// 所有配置表统一入口
// 请勿手动编辑此文件
package com.game.config;

import com.google.gson.JsonParser;
import com.google.gson.JsonObject;

/**
 * 配置表统一入口
 */
public class Config {
    /**
     * 解析并加载所有配置表数据
     * @param json 合并后的 JSON 字符串（verbose 格式）
     */
    public static void parseData(String json) {
        JsonObject root = JsonParser.parseString(json).getAsJsonObject();
        for (String key : root.keySet()) {
            switch (key) {
                case "SkillConfig":
                    SkillConfig.Data.parseData(root.get(key).toString());
                    break;
                case "ItemConfig":
                    ItemConfig.Data.parseData(root.get(key).toString());
                    break;
                case "LevelConfig":
                    LevelConfig.Data.parseData(root.get(key).toString());
                    break;
            }
        }
    }
}
