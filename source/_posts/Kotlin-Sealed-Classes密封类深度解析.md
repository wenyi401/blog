---
title: Kotlin Sealed Classes密封类深度解析
date: 2026-04-04 01:50:00
tags: [Kotlin, Sealed Class, 密封类, when表达式]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

密封类和接口提供受控的类层次结构继承。密封类的所有直接子类在编译时已知，不能在定义密封类的模块和包之外创建其他子类。结合 when 表达式使用时，可以覆盖所有可能的子类行为。

## 一、声明密封类和接口

使用 sealed 修饰符：

```kotlin
// 密封接口
sealed interface Error

// 密封类实现密封接口
sealed class IOError() : Error

// 子类扩展密封类
class FileReadError(val file: File) : IOError()
class DatabaseError(val source: DataSource) : IOError()

// 单例对象实现密封接口
object RuntimeError : Error
```

## 二、构造函数

密封类本身是抽象类，不能直接实例化。

### 基本用法

```kotlin
sealed class Error(val message: String) {
    class NetworkError : Error("Network failure")
    class DatabaseError : Error("Database cannot be reached")
    class UnknownError : Error("An unknown error has occurred")
}

fun main() {
    val errors = listOf(Error.NetworkError(), Error.DatabaseError(), Error.UnknownError())
    errors.forEach { println(it.message) }
}
```

### 与枚举结合

```kotlin
enum class ErrorSeverity { MINOR, MAJOR, CRITICAL }

sealed class Error(val severity: ErrorSeverity) {
    class FileReadError(val file: File) : Error(ErrorSeverity.MAJOR)
    class DatabaseError(val source: DataSource) : Error(ErrorSeverity.CRITICAL)
    object RuntimeError : Error(ErrorSeverity.CRITICAL)
}
```

### 构造函数可见性

密封类构造函数只能为 protected（默认）或 private：

```kotlin
sealed class IOError {
    // protected 可见性（默认）
    constructor() { }
    
    // private 构造函数
    private constructor(description: String) : this() { }
    
    // 错误：不允许 public 或 internal
    // public constructor(code: Int) : this() {}
}
```

## 三、继承规则

### 直接子类

直接子类必须在同一包中声明：

```kotlin
// 密封接口
sealed interface Error

// 密封类扩展接口
sealed class IOError() : Error

// 开放类可以任意扩展
open class CustomError() : Error
```

### 子类限制

- 子类必须有正确的限定名
- 不能是局部类或匿名对象
- 可以有任意可见性

### 多平台项目

在多平台项目中，直接子类必须在同一源集：

```kotlin
// common 源集
expect sealed class Error

// 平台源集
actual sealed class Error {
    class NetworkError : Error()
}
```

## 四、与 when 表达式配合

这是密封类的关键优势：编译器检查穷尽性。

```kotlin
sealed class Error {
    class FileReadError(val file: String) : Error()
    class DatabaseError(val source: String) : Error()
    object RuntimeError : Error()
}

fun log(e: Error) = when(e) {
    is Error.FileReadError -> println("Error while reading file ${e.file}")
    is Error.DatabaseError -> println("Error while reading from database ${e.source}")
    Error.RuntimeError -> println("Runtime error")
    // 不需要 else 子句
}
```

**关键点**：
- 编译器验证所有情况都已覆盖
- 不需要 else 子句
- 添加新子类时，编译器会提示更新

### Guard 条件

```kotlin
sealed class Error {
    data class HttpError(val code: Int) : Error()
    object NetworkError : Error()
}

fun handle(e: Error) = when(e) {
    is Error.HttpError if e.code == 404 -> println("Not found")
    is Error.HttpError if e.code == 500 -> println("Server error")
    is Error.HttpError -> println("HTTP error: ${e.code}")
    Error.NetworkError -> println("Network error")
}
```

## 五、用例场景

### 1. UI 状态管理

```kotlin
sealed class UIState {
    data object Loading : UIState()
    data class Success(val data: String) : UIState()
    data class Error(val exception: Exception) : UIState()
}

fun updateUI(state: UIState) {
    when (state) {
        is UIState.Loading -> showLoadingIndicator()
        is UIState.Success -> showData(state.data)
        is UIState.Error -> showError(state.exception)
    }
}
```

### 2. 支付方法处理

```kotlin
sealed class Payment {
    data class CreditCard(val number: String, val expiryDate: String) : Payment()
    data class PayPal(val email: String) : Payment()
    data object Cash : Payment()
}

fun processPayment(payment: Payment) {
    when (payment) {
        is Payment.CreditCard -> processCreditCardPayment(payment.number, payment.expiryDate)
        is Payment.PayPal -> processPayPalPayment(payment.email)
        is Payment.Cash -> processCashPayment()
    }
}
```

### 3. API 请求响应处理

```kotlin
// 密封接口定义请求类型
sealed interface ApiRequest

@Serializable
data class LoginRequest(val username: String, val password: String) : ApiRequest

object LogoutRequest : ApiRequest

// 密封类定义响应类型
sealed class ApiResponse {
    data class UserSuccess(val user: UserData) : ApiResponse()
    data object UserNotFound : ApiResponse()
    data class Error(val message: String) : ApiResponse()
}

fun handleRequest(request: ApiRequest): ApiResponse {
    return when (request) {
        is LoginRequest -> {
            if (isValidUser(request.username, request.password)) {
                ApiResponse.UserSuccess(UserData("userId", "userName", "userEmail"))
            } else {
                ApiResponse.Error("Invalid username or password")
            }
        }
        is LogoutRequest -> {
            ApiResponse.UserSuccess(UserData("userId", "userName", "userEmail"))
        }
    }
}
```

## 六、密封类 vs 枚举

| 特性 | 密封类 | 枚举 |
|------|--------|------|
| 实例 | 多个实例 | 单例 |
| 状态 | 可持有状态 | 固定值 |
| 继承 | 可扩展 | 不可扩展 |
| 类型 | 类型安全 | 值安全 |

### 选择建议

- **使用枚举**：固定常量集合，无需状态
- **使用密封类**：有限类型集合，需要状态或扩展

```kotlin
// 枚举适合：固定常量
enum class Direction { NORTH, SOUTH, EAST, WEST }

// 密封类适合：有状态的类型
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val exception: Exception) : Result()
}
```

## 七、最佳实践

### 1. 使用 data class 和 data object

```kotlin
sealed class Result {
    data object Loading : Result()
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
}
```

### 2. 在 ViewModel 中使用

```kotlin
class MyViewModel : ViewModel() {
    private val _state = MutableStateFlow<UIState>(UIState.Loading)
    val state: StateFlow<UIState> = _state
    
    fun loadData() {
        viewModelScope.launch {
            _state.value = UIState.Loading
            try {
                val data = repository.fetchData()
                _state.value = UIState.Success(data)
            } catch (e: Exception) {
                _state.value = UIState.Error(e)
            }
        }
    }
}
```

### 3. 在 Repository 中使用

```kotlin
sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val exception: Exception) : NetworkResult<Nothing>()
    data object Loading : NetworkResult<Nothing>()
}

suspend fun <T> safeApiCall(call: suspend () -> T): NetworkResult<T> {
    return try {
        NetworkResult.Success(call())
    } catch (e: Exception) {
        NetworkResult.Error(e)
    }
}
```

## 学习资源

- [Sealed classes and interfaces | Kotlin Documentation](https://kotlinlang.org/docs/sealed-classes.html)
- [Kotlin Enum vs Sealed Class](https://juejin.cn/post/7606621855853314048)

---

*深入学习中...*
