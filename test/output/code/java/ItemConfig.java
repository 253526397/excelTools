// 自动生成于 sample.xlsx 时间: 2026-06-23T12:44:21.259Z
// 表: ItemConfig
// 请勿手动编辑此文件
package com.game.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

/**
 * ItemConfig 配置表接口
 */
public interface IItemConfig {
    /** 道具ID */
    int getId();
    void setId(int id);
    /** 道具名称 */
    String getName();
    void setName(String name);
    /** 类型 */
    String getType();
    void setType(String type);
    /** 价格 */
    int getPrice();
    void setPrice(int price);
    /** 可堆叠 */
    boolean getStackable();
    void setStackable(boolean stackable);
    /** 属性 */
    Map<String, Object> getAttributes();
    void setAttributes(Map<String, Object> attributes);
}

/**
 * ItemConfig 配置表
 */
public class ItemConfig implements IItemConfig {
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

    /** 无参构造函数 */
    public ItemConfig() {}

    /** 全参构造函数 */
    public ItemConfig(
        int id,
        String name,
        String type,
        int price,
        boolean stackable,
        Map<String, Object> attributes
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.price = price;
        this.stackable = stackable;
        this.attributes = attributes;
    }

    // ======== Getters & Setters ========
    /** 道具ID */
    public int getId() { return id; }
    /** 道具ID */
    public void setId(int id) { this.id = id; }
    /** 道具名称 */
    public String getName() { return name; }
    /** 道具名称 */
    public void setName(String name) { this.name = name; }
    /** 类型 */
    public String getType() { return type; }
    /** 类型 */
    public void setType(String type) { this.type = type; }
    /** 价格 */
    public int getPrice() { return price; }
    /** 价格 */
    public void setPrice(int price) { this.price = price; }
    /** 可堆叠 */
    public boolean getStackable() { return stackable; }
    /** 可堆叠 */
    public void setStackable(boolean stackable) { this.stackable = stackable; }
    /** 属性 */
    public Map<String, Object> getAttributes() { return attributes; }
    /** 属性 */
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
    // ======== 数据存储（key = id，可遍历） ========

    /** ItemConfig 数据存储 */
    public static class Data
    {
        /** 全部数据，可直接 .forEach / for-each 遍历 */
        public static Map<String, ItemConfig> all = new HashMap<>();

        /** 根据 id 查询 */
        public static ItemConfig get(String key) { return all.get(key); }

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

            Map<String, ItemConfig> map = new HashMap<>();
            for (com.google.gson.JsonElement item : rows) {
                ItemConfig record = gson.fromJson(item, ItemConfig.class);
                String keyValue = item.getAsJsonObject().get("id").getAsString();
                map.put(keyValue, record);
            }
            all = map;
        }
    }
}
