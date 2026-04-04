---
title: Kotlin高阶函数与函数类型详解
date: 2026-04-03 23:52:00
tags: [Kotlin, 高阶函数, 函数类型, Lambda]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 函数是一等公民，可以存储在变量中、作为参数传递、作为返回值返回。高阶函数是以函数为参数或返回函数的函数。

## 一、函数类型

### 基本语法

```kotlin
// (参数类型) -> 返回类型
val add: (Int, Int) -> Int = { a, b -> a + b }
val print: (String) -> Unit = { println(it) }
```

### 带接收者的函数类型

```kotlin
// 接收者.(参数) -> 返回类型
val isEven: Int.() -> Boolean = { this % 2 == 0 }

// 调用
10.isEven()  // true
```

## 二、高阶函数

### 函数作为参数

```kotlin
fun operate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

val sum = operate(1, 2) { a, b -> a + b }
val product = operate(1, 2) { a, b -> a * b }
```

### 函数作为返回值

```kotlin
fun getOperation(type: String): (Int, Int) -> Int {
    return when (type) {
        "add" -> { a, b -> a + b }
        "multiply" -> { a, b -> a * b }
        else -> { _, _ -> 0 }
    }
}

val add = getOperation("add")
add(1, 2)  // 3
```

## 三、Lambda 表达式

### 基本语法

```kotlin
val sum = { a: Int, b: Int -> a + b }
sum(1, 2)  // 3
```

### it 隐式参数

```kotlin
val square: (Int) -> Int = { it * it }
square(5)  // 25
```

### 尾随 Lambda

```kotlin
list.filter { it > 5 }
// 等价于
list.filter({ it > 5 })
```

## 四、内联函数

### inline 关键字

```kotlin
inline fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}
```

### noinline

```kotlin
inline fun operate(a: Int, b: Int, noinline operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}
```

### crossinline

```kotlin
inline fun runInCrossinline(crossinline block: () -> Unit) {
    Runnable { block() }.run()
}
```

## 五、标准高阶函数

### let

```kotlin
val result = "Hello".let {
    it.length
}
```

### run

```kotlin
val result = "Hello".run {
    length
}
```

### with

```kotlin
val result = with(StringBuilder()) {
    append("Hello")
    append(" World")
    toString()
}
```

### apply

```kotlin
val person = Person().apply {
    name = "Alice"
    age = 25
}
```

### also

```kotlin
val list = mutableListOf(1, 2, 3).also {
    println(it)
}
```

## 学习资源

- [Higher-order functions and lambdas | Kotlin Documentation](https://kotlinlang.org/docs/lambdas.html)
- [高阶函数与内联优化深入讲解](https://juejin.cn/post/7513967874614624283)

---

*持续学习中...*
