// 自动生成于 sample.xlsx 时间: 2026-06-23T12:21:54.136Z
// 表: SkillConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

/**
 * SkillConfig 配置表接口
 */
public interface ISkillConfig {
    /** 技能ID */
    int getId();
    void setId(int id);
    /** 技能名称 */
    String getName();
    void setName(String name);
    /** 伤害值 */
    double getDamage();
    void setDamage(double damage);
    /** 消耗MP */
    int getCost();
    void setCost(int cost);
    /** 技能类型 */
    SkillType getSkillType();
    void setSkillType(SkillType skillType);
    /** 目标类型列表 */
    List<SkillType> getTargetTypes();
    void setTargetTypes(List<SkillType> targetTypes);
    /** 附加效果 */
    List<Map<String, Object>> getEffects();
    void setEffects(List<Map<String, Object>> effects);
    /** 伤害矩阵 */
    List<List<int>> getDamageMatrix();
    void setDamageMatrix(List<List<int>> damageMatrix);
}

/**
 * SkillConfig 配置表
 */
public class SkillConfig implements ISkillConfig {
    /** 技能ID */
    private int id;
    /** 技能名称 */
    private String name;
    /** 伤害值 */
    private double damage;
    /** 消耗MP */
    private int cost;
    /** 技能类型 */
    private SkillType skillType;
    /** 目标类型列表 */
    private List<SkillType> targetTypes = new ArrayList<>();
    /** 附加效果 */
    private List<Map<String, Object>> effects = new ArrayList<>();
    /** 伤害矩阵 */
    private List<List<int>> damageMatrix = new ArrayList<>();

    /** 无参构造函数 */
    public SkillConfig() {}

    /** 全参构造函数 */
    public SkillConfig(
        int id,
        String name,
        double damage,
        int cost,
        SkillType skillType,
        List<SkillType> targetTypes,
        List<Map<String, Object>> effects,
        List<List<int>> damageMatrix
    ) {
        this.id = id;
        this.name = name;
        this.damage = damage;
        this.cost = cost;
        this.skillType = skillType;
        this.targetTypes = targetTypes;
        this.effects = effects;
        this.damageMatrix = damageMatrix;
    }

    // ======== Getters & Setters ========
    /** 技能ID */
    public int getId() { return id; }
    /** 技能ID */
    public void setId(int id) { this.id = id; }
    /** 技能名称 */
    public String getName() { return name; }
    /** 技能名称 */
    public void setName(String name) { this.name = name; }
    /** 伤害值 */
    public double getDamage() { return damage; }
    /** 伤害值 */
    public void setDamage(double damage) { this.damage = damage; }
    /** 消耗MP */
    public int getCost() { return cost; }
    /** 消耗MP */
    public void setCost(int cost) { this.cost = cost; }
    /** 技能类型 */
    public SkillType getSkillType() { return skillType; }
    /** 技能类型 */
    public void setSkillType(SkillType skillType) { this.skillType = skillType; }
    /** 目标类型列表 */
    public List<SkillType> getTargetTypes() { return targetTypes; }
    /** 目标类型列表 */
    public void setTargetTypes(List<SkillType> targetTypes) { this.targetTypes = targetTypes; }
    /** 附加效果 */
    public List<Map<String, Object>> getEffects() { return effects; }
    /** 附加效果 */
    public void setEffects(List<Map<String, Object>> effects) { this.effects = effects; }
    /** 伤害矩阵 */
    public List<List<int>> getDamageMatrix() { return damageMatrix; }
    /** 伤害矩阵 */
    public void setDamageMatrix(List<List<int>> damageMatrix) { this.damageMatrix = damageMatrix; }
    // ======== 数据存储（key = id，可遍历） ========

    /** SkillConfig 数据存储 */
    public static class Data
    {
        /** 全部数据，可直接 .forEach / for-each 遍历 */
        public static Map<String, SkillConfig> all = new HashMap<>();

        /** 根据 id 查询 */
        public static SkillConfig get(String key) { return all.get(key); }

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

            Map<String, SkillConfig> map = new HashMap<>();
            for (com.google.gson.JsonElement item : rows) {
                SkillConfig record = gson.fromJson(item, SkillConfig.class);
                String keyValue = item.getAsJsonObject().get("id").getAsString();
                map.put(keyValue, record);
            }
            all = map;
        }
    }
}
