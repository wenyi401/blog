---
title: Kotlin Flow操作符实战-map filter transform
date: 2026-04-03 23:42:00
tags: [Kotlin, Flow, 操作符, map, filter, transform]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin Flow 操作符是处理异步数据流的核心工具。本文将详细介绍常用的转换和过滤操作符，包括 map、filter、transform 等。

## 一、操作符分类

| 类别 | 操作符 |
|------|--------|
| **转换** | map, mapLatest, transform, transformLatest |
| **过滤** | filter, filterNot, filterNotNull, take, drop |
| **组合** | zip, combine, merge, flattenConcat |
| **终端** | collect, toList, first, single |
| **缓冲** | buffer, conflate, flowOn |

## 二、map 操作符

### 基本用法

```kotlin
flowOf(1, 2, 3)
    .map { it * 2 }
    .collect { println(it) }  // 2, 4, 6
```

### 类型转换

```kotlin
flowOf(1, 2, 3)
    .map { "Number: $it" }
    .collect { println(it) }
// Number: 1, Number: 2, Number: 3
```

### mapLatest

```kotlin
flow {
    emit(1)
    delay(100)
    emit(2)
    delay(100)
    emit(3)
}
.mapLatest { value ->
    delay(150)
    "Processed: $value"
}
.collect { println(it) }
// 只输出 Processed: 3
```

## 三、filter 操作符

### filter

```kotlin
flowOf(1, 2, 3, 4, 5)
    .filter { it % 2 == 0 }
    .collect { println(it) }  // 2, 4
```

### filterNot

```kotlin
flowOf(1, 2, 3, 4, 5)
    .filterNot { it % 2 == 0 }
    .collect { println(it) }  // 1, 3, 5
```

### filterNotNull

```kotlin
flowOf(1, null, 3, null, 5)
    .filterNotNull()
    .collect { println(it) }  // 1, 3, 5
```

### filterIsInstance

```kotlin
flowOf(1, "Hello", 3, "World")
    .filterIsInstance<String>()
    .collect { println(it) }  // Hello, World
```

## 四、transform 操作符

### 基本用法

```kotlin
flowOf(1, 2, 3)
    .transform { value ->
        emit("Start: $value")
        emit("End: $value")
    }
    .collect { println(it) }
// Start: 1, End: 1, Start: 2, End: 2, Start: 3, End: 3
```

### 实现 filter + map

```kotlin
flowOf(1, 2, 3, 4, 5)
    .transform { value ->
        if (value % 2 == 0) {
            emit(value * 10)
        }
    }
    .collect { println(it) }  // 20, 40
```

### 多次发射

```kotlin
flowOf("a", "b", "c")
    .transform { value ->
        emit(value.uppercase())
        emit(value.lowercase())
    }
    .collect { println(it) }
// A, a, B, b, C, c
```

## 五、take 操作符

### take

```kotlin
flowOf(1, 2, 3, 4, 5)
    .take(3)
    .collect { println(it) }  // 1, 2, 3
```

### takeWhile

```kotlin
flowOf(1, 2, 3, 4, 5)
    .takeWhile { it < 4 }
    .collect { println(it) }  // 1, 2, 3
```

### takeLast

```kotlin
flowOf(1, 2, 3, 4, 5)
    .takeLast(2)
    .collect { println(it) }  // 4, 5
```

## 六、drop 操作符

### drop

```kotlin
flowOf(1, 2, 3, 4, 5)
    .drop(2)
    .collect { println(it) }  // 3, 4, 5
```

### dropWhile

```kotlin
flowOf(1, 2, 3, 4, 5)
    .dropWhile { it < 3 }
    .collect { println(it) }  // 3, 4, 5
```

## 七、distinct 操作符

### distinct

```kotlin
flowOf(1, 1, 2, 2, 3, 3)
    .distinct()
    .collect { println(it) }  // 1, 2, 3
```

### distinctBy

```kotlin
data class User(val id: Int, val name: String)

flowOf(
    User(1, "Alice"),
    User(2, "Bob"),
    User(1, "Alice2")
)
.distinctBy { it.id }
.collect { println(it) }
// User(1, Alice), User(2, Bob)
```

## 八、实战应用

### 网络请求 + 缓存

```kotlin
fun loadData(): Flow<Result<Data>> = flow {
    // 先发射缓存数据
    val cached = cache.get()
    if (cached != null) {
        emit(Result.Loading(cached))
    }
    
    // 发射网络数据
    val remote = api.fetch()
    emit(Result.Success(remote))
}
.flowOn(Dispatchers.IO)
```

### 搜索防抖

```kotlin
fun search(query: Flow<String>): Flow<List<Item>> = query
    .debounce(300)
    .filter { it.length >= 2 }
    .distinctUntilChanged()
    .mapLatest { query ->
        repository.search(query)
    }
    .flowOn(Dispatchers.IO)
```

### 数据转换流水线

```kotlin
flowOf(1, 2, 3, 4, 5)
    .filter { it % 2 == 0 }
    .map { it * 10 }
    .take(2)
    .collect { println(it) }  // 20, 40
```

## 九、性能考虑

### 操作符选择

| 操作符 | 性能 | 场景 |
|--------|------|------|
| map | 高 | 简单转换 |
| transform | 中 | 复杂逻辑 |
| mapLatest | 中 | 需要取消前一个 |

### 避免过度操作

```kotlin
// ❌ 错误：多次遍历
flow.map { ... }.filter { ... }.map { ... }

// ✅ 正确：合并操作
flow.transform { value ->
    if (condition(value)) {
        emit(transform(value))
    }
}
```

## 十、最佳实践

1. **链式调用**：充分利用操作符组合
2. **选择合适的操作符**：根据需求选择
3. **注意线程切换**：使用 flowOn
4. **异常处理**：使用 catch 操作符
5. **资源清理**：使用 onCompletion

## 学习资源

- [transform | kotlinx.coroutines](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/transform.html)
- [玩转 Flow 操作符：数据转换与过滤](https://juejin.cn/post/7565813468727361555)
- [Kotlin Flow Operators — Complete Guide](https://medium.com/@shivayogih25/kotlin-flow-operators-complete-guide-with-use-cases-995270effdc9)

---

*持续学习中...*
