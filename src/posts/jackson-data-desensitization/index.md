---
title: "基于 Jackson 的数据脱敏方案"
date: "2026-02-04"
description: "一种基于 Jackson 序列化的非侵入式、高性能数据脱敏方案，通过注解驱动实现对敏感信息的自动掩码处理。"
tags: ["Java", "Spring Boot", "Jackson", "Security", "Design Patterns"]
published: true
---

# 基于 Jackson 的数据脱敏方案：注解驱动的非侵入式实现

## 1. 问题描述

在 Web 应用开发中，敏感信息（如手机号、邮箱、身份证号等）需要在返回给前端时进行脱敏处理，以保护用户隐私。传统的实现方式存在以下问题：

### 传统方案的痛点

```java
// 传统方式：在 Service 层手动处理
public UserVO getUserInfo(Long userId) {
    User user = userRepository.findById(userId);
    UserVO vo = new UserVO();
    vo.setPhone(maskPhone(user.getPhone()));  // 手动调用工具类
    vo.setEmail(maskEmail(user.getEmail()));  // 重复的脱敏逻辑
    return vo;
}
```

**存在的问题**：
- **侵入性强**：脱敏逻辑与业务逻辑混杂，违反单一职责原则
- **不可逆性**：数据被提前修改，后续业务逻辑无法获取原始值
- **重复开发**：每个接口都需要手动调用脱敏方法
- **维护困难**：脱敏规则变更需要修改多处代码

## 2. 解决方案分析

### 核心思路

利用 Jackson 的序列化机制，在 **JSON 序列化阶段** 自动完成脱敏处理：
- **业务层透明**：Service 层处理原始完整数据
- **展示层自动处理**：对象转 JSON 时自动应用脱敏策略
- **声明式配置**：通过注解标记需要脱敏的字段

### 技术选型

- **Jackson `@JsonSerialize`**：指定自定义序列化器
- **`ContextualSerializer` 接口**：动态感知字段注解配置
- **策略模式**：封装不同的脱敏算法

## 3. 实现过程

### 步骤一：定义脱敏策略枚举

使用 Java 8 函数式接口封装脱敏算法，实现高内聚设计。

```java
@Getter
public enum DesensitizeStrategy {
    /**
     * 手机号脱敏
     * 13812345678 -> 138****5678
     */
    PHONE(s -> s.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2")),

    /**
     * 邮箱脱敏
     * example@gmail.com -> e****e@gmail.com
     */
    EMAIL(s -> s.replaceAll("(^.)[^@]*(@.*$)", "$1****$2")),

    /**
     * 中文姓名脱敏
     * 张三 -> 张*
     * 李小龙 -> 李*龙
     */
    CHINESE_NAME(s -> {
        if (s == null || s.isEmpty()) {
            return s;
        }
        if (s.length() == 2) {
            return s.charAt(0) + "*";
        }
        return s.replaceAll("([\\u4e00-\\u9fa5]{1})(.*)([\\u4e00-\\u9fa5]{1})",
                "$1" + "*".repeat(Math.max(0, s.length() - 2)) + "$3");
    }),

    /**
     * 身份证号脱敏
     * 123456789 -> 1******89
     */
    ID_CARD(s -> s.replaceAll("(\\d{1})\\d+(\\d{2})", "$1******$2"));

    private final Function<String, String> desensitizer;

    DesensitizeStrategy(Function<String, String> desensitizer) {
        this.desensitizer = desensitizer;
    }
}
```

**设计亮点**：
- 每个策略自包含算法逻辑，符合"充血模型"
- 使用 `Function<String, String>` 统一接口
- 易于扩展新的脱敏规则

### 步骤二：创建声明式注解

