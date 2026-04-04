---
title: Kotlin Scope Functions详解-let run with apply also
date: 2026-04-03 23:43:00
tags: [Kotlin, Scope Functions, let, run, with, apply, also]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 标准库包含一组作用域函数，旨在通过在对象上下文中执行代码块来简化代码。这些函数包括：let、run、with、apply 和 also。

## 一、函数对比

| 函数 | 对象引用 | 返回值 | 使用场景 |
|------|----------|--------|----------|
| `let` | `it` | Lambda 结果 | 空安全调用 |
| `run` | `this` | Lambda 结果 | 执行代码块 |
| `with` | `this` | Lambda 结果 | 操作对象 |
| `apply` | `this` | 对象本身 | 对象配置 |
| `also` | `it` | 对象本身 | 附加操作 |

## 二、let

### 基本用法

```kotlin
val result = "Hello".let {
    println(it)  // Hello
    it.length    // 返回 5
}
println(result)  // 5
```

### 空安全调用

```kotlin
val name: String? = "Kotlin"

name?.let {
    println("Name: $it")
    println("Length: ${it.length}")
}
```

### 变量作用域

```kotlin
// ❌ 错误：变量名冲突
val items = listOf(1, 2, 3)
val items = items.map { it * 2 }  // 错误

// ✅ 正确：使用 let
val items = listOf(1, 2, 3)
items.let { original ->
    val transformed = original.map { it * 2 }
    println(transformed)
}
```

## 三、run

### 基本用法

```kotlin
val result = run {
    val a = 1
    val b = 2
    a + b
}
println(result)  // 3
```

### 对象 run

```kotlin
val result = "Hello".run {
    length  // this.length
}
println(result)  // 5
```

### 与 let 区别

```kotlin
// let：使用 it
"Hello".let {
    println(it.length)
}

// run：使用 this
"Hello".run {
    println(length)  // 省略 this
}
```

## 四、with

### 基本用法

```kotlin
val person = Person("Alice", 25)

with(person) {
    println(name)
    println(age)
    celebrateBirthday()
}
```

### 返回值

```kotlin
val result = with(StringBuilder()) {
    append("Hello")
    append(" ")
    append("World")
    toString()  // 返回结果
}
println(result)  // Hello World
```

### 与 run 区别

```kotlin
// with：对象作为参数
with(person) { ... }

// run：对象调用
person.run { ... }
```

## 五、apply

### 基本用法

```kotlin
val person = Person().apply {
    name = "Alice"
    age = 25
}
```

### 对象配置

```kotlin
val intent = Intent().apply {
    putExtra("id", 1)
    putExtra("name", "Alice")
    setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
}
```

### Builder 模式

```kotlin
val request = Request.Builder().apply {
    url("https://api.example.com")
    addHeader("Authorization", "Bearer token")
    post(body)
}.build()
```

### 与 run 区别

```kotlin
// run：返回 Lambda 结果
val result = person.run { name }

// apply：返回对象本身
val person = person.apply { name = "Bob" }
```

## 六、also

### 基本用法

```kotlin
val person = Person("Alice", 25).also {
    println("Created: ${it.name}")
}
```

### 附加操作

```kotlin
val numbers = mutableListOf(1, 2, 3)
    .also { println("Original: $it") }
    .map { it * 2 }
    .also { println("Transformed: $it") }
```

### 日志记录

```kotlin
fun processData(data: String): String {
    return data.also {
        log("Processing: $it")
    }.uppercase().also {
        log("Result: $it")
    }
}
```

### 与 let 区别

```kotlin
// let：返回 Lambda 结果
val length = "Hello".let { it.length }

// also：返回对象本身
val str = "Hello".also { println(it) }
```

## 七、选择指南

### 选择依据

| 场景 | 函数 |
|------|------|
| 空安全调用 | `let` |
| 对象配置 | `apply` |
| 执行代码块 | `run` |
| 附加操作 | `also` |
| 操作对象（无返回值） | `with` |

### 决策流程

```
需要返回对象本身？
├── 是 → 需要配置对象？
│         ├── 是 → apply
│         └── 否 → also
└── 否 → 需要空安全？
          ├── 是 → let
          └── 否 → 需要操作已有对象？
                    ├── 是 → with
                    └── 否 → run
```

## 八、实战应用

### 1. 空安全调用

```kotlin
user?.let {
    println(it.name)
    println(it.age)
}
```

### 2. 对象初始化

```kotlin
val recyclerView = RecyclerView(context).apply {
    layoutManager = LinearLayoutManager(context)
    adapter = myAdapter
    addItemDecoration(divider)
}
```

### 3. 链式调用

```kotlin
val result = "  Hello World  "
    .also { println("Original: '$it'") }
    .trim()
    .also { println("Trimmed: '$it'") }
    .uppercase()
    .also { println("Upper: '$it'") }
```

### 4. 资源管理

```kotlin
File("data.txt").apply {
    if (!exists()) createNewFile()
    writeText("Hello")
}.also {
    println("File written: ${it.absolutePath}")
}
```

## 九、组合使用

```kotlin
val person = Person().apply {
    name = "Alice"
    age = 25
}.also {
    println("Created person: $it")
}

person?.let {
    it.celebrateBirthday()
    println("Age: ${it.age}")
}
```

## 十、最佳实践

1. **命名参数**：let 中使用命名参数避免 it 歧义
2. **返回值**：根据需求选择 apply（对象）或 let（结果）
3. **可读性**：避免过度嵌套
4. **空安全**：善用 ?.let
5. **日志调试**：使用 also 添加日志

## 学习资源

- [Scope functions | Kotlin Documentation](https://kotlinlang.org/docs/scope-functions.html)
- [Kotlin Scope Functions Finally Explained](https://medium.com/@harshpatel_/kotlin-scope-functions-finally-explained-let-run-with-apply-and-also-ca1c803fb12d)
- [Kotlin Scope Functions: Master run, let, apply, also, with Usage](https://openillumi.com/en/en-kotlin-scope-functions-run-let-apply-difference/)

---

*持续学习中...*
