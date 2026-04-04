---
title: Kotlin对象声明与表达式深度解析
date: 2026-04-04 03:50:00
tags: [Kotlin, Object, 单例, 伴生对象]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 中的对象允许在单个步骤中定义类并创建其实例。这对于需要可重用的单例实例或一次性对象非常有用。

## 一、对象声明（Object Declarations）

### 单例模式

```kotlin
object DataProviderManager {
    private val providers = mutableListOf<DataProvider>()
    
    fun registerDataProvider(provider: DataProvider) {
        providers.add(provider)
    }
    
    val allDataProviders: Collection<DataProvider>
        get() = providers
}

// 使用
DataProviderManager.registerDataProvider(provider)
```

### 继承超类型

```kotlin
object DefaultListener : MouseAdapter() {
    override fun mouseClicked(e: MouseEvent) { }
    override fun mouseEntered(e: MouseEvent) { }
}
```

### 限制

对象声明不能是局部的（不能嵌套在函数内），但可以嵌套在其他对象声明或非内部类中。

## 二、数据对象（Data Objects）

### toString() 改进

```kotlin
// 普通对象
object MyObject
println(MyObject) // MyObject@hashcode

// 数据对象
data object MyDataObject {
    val number: Int = 3
}
println(MyDataObject) // MyDataObject
```

### 自动生成的函数

- **toString()**：返回对象名称
- **equals()/hashCode()**：支持相等性检查和哈希集合

```kotlin
import java.lang.reflect.Constructor

data object MySingleton

fun main() {
    val evilTwin = createInstanceViaReflection()
    
    println(MySingleton == evilTwin) // true
    println(MySingleton === evilTwin) // false
}
```

### 与密封层次结构配合

```kotlin
sealed interface ReadResult
data class Number(val number: Int) : ReadResult
data class Text(val text: String) : ReadResult
data object EndOfFile : ReadResult

fun main() {
    println(Number(7))  // Number(number=7)
    println(EndOfFile)  // EndOfFile
}
```

### data object vs data class

| 特性 | data object | data class |
|------|-------------|------------|
| copy() | 无 | 有 |
| componentN() | 无 | 有 |
| toString() | 返回名称 | 返回属性 |

## 三、伴生对象（Companion Objects）

### 基本用法

```kotlin
class MyClass {
    companion object Factory {
        fun create(): MyClass = MyClass()
    }
}

// 调用
val instance = MyClass.create()
```

### 省略名称

```kotlin
class User(val name: String) {
    companion object { }
}

val companionUser = User.Companion
```

### 访问私有成员

```kotlin
class User(val name: String) {
    companion object {
        private val defaultGreeting = "Hello"
    }
    
    fun sayHi() {
        println(defaultGreeting)
    }
}
```

### 类名作为引用

```kotlin
class User1 {
    companion object Named {
        fun show(): String = "User1's Named Companion Object"
    }
}

class User2 {
    companion object {
        fun show(): String = "User2's Companion Object"
    }
}

val reference1 = User1  // 指向伴生对象
val reference2 = User2  // 指向伴生对象
```

### 实现接口

```kotlin
interface Factory<T> {
    fun create(name: String): T
}

class User(val name: String) {
    companion object : Factory<User> {
        override fun create(name: String): User = User(name)
    }
}

// 使用
val userFactory: Factory<User> = User
val newUser = userFactory.create("Example User")
```

### @JvmStatic 注解

在 JVM 上，使用 @JvmStatic 生成真正的静态方法和字段：

```kotlin
class User {
    companion object {
        @JvmStatic
        fun create(): User = User()
        
        @JvmField
        val MAX_AGE = 150
    }
}
```

## 四、对象表达式（Object Expressions）

### 从零创建匿名对象

```kotlin
val helloWorld = object {
    val hello = "Hello"
    val world = "World"
    override fun toString() = "$hello $world"
}

print(helloWorld) // Hello World
```

### 继承超类型

```kotlin
window.addMouseListener(object : MouseAdapter() {
    override fun mouseClicked(e: MouseEvent) { }
    override fun mouseEntered(e: MouseEvent) { }
})
```

### 继承多个超类型

```kotlin
open class BankAccount(initialBalance: Int) {
    open val balance: Int = initialBalance
}

interface Transaction {
    fun execute()
}

val temporaryAccount = object : BankAccount(1000), Transaction {
    override val balance = 1500
    
    override fun execute() {
        println("Executing transaction. Balance: $balance")
    }
}
```

### 作为返回值

```kotlin
class UserPreferences {
    private fun getPreferences() = object {
        val theme: String = "Dark"
        val fontSize: Int = 14
    }
    
    fun printPreferences() {
        val preferences = getPreferences()
        println("Theme: ${preferences.theme}, Font Size: ${preferences.fontSize}")
    }
}
```

### 访问外部变量

```kotlin
fun countClicks(window: JComponent) {
    var clickCount = 0
    var enterCount = 0
    
    window.addMouseListener(object : MouseAdapter() {
        override fun mouseClicked(e: MouseEvent) {
            clickCount++
        }
        
        override fun mouseEntered(e: MouseEvent) {
            enterCount++
        }
    })
}
```

## 五、行为差异

| 特性 | 对象声明 | 对象表达式 | 伴生对象 |
|------|----------|-----------|----------|
| 初始化时机 | 首次访问时 | 立即执行 | 类加载时 |
| 作用域 | 全局 | 局部 | 类级别 |
| 命名 | 必须 | 可选 | 可选 |

## 六、最佳实践

### 1. 使用对象声明实现单例

```kotlin
object DatabaseManager {
    private val database = createDatabase()
    
    fun query(sql: String): Result {
        return database.execute(sql)
    }
}
```

### 2. 使用伴生对象实现工厂方法

```kotlin
class User private constructor(val name: String) {
    companion object {
        fun create(name: String): User = User(name)
        fun default(): User = User("Anonymous")
    }
}
```

### 3. 使用对象表达式处理回调

```kotlin
button.setOnClickListener(object : View.OnClickListener {
    override fun onClick(v: View) {
        // 处理点击
    }
})

// 或使用 SAM 转换
button.setOnClickListener {
    // 处理点击
}
```

### 4. 使用 data object 改进 toString()

```kotlin
sealed class UiState {
    data object Loading : UiState()
    data class Success(val data: String) : UiState()
    data class Error(val message: String) : UiState()
}
```

## 七、常见问题

### 问题 1：对象声明不能嵌套在函数中

**原因**：对象声明必须是顶层或在类/对象中。

**解决方案**：使用对象表达式或将其移到函数外部。

### 问题 2：匿名对象成员不可见

**原因**：返回类型推断为 Any 或超类型。

**解决方案**：将函数或属性声明为 private，或显式声明返回类型。

### 问题 3：伴生对象访问问题

**原因**：伴生对象成员实际上是实例成员。

**解决方案**：使用 @JvmStatic 注解生成静态方法。

## 学习资源

- [Object declarations and expressions | Kotlin Documentation](https://kotlinlang.org/docs/object-declarations.html)
- [Companion Objects | Kotlin Documentation](https://kotlinlang.org/docs/object-declarations.html#companion-objects)

---

*深入学习中...*
