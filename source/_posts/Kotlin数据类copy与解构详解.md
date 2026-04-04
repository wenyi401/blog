---
title: Kotlin数据类copy与解构详解
date: 2026-04-03 23:52:00
tags: [Kotlin, data class, copy, 解构]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 数据类自动生成 copy() 和 componentN() 函数，这些是数据类的核心特性，掌握它们对于编写简洁高效的代码至关重要。

## 一、copy() 函数

### 基本用法

```kotlin
data class User(val name: String, val age: Int)

val original = User("Alice", 25)
val copied = original.copy()
val modified = original.copy(age = 30)

println(original)  // User(name=Alice, age=25)
println(copied)    // User(name=Alice, age=25)
println(modified)  // User(name=Alice, age=30)
```

### 部分修改

```kotlin
val user = User("Bob", 30)
val olderUser = user.copy(age = 31)
val renamedUser = user.copy(name = "Robert")
```

## 二、componentN() 函数

### 自动生成

数据类自动为每个属性生成 componentN() 函数：

```kotlin
data class User(val name: String, val age: Int)

// 自动生成：
// component1() -> name
// component2() -> age
```

### 解构声明

```kotlin
val user = User("Alice", 25)
val (name, age) = user

println(name)  // Alice
println(age)   // 25
```

### 在 for 循环中使用

```kotlin
val users = listOf(
    User("Alice", 25),
    User("Bob", 30)
)

for ((name, age) in users) {
    println("$name is $age years old")
}
```

## 三、Map 解构

```kotlin
val map = mapOf("a" to 1, "b" to 2)

for ((key, value) in map) {
    println("$key = $value")
}
```

## 学习资源

- [Destructuring declarations | Kotlin Documentation](https://kotlinlang.org/docs/destructuring-declarations.html)
- [彻底搞懂Kotlin数据类的copy()和componentN()](https://blog.csdn.net/GatherTide/article/details/153920401)

---

*持续学习中...*
