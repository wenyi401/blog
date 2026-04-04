---
title: Kotlin数据类Data Classes深度解析
date: 2026-04-04 08:50:00
tags: [Kotlin, Data Class, 数据类, copy, 解构]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 数据类主要用于保存数据。编译器会自动生成 equals()、hashCode()、toString()、componentN() 和 copy() 函数。

## 一、基本语法

```kotlin
data class User(val name: String, val age: Int)
```

## 二、自动生成的函数

- equals() / hashCode()
- toString()：`User(name=John, age=42)`
- componentN()：解构声明
- copy()：复制对象

## 三、要求

- 主构造函数至少有一个参数
- 所有参数必须是 val 或 var
- 不能是 abstract、open、sealed 或 inner

## 四、类体中的属性

```kotlin
data class Person(val name: String) {
    var age: Int = 0  // 不参与生成的函数
}
```

## 五、copy() 函数

```kotlin
val jack = User("Jack", 1)
val olderJack = jack.copy(age = 2)
```

**注意**：copy() 是浅拷贝。

## 六、解构声明

```kotlin
val jane = User("Jane", 35)
val (name, age) = jane
```

## 七、标准数据类

标准库提供 Pair 和 Triple，但命名数据类更易读。

## 学习资源

- [Data classes | Kotlin Documentation](https://kotlinlang.org/docs/data-classes.html)
- [Destructuring declarations](https://kotlinlang.org/docs/destructuring-declarations.html)

---

*深入学习中...*
