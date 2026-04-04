---
title: Kotlin异常处理深度解析
date: 2026-04-04 00:50:00
tags: [Kotlin, Exception, try-catch, 异常处理, Nothing]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 将所有异常视为非受检异常，简化了异常处理流程。本文将深入解析 Kotlin 异常处理的核心概念、最佳实践和高级用法。

## 一、异常概述

Kotlin 异常处理包含两个主要操作：
- **抛出异常**：指示问题发生
- **捕获异常**：手动处理异常

异常由 Exception 类的子类表示，Exception 是 Throwable 的子类。

## 二、抛出异常

### 基本语法

```kotlin
throw IllegalArgumentException()
```

### 包含详细信息

```kotlin
val cause = IllegalStateException("Original cause: illegal state")

if (userInput < 0) {
    throw IllegalArgumentException("Input must be non-negative", cause)
}
```

## 三、前置条件函数

Kotlin 提供了前置条件函数，用于自动抛出异常：

| 函数 | 用途 | 抛出异常 |
|------|------|----------|
| require() | 验证输入参数 | IllegalArgumentException |
| check() | 验证对象/变量状态 | IllegalStateException |
| error() | 指示非法状态 | IllegalStateException |

### require() 函数

用于验证输入参数：

```kotlin
fun getIndices(count: Int): List<Int> {
    require(count >= 0) { "Count must be non-negative. You set count to $count." }
    return List(count) { it + 1 }
}

// 测试
getIndices(-1)  // 抛出 IllegalArgumentException
getIndices(3)   // [1, 2, 3]
```

### check() 函数

用于验证对象或变量状态：

```kotlin
var someState: String? = null

fun getStateValue(): String {
    val state = checkNotNull(someState) { "State must be set beforehand!" }
    check(state.isNotEmpty()) { "State must be non-empty!" }
    return state
}

// 测试
someState = null
getStateValue()  // 抛出 IllegalStateException: State must be set beforehand!

someState = ""
getStateValue()  // 抛出 IllegalStateException: State must be non-empty!

someState = "valid"
getStateValue()  // 返回 "valid"
```

### error() 函数

用于在 when 表达式中处理不应发生的情况：

```kotlin
class User(val name: String, val role: String)

fun processUserRole(user: User) {
    when (user.role) {
        "admin" -> println("${user.name} is an admin.")
        "editor" -> println("${user.name} is an editor.")
        "viewer" -> println("${user.name} is a viewer.")
        else -> error("Undefined role: ${user.role}")
    }
}

// 测试
processUserRole(User("Alice", "admin"))  // Alice is an admin.
processUserRole(User("Bob", "guest"))    // 抛出 IllegalStateException: Undefined role: guest
```

## 四、try-catch 块

### 基本用法

```kotlin
try {
    // 可能抛出异常的代码
} catch (e: SomeException) {
    // 处理异常
}
```

### 作为表达式

```kotlin
val num: Int = try {
    count()
} catch (e: ArithmeticException) {
    -1
}
```

### 多个 catch 块

```kotlin
open class WithdrawalException(message: String) : Exception(message)
class InsufficientFundsException(message: String) : WithdrawalException(message)

fun processWithdrawal(amount: Double, availableFunds: Double) {
    if (amount > availableFunds) {
        throw InsufficientFundsException("Insufficient funds for the withdrawal.")
    }
    if (amount < 1 || amount % 1 != 0.0) {
        throw WithdrawalException("Invalid withdrawal amount.")
    }
    println("Withdrawal processed")
}

try {
    processWithdrawal(withdrawalAmount, availableFunds)
} catch (e: InsufficientFundsException) {
    println("Caught an InsufficientFundsException: ${e.message}")
} catch (e: WithdrawalException) {
    println("Caught a WithdrawalException: ${e.message}")
}
```

**注意**：catch 块的顺序很重要！从最具体到最不具体排序。

## 五、finally 块

finally 块始终执行，无论是否发生异常：

```kotlin
fun divideOrNull(a: Int): Int {
    try {
        val b = 44 / a
        println("try block: Executing division: $b")
        return b
    } catch (e: ArithmeticException) {
        println("catch block: Encountered ArithmeticException $e")
        return -1
    } finally {
        println("finally block: The finally block is always executed")
    }
}

divideOrNull(0)
// 输出：
// try block: Executing division: ...
// finally block: The finally block is always executed
```

### 资源清理

```kotlin
val resource = MockResource()
try {
    resource.use()
} finally {
    resource.close()  // 确保资源始终关闭
}
```

## 六、自定义异常

### 基本自定义异常

