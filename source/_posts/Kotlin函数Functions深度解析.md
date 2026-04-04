---
title: Kotlin函数Functions深度解析
date: 2026-04-04 06:50:00
tags: [Kotlin, Functions, 函数, vararg, infix]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 使用 fun 关键字声明函数，支持默认参数、命名参数、vararg 和中缀表示法等特性。

## 一、函数声明

```kotlin
fun double(x: Int): Int {
    return 2 * x
}

// 单表达式函数
fun double(x: Int) = x * 2
```

## 二、参数

### 默认参数值

```kotlin
fun read(b: ByteArray, off: Int = 0, len: Int = b.size) { }
```

### 命名参数

```kotlin
reformat(
    "String!",
    normalizeCase = false,
    wordSeparator = '_'
)
```

### vararg

```kotlin
fun <T> asList(vararg ts: T): List<T> {
    val result = ArrayList<T>()
    for (t in ts) result.add(t)
    return result
}

val list = asList(1, 2, 3)
val a = arrayOf(1, 2, 3)
val list2 = asList(-1, 0, *a, 4)  // 展开数组
```

## 三、中缀表示法

```kotlin
infix fun Int.shl(x: Int): Int { /*...*/ }

1 shl 2  // 中缀表示法
1.shl(2) // 普通表示法
```

**要求**：
- 必须是成员函数或扩展函数
- 必须只有一个参数
- 参数不能有默认值

## 四、函数作用域

### 局部函数

```kotlin
fun dfs(graph: SocialGraph) {
    fun dfs(current: Person, visited: MutableSet<Person>) {
        if (!visited.add(current)) return
        for (friend in current.friends) dfs(friend, visited)
    }
    dfs(graph.people[0], HashSet())
}
```

### 成员函数

```kotlin
class Sample {
    fun foo() { print("Foo") }
}
```

## 五、尾递归

```kotlin
tailrec fun findFixPoint(x: Double = 1.0): Double =
    if (abs(x - cos(x)) < eps) x else findFixPoint(cos(x))
```

**要求**：递归调用必须是函数的最后一个操作。

## 六、泛型函数

```kotlin
fun <T> singletonList(item: T): List<T> { /*...*/ }
```

## 学习资源

- [Functions | Kotlin Documentation](https://kotlinlang.org/docs/functions.html)
- [Higher-order functions and lambdas](https://kotlinlang.org/docs/lambdas.html)

---

*深入学习中...*
