---
title: Kotlin构造函数与init初始化块
date: 2026-04-03 23:52:00
tags: [Kotlin, Constructor, init, 构造函数]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 的类初始化机制包含主构造函数、次构造函数、属性初始化器和 init 块。理解它们的执行顺序对于编写正确的代码至关重要。

## 一、主构造函数

```kotlin
class Person(val name: String, var age: Int)

// 使用
val person = Person("Alice", 25)
```

## 二、init 块

```kotlin
class Person(val name: String) {
    init {
        require(name.isNotEmpty()) { "Name cannot be empty" }
        println("Person initialized: $name")
    }
}
```

## 三、次构造函数

```kotlin
class Person(val name: String) {
    var age: Int = 0
    
    constructor(name: String, age: Int) : this(name) {
        this.age = age
    }
}
```

## 四、初始化顺序

```kotlin
class Example {
    val first = println("1")
    
    init {
        println("2")
    }
    
    val second = println("3")
    
    init {
        println("4")
    }
}

// 输出: 1, 2, 3, 4
```

## 五、执行顺序

1. 主构造函数参数
2. 属性初始化器（按声明顺序）
3. init 块（按声明顺序）
4. 次构造函数体

## 学习资源

- [Kotlin Class 的初始化機制：解密 init 與初始化順序](https://blog.cashwu.com/blog/2026/kotlin-class-initialization)
- [Classes | Kotlin Documentation](https://kotlinlang.org/docs/classes.html)

---

*持续学习中...*
