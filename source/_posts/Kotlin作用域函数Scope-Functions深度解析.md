---
title: Kotlin作用域函数Scope Functions深度解析
date: 2026-04-04 05:50:00
tags: [Kotlin, Scope Functions, let, run, with, apply, also]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 标准库包含几个作用域函数，它们的唯一目的是在对象的上下文中执行代码块。当你在对象上调用这样的函数并提供 lambda 表达式时，它会形成一个临时作用域。

## 一、函数概览

| 函数 | 对象引用 | 返回值 | 是否扩展函数 |
|------|----------|--------|--------------|
| let | it | Lambda 结果 | 是 |
| run | this | Lambda 结果 | 是 |
| run | - | Lambda 结果 | 否 |
| with | this | Lambda 结果 | 否 |
| apply | this | 上下文对象 | 是 |
| also | it | 上下文对象 | 是 |

## 二、选择指南

- 执行非空对象的 lambda：**let**
- 在局部作用域中引入表达式作为变量：**let**
- 对象配置：**apply**
- 对象配置并计算结果：**run**
- 在需要表达式的地方运行语句：**run**（非扩展）
- 附加效果：**also**
- 分组对象上的函数调用：**with**

## 三、核心区别

### 1. 对象引用：this vs it

#### this（run、with、apply）

```kotlin
val str = "Hello"
str.run {
    println(length)        // 省略 this
    println(this.length)   // 显式 this
}
```

**适用场景**：主要操作对象成员。

#### it（let、also）

```kotlin
val str = "Hello"
str.let {
    println(it.length)
}
```

**适用场景**：对象主要作为函数参数使用。

### 2. 返回值

#### 返回上下文对象（apply、also）

```kotlin
val numberList = mutableListOf<Double>()
numberList.also { println("Populating the list") }
    .apply {
        add(2.71)
        add(3.14)
    }
    .also { println("Sorting the list") }
    .sort()
```

#### 返回 Lambda 结果（let、run、with）

```kotlin
val numbers = mutableListOf("one", "two", "three")
val countEndsWithE = numbers.run {
    add("four")
    add("five")
    count { it.endsWith("e") }
}
```

## 四、详细用法

### let

```kotlin
// 链式操作结果
numbers.map { it.length }.filter { it > 3 }.let {
    println(it)
}

// 方法引用
numbers.map { it.length }.filter { it > 3 }.let(::println)

// 非空检查
val str: String? = "Hello"
str?.let {
    println(it.length)  // 'it' 非空
}

// 引入局部变量
val modifiedFirstItem = numbers.first().let { firstItem ->
    println("The first item is '$firstItem'")
    if (firstItem.length >= 5) firstItem else "!$firstItem!"
}
```

### with

```kotlin
val numbers = mutableListOf("one", "two", "three")
with(numbers) {
    println("'with' is called with argument $this")
    println("It contains $size elements")
}

// 计算值
val firstAndLast = with(numbers) {
    "First: ${first()}, Last: ${last()}"
}
```

### run

```kotlin
// 扩展函数形式
val result = service.run {
    port = 8080
    query(prepareRequest())
}

// 非扩展形式
val hexNumberRegex = run {
    val digits = "0-9"
    val hexDigits = "A-Fa-f"
    Regex("[$digits$hexDigits]+")
}
```

### apply

```kotlin
// 对象配置
val adam = Person("Adam").apply {
    age = 32
    city = "London"
}

// 链式配置
val button = Button(context).apply {
    text = "Click me"
    setOnClickListener { }
    visibility = View.VISIBLE
}
```

### also

```kotlin
// 附加效果
val numbers = mutableListOf("one", "two", "three")
numbers
    .also { println("Before: $it") }
    .add("four")

// 记录日志
fun getRandomInt(): Int {
    return Random.nextInt(100).also {
        writeToLog("Generated value: $it")
    }
}
```

## 五、takeIf 和 takeUnless

### 基本用法

```kotlin
val number = Random.nextInt(100)

val evenOrNull = number.takeIf { it % 2 == 0 }
val oddOrNull = number.takeUnless { it % 2 == 0 }
```

### 与 let 结合

```kotlin
fun displaySubstringPosition(input: String, sub: String) {
    input.indexOf(sub)
        .takeIf { it >= 0 }
        ?.let {
            println("Found at position $it")
        }
}
```

## 六、最佳实践

### 1. 避免过度使用

```kotlin
// 过度使用
Person("Alice", 20, "Amsterdam").let {
    it.moveTo("London")
    it.incrementAge()
}

// 更清晰
val alice = Person("Alice", 20, "Amsterdam")
alice.moveTo("London")
alice.incrementAge()
```

### 2. 避免嵌套

```kotlin
// 不推荐
Person("Alice").apply {
    address.apply {
        city = "London"
    }
}

// 推荐
Person("Alice").apply {
    address.city = "London"
}
```

### 3. 保持一致性

在项目中保持一致的使用风格。

## 七、常见问题

### 问题 1：混淆 this 和 it

**解决方案**：记住规则 - apply/run/with 用 this，let/also 用 it。

### 问题 2：返回值错误

**解决方案**：记住 apply/also 返回对象本身，let/run/with 返回 lambda 结果。

### 问题 3：链式调用可读性差

**解决方案**：适当换行，添加注释。

## 学习资源

- [Scope functions | Kotlin Documentation](https://kotlinlang.org/docs/scope-functions.html)
- [Kotlin 作用域函数详解](https://juejin.cn/post/7078587415748673543)

---

*深入学习中...*