利用 Jackson 的元注解机制简化配置。

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside  // 表示这是一个 Jackson 复合注解
@JsonSerialize(using = DesensitizeSerializer.class)  // 指定自定义序列化器
public @interface Desensitize {
    /**
     * 脱敏策略
     */
    DesensitizeStrategy strategy();
}
```

**关键点**：
- `@JacksonAnnotationsInside`：允许注解组合，简化使用
- `@JsonSerialize`：指定序列化器类
- `strategy()`：允许字段级别配置不同的脱敏策略

### 步骤三：实现上下文敏感序列化器

这是方案的核心，通过 `ContextualSerializer` 接口实现动态策略选择。

```java
@NoArgsConstructor
@AllArgsConstructor
public class DesensitizeSerializer extends JsonSerializer<String> implements ContextualSerializer {

    /**
     * 脱敏策略
     */
    private DesensitizeStrategy strategy;

    /**
     * 核心序列化方法：在对象转 JSON 时触发。
     * 根据配置的脱敏策略（strategy）对原始字符串进行处理，并写入 JSON 生成器。
     */
    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        // 无效值或未配置策略，直接输出原值
        if (value == null || strategy == null) {
            gen.writeString(value);
            return;
        }
        // 应用脱敏算法并输出
        gen.writeString(strategy.getDesensitizer().apply(value));
    }

    /**
     * 上下文回调方法：在序列化器初始化时触发。
     * 用于读取字段上的 @Desensitize 注解，并根据注解中的策略动态创建一个新的序列化器实例。
     */
    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property)
            throws JsonMappingException {
        if (property != null) {
            // 仅处理 String 类型字段
            if (Objects.equals(property.getType().getRawClass(), String.class)) {
                // 获取字段上的 @Desensitize 注解
                Desensitize annotation = property.getAnnotation(Desensitize.class);
                if (annotation != null) {
                    // 根据注解指定的策略返回对应的序列化器实例
                    return new DesensitizeSerializer(annotation.strategy());
                }
            }
            // 非目标字段，返回默认序列化器
            return prov.findValueSerializer(property.getType(), property);
        }
        return prov.findNullValueSerializer(null);
    }
}
```

**实现要点**：

1. **`createContextual` 方法**：
   - Jackson 在序列化时会调用此方法
   - 读取字段上的 `@Desensitize` 注解
   - 根据注解参数创建特定策略的序列化器实例

2. **`serialize` 方法**：
   - 执行实际的脱敏转换
   - 调用策略枚举中定义的函数

### 步骤四：在 VO 中使用注解

业务代码只需添加注解即可，无需任何额外处理。

```java
public class UserSecurityVO {
    
    @Desensitize(strategy = DesensitizeStrategy.EMAIL)
    private String email;
    // 输出: e****e@gmail.com
    
    @Desensitize(strategy = DesensitizeStrategy.PHONE)
    private String phone;
    // 输出: 138****5678
    
    private Boolean twoFactorEnabled;
    // 非敏感字段，正常输出
}
```

**Controller 层代码**：

```java
@GetMapping("/security")
public UserSecurityVO getSecurityInfo() {
    // Service 返回原始数据
    return userService.getSecurityInfo();
    // Jackson 自动在序列化时应用脱敏
}
```

## 4. 方案优势

### 非侵入性
- Service 层代码完全不需要修改
- 业务逻辑与展示逻辑彻底分离

### 高性能
- Jackson 序列化性能优异
- `createContextual` 方法缓存序列化器实例
- 性能损耗微乎其微

### 易扩展
- 新增脱敏规则只需在枚举中添加一行
- 无需修改框架代码

### 易维护
- 脱敏规则集中管理
- 声明式配置，一目了然

## 5. 扩展场景

### 场景一：自定义脱敏规则

```java
// 在枚举中添加新策略
BANK_CARD(s -> s.replaceAll("(\\d{4})\\d+(\\d{4})", "$1 **** **** $2"))
```

### 场景二：条件脱敏

可以结合 Spring Security 实现基于权限的条件脱敏来实现**管理员查看原文、普通用户查看脱敏信息**的逻辑。

## 6. 总结

本方案通过 Jackson 的深度定制，实现了：
- 业务代码零侵入
- 声明式配置
- 高性能、易扩展
- 符合开闭原则

这种设计模式不仅适用于数据脱敏，还可以推广到其他字段级别的转换场景，是 Java 后端开发中值得推广的最佳实践。
