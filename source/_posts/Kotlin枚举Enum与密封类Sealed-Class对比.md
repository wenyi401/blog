---
- 现在是北京时间晚上 11 点 52 分左右（15: 52 UTC = 23:52 CST）
title: Kotlin枚举Enum与密封类Sealed Class对比
date: 2026-04-03 23:52:00
tags: [Kotlin, Enum, Sealed Class, 枚举, 密封类]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 提供了枚举和密封类来表示有限的类型集合，它们各有优缺点，选择正确的类型对代码质量至关重要。

## 一、枚举 Enum

```kotlin
enum class Direction {
    NORTH, SOUTH, EAST, WEST
}

// 带属性的枚举
enum class Color(val rgb: Int) {
    RED(0xFF0000),
    GREEN(0x00FF00),
    BLUE(0x0000FF)
}
```

## 二、密封类 Sealed Class

```kotlin
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
    object Loading : Result()
}
```

## 三、核心区别

| 特性 | Enum | Sealed Class |
|------|------|---------------|
| 实例 | 单例 | 可多个实例 |
| 状态 | 无状态 | 可有状态 |
| 继承 | 不能继承 | 可继承类 |
| 扩展 | 不能扩展 | 可扩展 |

## 四、选择建议

- **使用枚举**：固定常量集合，无状态
- **使用密封类**：有限类型集合，有状态，需要扩展

## 学习资源

- [Kotlin Enum vs Sealed Class](https://juejin.cn/post/7606621855853314048)
- [Sealed classes and interfaces | Kotlin Documentation](https://kotlinlang.org/docs/sealed-classes.html)

---

*持续学习中...*
