---
title: Kotlin密封类与密封接口学习
date: 2026-04-03 23:25:00
tags: [Kotlin, Sealed Class, 密封类, 密封接口, 模式匹配]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

密封类和密封接口提供受控的类层次结构继承。密封类的所有直接子类在编译时已知，不允许在定义密封类的模块和包之外出现其他子类。结合 when 表达式，可以覆盖所有可能的子类行为。

## 一、声明密封类或接口

### 基本语法

```kotlin
// 创建密封接口
sealed interface Error

// 创建实现密封接口的密封类
sealed class IOError(): Error

// 定义扩展密封类的子类
class FileReadError(val file: File): IOError()
class DatabaseError(val source: DataSource): IOError()

// 创建实现密封接口的单例对象
object RuntimeError : Error
```

### 类层次结构

```
Error (sealed interface)
├── IOError (sealed class)
│   ├── FileReadError
│   └── DatabaseError
└── RuntimeError (object)
```

## 二、密封类的应用场景

### 适用场景

| 场景 | 描述 |
|------|------|
| **有限的类继承** | 预定义的、有限的子类集合 |
| **类型安全设计** | 状态管理或复杂条件逻辑 |
| **封闭 API** | 库的健壮且可维护的公共 API |

### 示例：错误处理

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

## 三、构造函数

### 可见性

密封类的构造函数可以具有以下可见性：
- `protected`（默认）
- `private`

```kotlin
sealed class IOError {
    // 默认 protected
    constructor() { /*...*/ }

    // private 构造函数
    private constructor(description: String): this() { /*...*/ }
    
    // ❌ 不允许 public 或 internal
    // public constructor(code: Int): this() {}
}
```

### 结合枚举

```kotlin
enum class ErrorSeverity { MINOR, MAJOR, CRITICAL }

sealed class Error(val severity: ErrorSeverity) {
    class FileReadError(val file: File): Error(ErrorSeverity.MAJOR)
    class DatabaseError(val source: DataSource): Error(ErrorSeverity.CRITICAL)
    object RuntimeError : Error(ErrorSeverity.CRITICAL)
}
```

## 四、继承规则

### 包内声明

直接子类必须在同一个包中声明：

```kotlin
// 同一文件或同一包内
sealed class UIState {
    object Loading : UIState()
    data class Success(val data: String) : UIState()
    data class Error(val message: String) : UIState()
}
```

### 子类类型

子类可以是：
- 数据类
- 普通类
- 对象
- 另一个密封类

```kotlin
sealed class Expr {
    data class Const(val number: Double) : Expr()
    data class Sum(val e1: Expr, val e2: Expr) : Expr()
    object NotANumber : Expr()
}
```

## 五、when 表达式

### 完整覆盖

```kotlin
fun evaluate(expr: Expr): Double = when (expr) {
    is Expr.Const -> expr.number
    is Expr.Sum -> evaluate(expr.e1) + evaluate(expr.e2)
    Expr.NotANumber -> Double.NaN
    // 不需要 else 分支，所有情况已覆盖
}
```

### 智能类型转换

```kotlin
fun handleState(state: UIState) {
    when (state) {
        is UIState.Loading -> showLoading()
        is UIState.Success -> showData(state.data) // 智能转换
        is UIState.Error -> showError(state.message)
    }
}
```

## 六、密封接口

### 定义

```kotlin
sealed interface Drawable {
    fun draw()
}

class Circle(val radius: Double) : Drawable {
    override fun draw() { /*...*/ }
}

class Rectangle(val width: Double, val height: Double) : Drawable {
    override fun draw() { /*...*/ }
}
```

### 多继承

```kotlin
sealed interface A
sealed interface B

class C : A, B  // 可以实现多个密封接口
```

## 七、实际应用

### 网络请求状态

```kotlin
sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val exception: Throwable) : NetworkResult<Nothing>()
    object Loading : NetworkResult<Nothing>()
}

fun <T> handleResult(result: NetworkResult<T>) {
    when (result) {
        is NetworkResult.Success -> {
            // 处理成功
            showData(result.data)
        }
        is NetworkResult.Error -> {
            // 处理错误
            showError(result.exception.message)
        }
        is NetworkResult.Loading -> {
            // 显示加载中
            showLoading()
        }
    }
}
```

### RecyclerView 适配器

```kotlin
sealed class ListItem {
    data class Header(val title: String) : ListItem()
    data class Content(val id: Int, val text: String) : ListItem()
    data class Footer(val page: Int) : ListItem()
}

class MyAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    
    override fun getItemViewType(position: Int): Int {
        return when (items[position]) {
            is ListItem.Header -> TYPE_HEADER
            is ListItem.Content -> TYPE_CONTENT
            is ListItem.Footer -> TYPE_FOOTER
        }
    }
}
```

### 导航路由

```kotlin
sealed class Screen {
    object Home : Screen()
    object Settings : Screen()
    data class Detail(val id: String) : Screen()
    data class Profile(val userId: Int) : Screen()
}

fun navigate(screen: Screen) {
    when (screen) {
        Screen.Home -> navController.navigate("home")
        Screen.Settings -> navController.navigate("settings")
        is Screen.Detail -> navController.navigate("detail/${screen.id}")
        is Screen.Profile -> navController.navigate("profile/${screen.userId}")
    }
}
```

## 八、密封类 vs 枚举

| 特性 | 密封类 | 枚举 |
|------|--------|------|
| **实例数量** | 可以有多个实例 | 每个常量只有一个实例 |
| **状态** | 可以持有状态 | 只能是单例 |
| **继承** | 可以扩展 | 不能继承 |
| **类型检查** | 编译时完整覆盖 | 需要手动覆盖 |
| **使用场景** | 复杂状态 | 简单常量 |

## 九、最佳实践

1. **有限状态管理**：使用密封类表示有限的 UI 状态
2. **完整 when 覆盖**：利用编译器检查所有情况
3. **避免 else 分支**：让编译器帮助检查完整性
4. **结合数据类**：携带丰富的状态信息
5. **单一职责**：每个子类只表示一种状态

## 学习资源

- [Sealed classes and interfaces | Kotlin Documentation](https://kotlinlang.org/docs/sealed-classes.html)
- [密封类与密封接口 · Kotlin 官方文档 中文版](https://book.kotlincn.net/text/sealed-classes.html)
- [Kotlin中 Sealed Class密封类](https://blog.csdn.net/wangsen927/article/details/159516130)

---

*持续学习中...*
