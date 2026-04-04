---
title: Kotlin数据类与when表达式实战
date: 2026-04-03 23:41:00
tags: [Kotlin, Data Class, when, Sealed Class, 模式匹配]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 的数据类（Data Class）和 when 表达式结合使用，配合密封类（Sealed Class），可以实现编译时安全的模式匹配。

## 一、Data Class

### 基本定义

```kotlin
data class User(val name: String, val age: Int)
```

### 自动生成的函数

| 函数 | 描述 |
|------|------|
| `equals()` | 比较属性值 |
| `hashCode()` | 基于属性生成哈希 |
| `toString()` | 返回 "User(name=John, age=30)" |
| `componentN()` | 解构声明 |
| `copy()` | 复制并修改部分属性 |

### 解构声明

```kotlin
val user = User("Alice", 25)
val (name, age) = user

println(name)  // Alice
println(age)   // 25
```

### copy 函数

```kotlin
val user = User("Alice", 25)
val olderUser = user.copy(age = 26)

println(olderUser)  // User(name=Alice, age=26)
```

## 二、when 表达式

### 基本语法

```kotlin
val result = when (x) {
    1 -> "One"
    2 -> "Two"
    3, 4 -> "Three or Four"
    in 5..10 -> "Five to Ten"
    else -> "Unknown"
}
```

### 类型检查

```kotlin
fun describe(obj: Any): String = when (obj) {
    is String -> "String of length ${obj.length}"
    is Int -> "Integer: $obj"
    is List<*> -> "List with ${obj.size} elements"
    else -> "Unknown type"
}
```

### 范围匹配

```kotlin
fun describeNumber(n: Int): String = when {
    n < 0 -> "Negative"
    n == 0 -> "Zero"
    n in 1..10 -> "Small"
    n in 11..100 -> "Medium"
    else -> "Large"
}
```

## 三、Sealed Class + when

### 完整覆盖

```kotlin
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
    object Loading : Result()
}

fun handleResult(result: Result): String = when (result) {
    is Result.Success -> "Data: ${result.data}"
    is Result.Error -> "Error: ${result.message}"
    Result.Loading -> "Loading..."
    // 不需要 else 分支！
}
```

### 智能转换

```kotlin
fun processResult(result: Result) {
    when (result) {
        is Result.Success -> {
            // result 智能转换为 Result.Success
            println(result.data)
        }
        is Result.Error -> {
            // result 智能转换为 Result.Error
            println(result.message)
        }
        Result.Loading -> {
            println("Loading")
        }
    }
}
```

## 四、实战应用

### 1. 网络请求状态

```kotlin
sealed class NetworkState<out T> {
    data class Success<T>(val data: T) : NetworkState<T>()
    data class Error(val exception: Throwable) : NetworkState<Nothing>()
    object Loading : NetworkState<Nothing>()
}

@Composable
fun <T> NetworkStateContent(
    state: NetworkState<T>,
    onSuccess: @Composable (T) -> Unit,
    onError: @Composable (Throwable) -> Unit,
    onLoading: @Composable () -> Unit
) {
    when (state) {
        is NetworkState.Success -> onSuccess(state.data)
        is NetworkState.Error -> onError(state.exception)
        NetworkState.Loading -> onLoading()
    }
}
```

### 2. 表单验证

```kotlin
sealed class FormField {
    data class Email(val value: String) : FormField()
    data class Password(val value: String) : FormField()
    data class Phone(val value: String) : FormField()
}

fun validate(field: FormField): ValidationResult = when (field) {
    is FormField.Email -> {
        if (field.value.contains("@")) ValidationResult.Valid
        else ValidationResult.Invalid("Invalid email")
    }
    is FormField.Password -> {
        if (field.value.length >= 8) ValidationResult.Valid
        else ValidationResult.Invalid("Too short")
    }
    is FormField.Phone -> {
        if (field.value.matches(Regex("\\d{10}"))) ValidationResult.Valid
        else ValidationResult.Invalid("Invalid phone")
    }
}
```

### 3. 订单状态

```kotlin
sealed class OrderStatus {
    object Pending : OrderStatus()
    object Processing : OrderStatus()
    data class Shipped(val trackingNumber: String) : OrderStatus()
    data class Delivered(val deliveryDate: String) : OrderStatus()
    data class Cancelled(val reason: String) : OrderStatus()
}

fun getStatusText(status: OrderStatus): String = when (status) {
    OrderStatus.Pending -> "待处理"
    OrderStatus.Processing -> "处理中"
    is OrderStatus.Shipped -> "已发货: ${status.trackingNumber}"
    is OrderStatus.Delivered -> "已送达: ${status.deliveryDate}"
    is OrderStatus.Cancelled -> "已取消: ${status.reason}"
}
```

### 4. RecyclerView 多类型

```kotlin
sealed class ListItem {
    data class Header(val title: String) : ListItem()
    data class Content(val id: String, val text: String) : ListItem()
    data class Footer(val page: Int) : ListItem()
}

class MultiTypeAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    
    override fun getItemViewType(position: Int): Int = when (items[position]) {
        is ListItem.Header -> TYPE_HEADER
        is ListItem.Content -> TYPE_CONTENT
        is ListItem.Footer -> TYPE_FOOTER
    }
    
    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is ListItem.Header -> (holder as HeaderHolder).bind(item.title)
            is ListItem.Content -> (holder as ContentHolder).bind(item.text)
            is ListItem.Footer -> (holder as FooterHolder).bind(item.page)
        }
    }
}
```

## 五、when 表达式技巧

### 1. 组合条件

```kotlin
when {
    x > 0 && y > 0 -> "First quadrant"
    x < 0 && y > 0 -> "Second quadrant"
    x < 0 && y < 0 -> "Third quadrant"
    x > 0 && y < 0 -> "Fourth quadrant"
    else -> "On axis"
}
```

### 2. 捕获条件

```kotlin
when (val result = computeResult()) {
    is Result.Success -> println(result.data)
    is Result.Error -> println(result.message)
}
```

### 3. 函数返回

```kotlin
fun describe(x: Any): String = when (x) {
    0 -> "zero"
    1, 2 -> "low"
    in 3..10 -> "medium"
    else -> "unknown"
}
```

## 六、最佳实践

1. **编译时安全**：使用密封类 + when 避免遗漏
2. **智能转换**：利用 when 的类型检查
3. **避免 else**：让编译器帮助检查完整性
4. **数据类**：自动生成 equals、hashCode、toString

## 学习资源

- [Sealed classes and interfaces | Kotlin Documentation](https://kotlinlang.org/docs/sealed-classes.html)
- [Kotlin 数据类与密封类](https://www.runoob.com/kotlin/kotlin-data-sealed-classes.html)
- [Using Sealed Classes in Kotlin: Compile-Time Safety with when](https://medium.com/@yilmazgokhan/using-sealed-classes-in-kotlin-compile-time-safety-with-when-a1de2dd32385)

---

*持续学习中...*
