---
title: Kotlin infix中缀函数与操作符重载
date: 2026-04-03 23:52:00
tags: [Kotlin, infix, 中缀函数, 操作符重载]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

infix 是 Kotlin 中的一个特殊关键字，它允许我们以更自然、更可读的方式调用只有一个参数的函数。这种函数调用方式去掉了传统的点号和括号，使代码更加简洁流畅。

## 一、infix 函数定义

### 条件

- 必须是成员函数或扩展函数
- 必须只有一个参数
- 参数不能有默认值

### 基本语法

```kotlin
infix fun Int.add(other: Int): Int = this + other

// 调用
val result = 5 add 3  // 8
```

## 二、标准库 infix 函数

### to - 创建 Pair

```kotlin
val pair = "name" to "Alice"
// 等价于
val pair = "name".to("Alice")
```

### and / or - 位运算

```kotlin
val flags = FLAG_A or FLAG_B
val mask = FLAG_A and FLAG_B
```

### until / downTo / step - 范围

```kotlin
for (i in 0 until 10) { }  // 0..9
for (i in 10 downTo 0) { }  // 10..0
for (i in 0..10 step 2) { }  // 0, 2, 4, 6, 8, 10
```

### in / !in - 包含检查

```kotlin
if (item in list) { }
if (item !in list) { }
```

## 三、自定义 infix 函数

### 成员函数

```kotlin
class Vector(val x: Int, val y: Int) {
    infix fun add(other: Vector): Vector {
        return Vector(x + other.x, y + other.y)
    }
}

val v1 = Vector(1, 2)
val v2 = Vector(3, 4)
val result = v1 add v2  // Vector(4, 6)
```

### 扩展函数

```kotlin
infix fun String.repeat(n: Int): String {
    return this.repeat(n)
}

val text = "Hello " repeat 3  // "Hello Hello Hello "
```

## 四、操作符重载

### 算术操作符

| 操作符 | 函数名 |
|--------|--------|
| + | plus |
| - | minus |
| * | times |
| / | div |
| % | rem |

### 示例

```kotlin
data class Point(val x: Int, val y: Int) {
    operator fun plus(other: Point): Point {
        return Point(x + other.x, y + other.y)
    }
    
    operator fun minus(other: Point): Point {
        return Point(x - other.x, y - other.y)
    }
    
    operator fun times(scale: Int): Point {
        return Point(x * scale, y * scale)
    }
}

val p1 = Point(1, 2)
val p2 = Point(3, 4)

val sum = p1 + p2  // Point(4, 6)
val diff = p1 - p2  // Point(-2, -2)
val scaled = p1 * 2  // Point(2, 4)
```

### 比较操作符

```kotlin
data class Person(val age: Int) : Comparable<Person> {
    override fun compareTo(other: Person): Int {
        return age.compareTo(other.age)
    }
}

val p1 = Person(25)
val p2 = Person(30)

if (p1 < p2) {
    println("p1 is younger")
}
```

### 索引操作符

```kotlin
class Matrix(private val data: Array<IntArray>) {
    operator fun get(row: Int, col: Int): Int {
        return data[row][col]
    }
    
    operator fun set(row: Int, col: Int, value: Int) {
        data[row][col] = value
    }
}

val matrix = Matrix(arrayOf(intArrayOf(1, 2), intArrayOf(3, 4)))
val value = matrix[0, 1]  // 2
matrix[1, 0] = 5
```

### 调用操作符

```kotlin
class Multiplier {
    operator fun invoke(x: Int, y: Int): Int {
        return x * y
    }
}

val multiplier = Multiplier()
val result = multiplier(3, 4)  // 12
```

## 五、实用示例

### DSL 风格

```kotlin
infix fun <T> T.should(matcher: Matcher<T>) = matcher.test(this)

class Matcher<T>(val test: (T) -> Boolean)

val beEven = Matcher<Int> { it % 2 == 0 }

10 should beEven  // true
```

### 流畅 API

```kotlin
class Query {
    private val conditions = mutableListOf<String>()
    
    infix fun select(columns: String): Query {
        conditions.add("SELECT $columns")
        return this
    }
    
    infix fun from(table: String): Query {
        conditions.add("FROM $table")
        return this
    }
    
    infix fun where(condition: String): Query {
        conditions.add("WHERE $condition")
        return this
    }
}

val query = Query()
    .select("*")
    .from("users")
    .where("age > 18")
```

## 六、最佳实践

1. **可读性优先**：infix 用于提升可读性
2. **语义明确**：函数名应表达清晰语义
3. **避免滥用**：不是所有单参数函数都适合 infix
4. **操作符有意义**：重载的操作符应符合直觉
5. **保持一致性**：遵循标准库的命名规范

## 学习资源

- [使用Kotlin 中缀函数简化代码](https://blog.csdn.net/chuyouyinghe/article/details/134426015)
- [一文带你了解 Kotlin infix 函数](https://juejin.cn/post/7492271537011130387)
- [Kotlin 中的 Infix 函数详解](https://www.baeldung-cn.com/kotlin/infix-functions)

---

*持续学习中...*
