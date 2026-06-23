// 自动生成于 sample.xlsx 时间: 2026-06-23T11:34:32.063Z
// 表: ItemConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * ItemConfig 配置表
 */
public class ItemConfig {
    /** 道具ID */
    private int id;
    /** 道具名称 */
    private String name;
    /** 类型 */
    private String type;
    /** 价格 */
    private int price;
    /** 可堆叠 */
    private boolean stackable;
    /** 属性 */
    private Map<String, Object> attributes;

    // ======== Getters & Setters ========
    /** 获取 道具ID */
    public int getId() {
        return id;
    }
    /** 设置 道具ID */
    public void setId(int id) {
        this.id = id;
    }
    /** 获取 道具名称 */
    public String getName() {
        return name;
    }
    /** 设置 道具名称 */
    public void setName(String name) {
        this.name = name;
    }
    /** 获取 类型 */
    public String getType() {
        return type;
    }
    /** 设置 类型 */
    public void setType(String type) {
        this.type = type;
    }
    /** 获取 价格 */
    public int getPrice() {
        return price;
    }
    /** 设置 价格 */
    public void setPrice(int price) {
        this.price = price;
    }
    /** 获取 可堆叠 */
    public boolean getStackable() {
        return stackable;
    }
    /** 设置 可堆叠 */
    public void setStackable(boolean stackable) {
        this.stackable = stackable;
    }
    /** 获取 属性 */
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    /** 设置 属性 */
    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
}
