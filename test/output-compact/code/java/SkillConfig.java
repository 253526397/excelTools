// 自动生成于 sample.xlsx 时间: 2026-06-23T11:34:32.057Z
// 表: SkillConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * SkillConfig 配置表
 */
public class SkillConfig {
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
    private List<SkillType> targetTypes;
    /** 附加效果 */
    private List<Map<String, Object>> effects;
    /** 伤害矩阵 */
    private List<List<int>> damageMatrix;

    // ======== Getters & Setters ========
    /** 获取 技能ID */
    public int getId() {
        return id;
    }
    /** 设置 技能ID */
    public void setId(int id) {
        this.id = id;
    }
    /** 获取 技能名称 */
    public String getName() {
        return name;
    }
    /** 设置 技能名称 */
    public void setName(String name) {
        this.name = name;
    }
    /** 获取 伤害值 */
    public double getDamage() {
        return damage;
    }
    /** 设置 伤害值 */
    public void setDamage(double damage) {
        this.damage = damage;
    }
    /** 获取 消耗MP */
    public int getCost() {
        return cost;
    }
    /** 设置 消耗MP */
    public void setCost(int cost) {
        this.cost = cost;
    }
    /** 获取 技能类型 */
    public SkillType getSkillType() {
        return skillType;
    }
    /** 设置 技能类型 */
    public void setSkillType(SkillType skillType) {
        this.skillType = skillType;
    }
    /** 获取 目标类型列表 */
    public List<SkillType> getTargetTypes() {
        return targetTypes;
    }
    /** 设置 目标类型列表 */
    public void setTargetTypes(List<SkillType> targetTypes) {
        this.targetTypes = targetTypes;
    }
    /** 获取 附加效果 */
    public List<Map<String, Object>> getEffects() {
        return effects;
    }
    /** 设置 附加效果 */
    public void setEffects(List<Map<String, Object>> effects) {
        this.effects = effects;
    }
    /** 获取 伤害矩阵 */
    public List<List<int>> getDamageMatrix() {
        return damageMatrix;
    }
    /** 设置 伤害矩阵 */
    public void setDamageMatrix(List<List<int>> damageMatrix) {
        this.damageMatrix = damageMatrix;
    }
}
