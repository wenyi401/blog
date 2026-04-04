---
title: Kotlin空安全Null Safety与Elvis操作符详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Null Safety, Elvis, 空安全]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 的空安全特性旨在显著降低空引用的风险，这是许多编程语言中最常见的陷阱之一。

## 一、可空类型

```kotlin
var name: String = "Alice"  // 不可空
var nickname: String? = null  // 可空
```

## 二、安全调用 ?.

```kotlin
val length = nickname?.length  // 如果 nickname 为 null，返回 null
```

## 三、Elvis 操作符 ?:

```kotlin
val length = nickname?.length ?: 0  // 如果为 null，使用默认值 0
```

## 四、非空断言 !!

```kotlin
val length = nickname!!.length  // 如果为 null，抛出 NPE
```

## 五、let 函数

```kotlin
nickname?.let {
    println(it.length)  // 只有非 null 时执行
}
```

## 学习资源

- [Null safety | Kotlin Documentation](https://kotlinlang.org/docs/null-safety.html)
- [Kotlin 空安全：安全调用与 Elvis 操作符](https://juejin.cn/post/7581670270845419560)

---

*持续学习中...*