```kotlin
class MyException : Exception("My message")

class NumberTooLargeException : ArithmeticException("Number is too large")
```

### 异常层次结构

使用 sealed class 创建异常层次结构：

```kotlin
sealed class AccountException(message: String, cause: Throwable? = null) : Exception(message, cause)

class InvalidAccountCredentialsException : AccountException("Invalid account credentials detected")

class APIKeyExpiredException(
    message: String = "API key expired",
    cause: Throwable? = null
) : AccountException(message, cause)

fun validateAccount() {
    if (!areCredentialsValid()) throw InvalidAccountCredentialsException()
    if (isAPIKeyExpired()) {
        val cause = RuntimeException("API key validation failed due to network error")
        throw APIKeyExpiredException(cause = cause)
    }
}

try {
    validateAccount()
} catch (e: AccountException) {
    println("Error: ${e.message}")
    e.cause?.let { println("Caused by: ${it.message}") }
}
```

## 七、Nothing 类型

Nothing 是 Kotlin 的特殊类型，表示永不成功完成的函数或表达式。

### 用作返回类型

```kotlin
fun fail(message: String): Nothing {
    throw IllegalArgumentException(message)
}

val person = Person(name = null)
val s: String = person.name ?: fail("Name required")
// 's' 保证已初始化
```

### TODO() 函数

```kotlin
fun notImplementedFunction(): Int {
    TODO("This function is not yet implemented")
}
// 抛出 NotImplementedError
```

### 编译器推断

当编译器推断到 Nothing 类型时，会警告。显式定义 Nothing 可以消除警告：

```kotlin
fun alwaysThrow(): Nothing {
    throw Exception("Always throws")
}
```

## 八、常见异常类型

所有异常都是 RuntimeException 的子类：

| 异常 | 说明 |
|------|------|
| ArithmeticException | 算术运算异常（如除零） |
| IndexOutOfBoundsException | 索引越界 |
| NoSuchElementException | 元素不存在 |
| NumberFormatException | 数字格式错误 |
| NullPointerException | 空指针异常 |

### 示例

```kotlin
// ArithmeticException
val example = 2 / 0

// IndexOutOfBoundsException
val myList = mutableListOf(1, 2, 3)
myList.removeAt(3)

// NoSuchElementException
val emptyList = listOf()
val firstElement = emptyList.first()

// NumberFormatException
val string = "This is not a number"
val number = string.toInt()

// NullPointerException
val text: String? = null
println(text!!.length)
```

## 九、异常层次结构

```
Throwable
├── Error (严重问题，不应处理)
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception (可处理的条件)
    ├── RuntimeException
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   └── ...
    └── IOException
        └── ...
```

## 十、栈跟踪

栈跟踪显示导致异常的函数调用序列：

```kotlin
fun main() {
    throw ArithmeticException("This is an arithmetic exception!")
}
```

输出：
```
Exception in thread "main" java.lang.ArithmeticException: This is an arithmetic exception!
 at MainKt.main(Main.kt:3)
 at MainKt.main(Main.kt)
```

## 十一、与其他语言的互操作

### @Throws 注解

当 Kotlin 代码被 Java、Swift 或 Objective-C 调用时，可以使用 @Throws 注解通知调用者可能的异常：

```kotlin
@Throws(IOException::class)
fun readFile(path: String): String {
    // 可能抛出 IOException
}
```

## 十二、最佳实践

### 1. 使用前置条件函数

```kotlin
// 推荐
fun process(value: Int) {
    require(value >= 0) { "Value must be non-negative" }
    check(initialized) { "Not initialized" }
}

// 不推荐
fun process(value: Int) {
    if (value < 0) {
        throw IllegalArgumentException("Value must be non-negative")
    }
}
```

### 2. 创建有意义的异常消息

```kotlin
// 推荐
throw IllegalArgumentException("User age must be at least 18, but was $age")

// 不推荐
throw IllegalArgumentException("Invalid age")
```

### 3. 保留原始原因

```kotlin
try {
    // 操作
} catch (e: IOException) {
    throw MyException("Operation failed", e)  // 保留原始异常
}
```

### 4. 使用 sealed class 创建异常层次结构

```kotlin
sealed class AppException : Exception()
class NetworkException : AppException()
class DatabaseException : AppException()
class ValidationException : AppException()
```

## 学习资源

- [Exception and error handling | Kotlin Documentation](https://kotlinlang.org/docs/exceptions.html)
- [Kotlin 异常处理新玩法：runCatching 与 try-catch 的"华山论剑"](https://juejin.cn/post/7528183432443904035)

---

*深入学习中...*
