// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.150Z
// 表: LevelConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

/**
 * LevelConfig 配置表接口
 */
public interface ILevelConfig {
    /** 等级 */
    int getLevel();
    void setLevel(int level);
    /** 所需经验 */
    int getExpRequired();
    void setExpRequired(int expRequired);
    /** 最大HP */
    int getMaxHp();
    void setMaxHp(int maxHp);
    /** 最大MP */
    int getMaxMp();
    void setMaxMp(int maxMp);
    /** 解锁技能ID列表 */
    List<Integer> getUnlockSkills();
    void setUnlockSkills(List<Integer> unlockSkills);
}

/**
 * LevelConfig 配置表
 */
public class LevelConfig implements ILevelConfig {
    /** 等级 */
    private int level;
    /** 所需经验 */
    private int expRequired;
    /** 最大HP */
    private int maxHp;
    /** 最大MP */
    private int maxMp;
    /** 解锁技能ID列表 */
    private List<Integer> unlockSkills = new ArrayList<>();

    /** 无参构造函数 */
    public LevelConfig() {}

    /** 全参构造函数 */
    public LevelConfig(
        int level,
        int expRequired,
        int maxHp,
        int maxMp,
        List<Integer> unlockSkills
    ) {
        this.level = level;
        this.expRequired = expRequired;
        this.maxHp = maxHp;
        this.maxMp = maxMp;
        this.unlockSkills = unlockSkills;
    }

    // ======== Getters & Setters ========
    /** 等级 */
    public int getLevel() { return level; }
    /** 等级 */
    public void setLevel(int level) { this.level = level; }
    /** 所需经验 */
    public int getExpRequired() { return expRequired; }
    /** 所需经验 */
    public void setExpRequired(int expRequired) { this.expRequired = expRequired; }
    /** 最大HP */
    public int getMaxHp() { return maxHp; }
    /** 最大HP */
    public void setMaxHp(int maxHp) { this.maxHp = maxHp; }
    /** 最大MP */
    public int getMaxMp() { return maxMp; }
    /** 最大MP */
    public void setMaxMp(int maxMp) { this.maxMp = maxMp; }
    /** 解锁技能ID列表 */
    public List<Integer> getUnlockSkills() { return unlockSkills; }
    /** 解锁技能ID列表 */
    public void setUnlockSkills(List<Integer> unlockSkills) { this.unlockSkills = unlockSkills; }
    // ======== 数据存储（key = level，可遍历） ========

    /** LevelConfig 数据存储 */
    public static class Data
    {
        /** 全部数据，可直接 .forEach / for-each 遍历 */
        public static Map<String, LevelConfig> all = new HashMap<>();

        /** 根据 level 查询 */
        public static LevelConfig get(String key) { return all.get(key); }

        /** 从 JSON 字符串加载（自动兼容 verbose / compact / 纯数组格式） */
        public static void parseData(String jsonStr) {
            com.google.gson.Gson gson = new com.google.gson.Gson();
            com.google.gson.JsonElement root = com.google.gson.JsonParser.parseString(jsonStr);
            com.google.gson.JsonArray rows;

            if (root.isJsonArray()) {
                rows = root.getAsJsonArray();
            } else if (root.isJsonObject()) {
                com.google.gson.JsonObject rootObj = root.getAsJsonObject();
                if (rootObj.has("data") && rootObj.get("data").isJsonArray()) {
                    rows = rootObj.getAsJsonArray("data");
                } else if (rootObj.has("d") && rootObj.get("d").isJsonArray()) {
                    rows = rootObj.getAsJsonArray("d");
                } else {
                    return;
                }
            } else {
                return;
            }

            Map<String, LevelConfig> map = new HashMap<>();
            for (com.google.gson.JsonElement item : rows) {
                LevelConfig record = gson.fromJson(item, LevelConfig.class);
                String keyValue = item.getAsJsonObject().get("level").getAsString();
                map.put(keyValue, record);
            }
            all = map;
        }
    }
}
