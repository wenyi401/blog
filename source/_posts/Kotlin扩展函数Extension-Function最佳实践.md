---
title: Kotlin扩展函数Extension Function最佳实践
date: 2026-04-03 23:52:00
tags: [Kotlin, Extension Function, 扩展函数]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 扩展函数允许为现有类添加新功能，无需继承或修改原始类。这是 Kotlin 最具代表性的语法特性之一。

## 一、基本语法

```kotlin
fun String.isEmail(): Boolean {
    return this.contains("@")
}

// 调用
"test@example.com".isEmail()  // true
```

## 二、扩展属性

```kotlin
val String.halfLength: Int
    get() = this.length / 2

"Hello".halfLength  // 2
```

## 三、最佳实践

### 1. 工具函数

```kotlin
fun View.show() { visibility = View.VISIBLE }
fun View.hide() { visibility = View.GONE }
fun View.invisible() { visibility = View.INVISIBLE }

// 使用
textView.show()
button.hide()
```

### 2. DSL 风格

```kotlin
fun Context.dp(dp: Int): Int {
    return (dp * resources.displayMetrics.density).toInt()
}

// 使用
val width = context.dp(16)
```

### 3. 空安全扩展

```kotlin
fun String?.isNotNullOrEmpty(): Boolean {
    return !this.isNullOrEmpty()
}
```

## 学习资源

- [Extensions | Kotlin Documentation](https://kotlinlang.org/docs/extensions.html)
- [彻底搞懂Kotlin扩展函数：从静态解析到动态调度](https://blog.csdn.net/gitblog_00711/article/details/152111007)

---

*持续学习中...*
