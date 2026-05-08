// 自动生成于 sample.xlsx 时间: 2026-05-08T07:04:50.264Z
// 请勿手动编辑此文件
package com.game.config;

/**
 * SkillType 枚举
 */
public enum SkillType {
    /** Attack */
    Attack(1),
    /** Defense */
    Defense(2),
    /** Heal */
    Heal(3),
    /** Buff */
    Buff(4);

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
