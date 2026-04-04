---
title: Kotlin可见性修饰符Visibility Modifiers深度解析
date: 2026-04-04 07:50:00
tags: [Kotlin, Visibility, private, protected, internal, public]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 有四种可见性修饰符：private、protected、internal 和 public。默认为 public。

## 一、包级别

```kotlin
package foo

private fun foo() { } // 仅在文件内可见
public var bar: Int = 5 // 所有地方可见
    private set // setter 仅在文件内可见
internal val baz = 6 // 同模块可见
```

## 二、类成员

| 修饰符 | 可见范围 |
|--------|----------|
| private | 类内部 |
| protected | 类内部 + 子类 |
| internal | 同模块 |
| public | 所有地方 |

```kotlin
open class Outer {
    private val a = 1
    protected open val b = 2
    internal open val c = 3
    val d = 4 // public
}

class Subclass : Outer() {
    override val b = 5 // protected
    override val c = 7 // internal
}
```

## 三、构造函数

```kotlin
class C private constructor(a: Int) { }
```

## 四、模块

internal 可见性限于同一模块：
- IntelliJ IDEA 模块
- Maven 项目
- Gradle 源集

## 五、最佳实践

### 1. 最小可见性

默认使用 private，按需放宽。

### 2. internal 用于库

库的内部实现使用 internal。

### 3. protected 用于继承

子类需要访问的成员使用 protected。

## 学习资源

- [Visibility modifiers | Kotlin Documentation](https://kotlinlang.org/docs/visibility-modifiers.html)
- [Packages | Kotlin Documentation](https://kotlinlang.org/docs/packages.html)

---

*深入学习中...*
