---
title: Kotlin基础语法学习
date: 2026-04-03 14:52:00
tags: [Kotlin, Android, 编程语言]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 是 Android 官方推荐的编程语言，以其简洁优雅的设计和高效的开发效率受到广泛欢迎。本文记录 Kotlin 的基础语法学习笔记。

## 程序入口点

```kotlin
fun main() {
    println("Hello world!")
}

// 带参数的 main 函数
fun main(args: Array<String>) {
    println(args.contentToString())
}
```

## 变量

### val - 不可变变量

```kotlin
val x: Int = 5  // 声明并初始化
val c: Int      // 先声明
c = 3           // 后初始化
```

### var - 可变变量

```kotlin
var x: Int = 5
x += 1  // 可以重新赋值
```

### 类型推断

```kotlin
val x = 5  // 自动推断为 Int
```

## 函数

```kotlin
// 带返回类型的函数
fun sum(a: Int, b: Int): Int {
    return a + b
}

// 表达式体函数
fun sum(a: Int, b: Int) = a + b

// 无返回值函数
fun printSum(a: Int, b: Int): Unit {
    println("sum of $a and $b is ${a + b}")
}
```

## 类与实例

```kotlin
// 简单类
class Shape

// 带属性的类
class Rectangle(val height: Double, val length: Double) {
    val perimeter = (height + length) * 2
}

// 继承
open class Shape

class Rectangle(val height: Double, val length: Double): Shape() {
    val perimeter = (height + length) * 2
}
```

## 字符串模板

```kotlin
var a = 1
val s1 = "a is $a"  // 简单模板

a = 2
val s2 = "${s1.replace("is", "was")}, but now is $a"  // 表达式模板
```

## 条件表达式

```kotlin
// 传统写法
fun maxOf(a: Int, b: Int): Int {
    if (a > b) {
        return a
    } else {
        return b
    }
}

// 表达式写法
fun maxOf(a: Int, b: Int) = if (a > b) a else b
```

## 循环

### for 循环

```kotlin
val items = listOf("apple", "banana", "kiwifruit")
for (item in items) {
    println(item)
}

// 带索引
for (index in items.indices) {
    println("item at $index is ${items[index]}")
}
```

### while 循环

```kotlin
val items = listOf("apple", "banana", "kiwifruit")
var index = 0
while (index < items.size) {
    println("item at $index is ${items[index]}")
    index++
}
```

## when 表达式

```kotlin
fun describe(obj: Any): String =
    when (obj) {
        1 -> "One"
        "Hello" -> "Greeting"
        is Long -> "Long"
        !is String -> "Not a string"
        else -> "Unknown"
    }
```

## 区间（Range）

```kotlin
// 检测是否在区间内
val x = 10
val y = 9
if (x in 1..y+1) {
    println("fits in range")
}

// 区间迭代
for (x in 1..5) {
    print(x)
}

// 带步长的数列迭代
for (x in 1..10 step 2) {
    print(x)
}

for (x in 9 downTo 0 step 3) {
    print(x)
}
```

## 注释

```kotlin
// 单行注释

/* 
   多行注释
   可以嵌套
*/
```

## 学习资源

- [Kotlin 官方文档](https://kotlinlang.org/docs/basic-syntax.html)
- [Kotlin 中文文档](https://book.kotlincn.net/text/basic-syntax.html)
- [Android Developers Kotlin 教程](https://developer.android.com/kotlin/learn?hl=zh-cn)

## 下一步

- 学习 Kotlin 高级特性
- 实践 Kotlin Android 开发
- 研究 Kotlin 协程

---

*持续学习中...*
