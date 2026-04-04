---
title: Kotlin委托模式学习-类委托与属性委托
date: 2026-04-03 23:20:00
tags: [Kotlin, Delegate, 委托, 设计模式]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

委托模式（Delegation pattern）已被证明是实现继承的良好替代方案，Kotlin 原生支持委托，无需样板代码。

## 一、类委托

### 基本语法

```kotlin
interface Base {
    fun print()
}

class BaseImpl(val x: Int) : Base {
    override fun print() { print(x) }
}

class Derived(b: Base) : Base by b

fun main() {
    val base = BaseImpl(10)
    Derived(base).print() // 10
}
```

`by` 子句表示 `b` 将在 `Derived` 对象内部存储，编译器会生成所有 `Base` 的方法，转发给 `b`。

### 覆盖委托成员

```kotlin
interface Base {
    fun printMessage()
    fun printMessageLine()
}

class BaseImpl(val x: Int) : Base {
    override fun printMessage() { print(x) }
    override fun printMessageLine() { println(x) }
}

class Derived(b: Base) : Base by b {
    override fun printMessage() { print("abc") }
}

fun main() {
    val base = BaseImpl(10)
    Derived(base).printMessage() // abc
    Derived(base).printMessageLine() // 10
}
```

### 注意事项

委托对象只能访问自己的实现：

```kotlin
interface Base {
    val message: String
    fun print()
}

class BaseImpl(x: Int) : Base {
    override val message = "BaseImpl: x = $x"
    override fun print() { println(message) }
}

class Derived(b: Base) : Base by b {
    override val message = "Message of Derived"
}

fun main() {
    val b = BaseImpl(10)
    val derived = Derived(b)
    derived.print() // BaseImpl: x = 10
    println(derived.message) // Message of Derived
}
```

## 二、属性委托

### 延迟属性（lazy）

```kotlin
val lazyValue: String by lazy {
    println("computed!")
    "Hello"
}

fun main() {
    println(lazyValue) // computed! \n Hello
    println(lazyValue) // Hello（不再计算）
}
```

### 可观察属性（observable）

```kotlin
import kotlin.properties.Delegates

var name: String by Delegates.observable("<no name>") { 
    _, old, new ->
    println("Name changed from $old to $new")
}

fun main() {
    name = "Alice" // Name changed from <no name> to Alice
    name = "Bob" // Name changed from Alice to Bob
}
```

### 否决属性（vetoable）

```kotlin
var age: Int by Delegates.vetoable(0) { _, old, new ->
    if (new < 0) {
        println("Age cannot be negative")
        false // 拒绝修改
    } else {
        true // 允许修改
    }
}

fun main() {
    age = 25 // 允许
    age = -5 // Age cannot be negative，拒绝
    println(age) // 25
}
```

### 映射属性

```kotlin
class User(val map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
}

fun main() {
    val user = User(mapOf(
        "name" to "Alice",
        "age" to 25
    ))
    println(user.name) // Alice
    println(user.age) // 25
}
```

## 三、自定义委托

### 定义 ReadWriteProperty

```kotlin
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class LoggingDelegate<T>(private var value: T) : ReadWriteProperty<Any?, T> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        println("Getting ${property.name}: $value")
        return value
    }
    
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        println("Setting ${property.name}: $value")
        this.value = value
    }
}

class Example {
    var name: String by LoggingDelegate("Default")
}

fun main() {
    val example = Example()
    println(example.name) // Getting name: Default
    example.name = "Alice" // Setting name: Alice
}
```

### 使用 provideDelegate

```kotlin
class ResourceLoader {
    operator fun provideDelegate(
        thisRef: Any?,
        property: KProperty<*>
    ): ReadOnlyProperty<Any?, String> {
        // 在属性初始化时执行逻辑
        println("Creating delegate for ${property.name}")
        return ReadOnlyProperty { _, _ -> "Value" }
    }
}

val resource: String by ResourceLoader()
```

## 四、标准委托

| 委托 | 描述 |
|------|------|
| `lazy` | 延迟初始化 |
| `Delegates.observable` | 属性变化通知 |
| `Delegates.vetoable` | 条件性属性修改 |
| `Delegates.notNull` | 非空属性延迟初始化 |
| `map` | 映射属性 |

## 五、委托 vs 继承

| 特性 | 委托 | 继承 |
|------|------|------|
| **耦合度** | 松散 | 紧密 |
| **灵活性** | 运行时改变 | 编译时固定 |
| **多继承** | 支持 | 不支持 |
| **代码复用** | 组合优于继承 | IS-A 关系 |

## 六、实际应用

### Android ViewModel 委托

```kotlin
class MainViewModel(
    private val repository: Repository
) : Repository by repository {
    // 自动继承 Repository 的方法
}
```

### 属性委托存储

```kotlin
class SharedPreferencesDelegate<T>(
    private val prefs: SharedPreferences,
    private val key: String,
    private val defaultValue: T
) : ReadWriteProperty<Any?, T> {
    
    @Suppress("UNCHECKED_CAST")
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return when (defaultValue) {
            is String -> prefs.getString(key, defaultValue) as T
            is Int -> prefs.getInt(key, defaultValue) as T
            is Boolean -> prefs.getBoolean(key, defaultValue) as T
            else -> throw IllegalArgumentException("Unsupported type")
        }
    }
    
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        with(prefs.edit()) {
            when (value) {
                is String -> putString(key, value)
                is Int -> putInt(key, value)
                is Boolean -> putBoolean(key, value)
                else -> throw IllegalArgumentException("Unsupported type")
            }
            apply()
        }
    }
}
```

## 七、最佳实践

1. **优先使用委托而非继承**：组合优于继承
2. **合理使用 lazy**：避免不必要的初始化
3. **注意线程安全**：lazy 默认是线程安全的
4. **避免过度委托**：保持代码可读性
5. **理解委托的生命周期**：避免内存泄漏

## 学习资源

- [Delegation | Kotlin Documentation](https://kotlinlang.org/docs/delegation.html)
- [属性委托 · Kotlin 官方文档 中文版](https://book.kotlincn.net/text/delegated-properties.html)
- [深入解析Kotlin委托](https://www.cnblogs.com/jzssuanfa/p/19813208)

---

*持续学习中...*
