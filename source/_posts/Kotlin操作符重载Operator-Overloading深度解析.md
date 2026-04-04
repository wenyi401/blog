---
title: Kotlin操作符重载Operator Overloading深度解析
date: 2026-04-04 04:50:00
tags: [Kotlin, Operator, 操作符重载, infix]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 允许为类型提供预定义操作符的自定义实现。这些操作符有预定义的符号表示（如 + 或 *）和优先级。

## 一、基本语法

使用 operator 修饰符标记函数：

```kotlin
interface IndexedContainer {
    operator fun get(index: Int)
}

class OrdersList : IndexedContainer {
    override fun get(index: Int) { }
}
```

## 二、一元操作符

### 前缀操作符

| 表达式 | 转换为 |
|--------|--------|
| +a | a.unaryPlus() |
| -a | a.unaryMinus() |
| !a | a.not() |

```kotlin
data class Point(val x: Int, val y: Int)

operator fun Point.unaryMinus() = Point(-x, -y)

val point = Point(10, 20)
println(-point) // Point(x=-10, y=-20)
```

### 递增和递减

| 表达式 | 转换为 |
|--------|--------|
| a++ | a.inc() |
| a-- | a.dec() |

```kotlin
data class Counter(var value: Int) {
    operator fun inc(): Counter {
        return Counter(value + 1)
    }
}

var counter = Counter(10)
counter++ // 返回原值，然后加 1
```

## 三、二元操作符

### 算术运算符

| 表达式 | 转换为 |
|--------|--------|
| a + b | a.plus(b) |
| a - b | a.minus(b) |
| a * b | a.times(b) |
| a / b | a.div(b) |
| a % b | a.rem(b) |
| a..b | a.rangeTo(b) |
| a..<b | a.rangeUntil(b) |

```kotlin
data class Counter(val dayIndex: Int) {
    operator fun plus(increment: Int): Counter {
        return Counter(dayIndex + increment)
    }
}

val counter = Counter(10)
val newCounter = counter + 5 // Counter(15)
```

### in 操作符

| 表达式 | 转换为 |
|--------|--------|
| a in b | b.contains(a) |
| a !in b | !b.contains(a) |

```kotlin
class MyStringList {
    private val list = mutableListOf<String>()
    
    operator fun contains(item: String): Boolean {
        return list.contains(item)
    }
}

val myList = MyStringList()
if ("hello" in myList) { }
```

## 四、索引访问操作符

| 表达式 | 转换为 |
|--------|--------|
| a[i] | a.get(i) |
| a[i, j] | a.get(i, j) |
| a[i] = b | a.set(i, b) |
| a[i, j] = b | a.set(i, j, b) |

```kotlin
class Matrix {
    private val data = Array(10) { IntArray(10) }
    
    operator fun get(row: Int, col: Int): Int {
        return data[row][col]
    }
    
    operator fun set(row: Int, col: Int, value: Int) {
        data[row][col] = value
    }
}

val matrix = Matrix()
val value = matrix[1, 2]
matrix[1, 2] = 10
```

## 五、invoke 操作符

| 表达式 | 转换为 |
|--------|--------|
| a() | a.invoke() |
| a(i) | a.invoke(i) |
| a(i, j) | a.invoke(i, j) |

```kotlin
class Adder {
    operator fun invoke(a: Int, b: Int): Int {
        return a + b
    }
}

val adder = Adder()
val sum = adder(1, 2) // 3
```

## 六、增强赋值

| 表达式 | 转换为 |
|--------|--------|
| a += b | a.plusAssign(b) |
| a -= b | a.minusAssign(b) |
| a *= b | a.timesAssign(b) |
| a /= b | a.divAssign(b) |
| a %= b | a.remAssign(b) |

```kotlin
class MutableCounter(var value: Int) {
    operator fun plusAssign(increment: Int) {
        value += increment
    }
}

var counter = MutableCounter(10)
counter += 5 // counter.value = 15
```

## 七、相等和比较操作符

### 相等操作符

| 表达式 | 转换为 |
|--------|--------|
| a == b | a?.equals(b) ?: (b === null) |
| a != b | !(a?.equals(b) ?: (b === null)) |

```kotlin
class Person(val name: String, val age: Int) {
    override fun equals(other: Any?): Boolean {
        if (other !is Person) return false
        return name == other.name && age == other.age
    }
}
```

### 比较操作符

| 表达式 | 转换为 |
|--------|--------|
| a > b | a.compareTo(b) > 0 |
| a < b | a.compareTo(b) < 0 |
| a >= b | a.compareTo(b) >= 0 |
| a <= b | a.compareTo(b) <= 0 |

```kotlin
class Version(val major: Int, val minor: Int) : Comparable<Version> {
    override fun compareTo(other: Version): Int {
        return compareValuesBy(this, other, { it.major }, { it.minor })
    }
}

val v1 = Version(1, 0)
val v2 = Version(2, 0)
println(v1 < v2) // true
```

## 八、infix 函数

模拟自定义中缀操作：

```kotlin
infix fun Int.times(str: String) = str.repeat(this)

val result = 2 times "hello" // "hellohello"

// 标准库示例
val map = mapOf(1 to "one", 2 to "two")
val element = list elementAt 0
```

## 九、最佳实践

### 1. 保持语义一致

```kotlin
// 正确：加法语义
operator fun Point.plus(other: Point) = Point(x + other.x, y + other.y)

// 错误：非加法语义
operator fun Point.plus(other: Point) = Point(x * other.x, y * other.y)
```

### 2. 返回新对象或修改自身

```kotlin
// 不可变类：返回新对象
data class Point(val x: Int, val y: Int) {
    operator fun plus(other: Point) = Point(x + other.x, y + other.y)
}

// 可变类：修改自身
class MutablePoint(var x: Int, var y: Int) {
    operator fun plusAssign(other: Point) {
        x += other.x
        y += other.y
    }
}
```

### 3. 避免过度使用

```kotlin
// 不推荐：含义不明
operator fun String.div(n: Int) = this.repeat(n)

// 推荐：使用命名函数
fun String.repeatTimes(n: Int) = this.repeat(n)
```

## 十、常见问题

### 问题 1：歧义错误

**原因**：同时定义了 plus() 和 plusAssign()。

**解决方案**：只保留一个，或确保返回类型正确。

### 问题 2：类型不匹配

**原因**：操作符返回类型与预期不符。

**解决方案**：确保返回类型符合操作符语义。

### 问题 3：性能问题

**原因**：操作符创建过多临时对象。

**解决方案**：使用可变类或基本类型。

## 学习资源

- [Operator overloading | Kotlin Documentation](https://kotlinlang.org/docs/operator-overloading.html)
- [Operator conventions | Kotlin Documentation](https://kotlinlang.org/docs/operator-conventions.html)

---

*深入学习中...*
