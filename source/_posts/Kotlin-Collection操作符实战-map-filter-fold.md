---
title: Kotlin Collection操作符实战-map filter fold
date: 2026-04-03 23:44:00
tags: [Kotlin, Collection, map, filter, fold, reduce]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 集合操作符是函数式编程的核心工具，通过链式调用实现数据转换、过滤和聚合。本文将详细介绍 map、filter、fold 等常用操作符。

## 一、操作符分类

| 类别 | 操作符 |
|------|--------|
| **转换** | map, flatMap, groupBy, associate |
| **过滤** | filter, filterNot, filterNotNull, take, drop |
| **聚合** | fold, reduce, sum, average |
| **排序** | sortedBy, sortedWith, reversed |
| **查找** | find, first, last, any, all, none |

## 二、map 操作符

### 基本用法

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)
val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]
```

### 类型转换

```kotlin
val numbers = listOf(1, 2, 3)
val strings = numbers.map { "Number: $it" }
println(strings)  // [Number: 1, Number: 2, Number: 3]
```

### mapNotNull

```kotlin
val strings = listOf("1", "2", "a", "3")
val numbers = strings.mapNotNull { it.toIntOrNull() }
println(numbers)  // [1, 2, 3]
```

### flatMap

```kotlin
val lists = listOf(listOf(1, 2), listOf(3, 4))
val flattened = lists.flatMap { it }
println(flattened)  // [1, 2, 3, 4]
```

## 三、filter 操作符

### 基本用法

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)
val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4]
```

### filterNot

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)
val odds = numbers.filterNot { it % 2 == 0 }
println(odds)  // [1, 3, 5]
```

### filterNotNull

```kotlin
val values = listOf(1, null, 3, null, 5)
val nonNull = values.filterNotNull()
println(nonNull)  // [1, 3, 5]
```

### filterIsInstance

```kotlin
val items = listOf(1, "Hello", 2, "World")
val strings = items.filterIsInstance<String>()
println(strings)  // [Hello, World]
```

## 四、fold 操作符

### 基本用法

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)
val sum = numbers.fold(0) { acc, num -> acc + num }
println(sum)  // 15
```

### 字符串拼接

```kotlin
val words = listOf("Hello", "World")
val result = words.fold("") { acc, word -> 
    if (acc.isEmpty()) word else "$acc $word" 
}
println(result)  // "Hello World"
```

### 复杂对象聚合

```kotlin
data class Order(val item: String, val price: Double)

val orders = listOf(
    Order("Book", 20.0),
    Order("Pen", 5.0),
    Order("Notebook", 10.0)
)

val total = orders.fold(0.0) { acc, order -> acc + order.price }
println(total)  // 35.0
```

## 五、reduce 操作符

### 基本用法

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)
val sum = numbers.reduce { acc, num -> acc + num }
println(sum)  // 15
```

### 与 fold 区别

```kotlin
// fold：有初始值
val sum1 = emptyList<Int>().fold(0) { acc, num -> acc + num }
println(sum1)  // 0

// reduce：无初始值，空集合会抛异常
val sum2 = emptyList<Int>().reduce { acc, num -> acc + num }
// NoSuchElementException
```

## 六、groupBy 操作符

### 基本用法

```kotlin
data class Person(val name: String, val city: String)

val people = listOf(
    Person("Alice", "Beijing"),
    Person("Bob", "Shanghai"),
    Person("Charlie", "Beijing")
)

val grouped = people.groupBy { it.city }
println(grouped)
// {Beijing=[Alice, Charlie], Shanghai=[Bob]}
```

### 分组统计

```kotlin
val words = listOf("apple", "banana", "cherry", "date")
val grouped = words.groupBy { it.first() }
println(grouped)
// {a=[apple], b=[banana], c=[cherry], d=[date]}
```

## 七、associate 操作符

### associate

```kotlin
data class User(val id: Int, val name: String)

val users = listOf(User(1, "Alice"), User(2, "Bob"))
val map = users.associate { it.id to it.name }
println(map)  // {1=Alice, 2=Bob}
```

### associateBy

```kotlin
val users = listOf(User(1, "Alice"), User(2, "Bob"))
val map = users.associateBy { it.id }
println(map)  // {1=User(1, Alice), 2=User(2, Bob)}
```

## 八、实战应用

### 1. 数据处理流水线

```kotlin
data class Product(val name: String, val price: Double, val category: String)

val products = listOf(
    Product("Book", 20.0, "Education"),
    Product("Pen", 5.0, "Office"),
    Product("Laptop", 1000.0, "Electronics"),
    Product("Notebook", 10.0, "Education")
)

val expensiveEducationProducts = products
    .filter { it.category == "Education" }
    .filter { it.price > 10 }
    .map { it.name }
    .sorted()

println(expensiveEducationProducts)  // [Book]
```

### 2. 分组统计

```kotlin
val products = listOf(
    Product("Book", 20.0, "Education"),
    Product("Pen", 5.0, "Office"),
    Product("Laptop", 1000.0, "Electronics")
)

val categoryTotal = products
    .groupBy { it.category }
    .mapValues { (_, items) -> items.sumOf { it.price } }

println(categoryTotal)
// {Education=20.0, Office=5.0, Electronics=1000.0}
```

### 3. 数据转换

```kotlin
data class User(val id: Int, val name: String)
data class UserDTO(val id: String, val displayName: String)

val users = listOf(User(1, "Alice"), User(2, "Bob"))

val dtos = users.map { user ->
    UserDTO(
        id = user.id.toString(),
        displayName = user.name.uppercase()
    )
}

println(dtos)
// [UserDTO(id=1, displayName=ALICE), UserDTO(id=2, displayName=BOB)]
```

## 九、性能考虑

### 惰性序列

```kotlin
// 普通链式调用：创建中间集合
val result = numbers
    .filter { it > 2 }
    .map { it * 2 }
    .take(3)

// 使用 Sequence：惰性求值
val result = numbers.asSequence()
    .filter { it > 2 }
    .map { it * 2 }
    .take(3)
    .toList()
```

### 何时使用 Sequence

- ✅ 大数据集
- ✅ 多步操作
- ✅ 只需要部分结果

### 何时使用普通集合

- ✅ 小数据集
- ✅ 需要多次遍历
- ✅ 简单操作

## 十、最佳实践

1. **链式调用**：充分利用操作符组合
2. **命名参数**：提高可读性
3. **避免过度嵌套**：保持简洁
4. **合理使用 Sequence**：大数据集优化
5. **注意空集合**：reduce 需要非空集合

## 学习资源

- [Filtering collections | Kotlin Documentation](https://kotlinlang.org/docs/collection-filtering.html)
- [Kotlin Collection Mastery: Map, Filter, Fold](https://medium.com/@sivavishnu0705/supercharge-your-kotlin-code-6-collection-functions-you-cant-ignore-map-filter-more-297ca90f9334)
- [Kotlin - Using Lambdas with Collections](https://www.slingacademy.com/article/kotlin-using-lambdas-with-collections-map-filter-and-reduce/)

---

*持续学习中...*
