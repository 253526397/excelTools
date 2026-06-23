// 自动生成于 sample.xlsx 时间: 2026-06-23T12:44:21.270Z
// 请勿手动编辑此文件
package com.game.config;

/**
 * SkillType 枚举
 */
public enum SkillType {
    /** Ally */
    Ally(1),
    /** Attack */
    Attack(2),
    /** Buff */
    Buff(3),
    /** Enemy */
    Enemy(4),
    /** Heal */
    Heal(5);

    private final int value;

    SkillType(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static SkillType fromValue(int value) {
        for (SkillType e : values()) {
            if (e.value == value) {
                return e;
            }
        }
        return null;
    }
}
