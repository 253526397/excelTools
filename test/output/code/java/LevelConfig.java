// 自动生成于 sample.xlsx 时间: 2026-05-08T07:04:50.262Z
// 表: LevelConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * LevelConfig 配置表
 */
public class LevelConfig {
    /** 等级 */
    private int level;
    /** 所需经验 */
    private int expRequired;
    /** 最大HP */
    private int maxHp;
    /** 最大MP */
    private int maxMp;
    /** 解锁技能ID列表 */
    private List<Integer> unlockSkills;

    // ======== Getters & Setters ========
    /** 获取 等级 */
    public int getLevel() {
        return level;
    }
    /** 设置 等级 */
    public void setLevel(int level) {
        this.level = level;
    }
    /** 获取 所需经验 */
    public int getExpRequired() {
        return expRequired;
    }
    /** 设置 所需经验 */
    public void setExpRequired(int expRequired) {
        this.expRequired = expRequired;
    }
    /** 获取 最大HP */
    public int getMaxHp() {
        return maxHp;
    }
    /** 设置 最大HP */
    public void setMaxHp(int maxHp) {
        this.maxHp = maxHp;
    }
    /** 获取 最大MP */
    public int getMaxMp() {
        return maxMp;
    }
    /** 设置 最大MP */
    public void setMaxMp(int maxMp) {
        this.maxMp = maxMp;
    }
    /** 获取 解锁技能ID列表 */
    public List<Integer> getUnlockSkills() {
        return unlockSkills;
    }
    /** 设置 解锁技能ID列表 */
    public void setUnlockSkills(List<Integer> unlockSkills) {
        this.unlockSkills = unlockSkills;
    }
}
