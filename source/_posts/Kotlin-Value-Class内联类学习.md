---
title: Kotlin Value Class内联类学习
date: 2026-04-03 23:23:00
tags: [Kotlin, Value Class, Inline Class, 性能优化]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

有时将值包装在类中以创建更特定于域的类型很有用。但是，由于额外的堆分配问题，它会引入运行时的性能开销。此外，如果被包装的类型是原始类型，性能损失会很大。Kotlin 引入了一种特殊的类——内联类（Inline Class / Value Class）来解决这个问题。

## 一、声明内联类

### 基本语法

```kotlin
value class Password(private val s: String)
```

### JVM 后端

```kotlin
@JvmInline
value class Password(private val s: String)
```

### 内联原理

内联类必须有一个在主构造函数中初始化的单一属性。运行时，内联类的实例将使用这个单一属性来表示：

```kotlin
// 运行时 securePassword 只包含 String
val securePassword = Password("Don't try this in production")
```

## 二、内联类成员

### 属性和函数

```kotlin
@JvmInline
value class Person(private val fullName: String) {
    init {
        require(fullName.isNotEmpty()) {
            "Full name shouldn't be empty"
        }
    }

    constructor(firstName: String, lastName: String) : this("$firstName $lastName") {
        require(lastName.isNotBlank()) {
            "Last name shouldn't be empty"
        }
    }

    val length: Int
        get() = fullName.length

    fun greet() {
        println("Hello, $fullName")
    }
}

fun main() {
    val name1 = Person("Kotlin", "Mascot")
    val name2 = Person("Kodee")
    name1.greet() // 作为静态方法调用
    println(name2.length) // 属性 getter 作为静态方法调用
}
```

### 限制

- 内联类属性不能有幕后字段
- 只能有简单的可计算属性
- 不支持 lateinit / 委托属性

## 三、继承

### 实现接口

```kotlin
interface Printable {
    fun prettyPrint(): String
}

@JvmInline
value class Name(val s: String) : Printable {
    override fun prettyPrint(): String = "Let's $s!"
}

fun main() {
    val name = Name("Kotlin")
    println(name.prettyPrint()) // 仍作为静态方法调用
}
```

### 禁止继承

- 内联类不能继承其他类
- 内联类始终是 final 的

## 四、运行时表示

### 装箱与拆箱

内联类实例在运行时可以表示为包装器或底层类型：

```kotlin
interface I

@JvmInline
value class Foo(val i: Int) : I

fun asInline(f: Foo) {}
fun <T> asGeneric(x: T) {}
fun asInterface(i: I) {}
fun asNullable(i: Foo?) {}

fun <T> id(x: T): T = x

fun main() {
    val f = Foo(42)

    asInline(f)    // 拆箱：作为 Foo 本身使用
    asGeneric(f)   // 装箱：作为泛型类型 T 使用
    asInterface(f) // 装箱：作为类型 I 使用
    asNullable(f)  // 装箱：作为 Foo? 使用

    val c = id(f)  // 先装箱，后拆箱
}
```

### 装箱场景

| 场景 | 表示 |
|------|------|
| 作为自身类型使用 | 拆箱（底层类型） |
| 作为泛型类型使用 | 装箱 |
| 作为接口类型使用 | 装箱 |
| 作为可空类型使用 | 装箱 |

### 引用相等

由于内联类可以表示为底层值或包装器，引用相等对它们没有意义，因此被禁止。

## 五、泛型内联类

```kotlin
@JvmInline
value class UserId<T>(val value: T)

fun compute(s: UserId<String>) {} 
// 编译器生成 fun compute-<hashcode>(s: Any?)
```

## 六、名称修饰

### 签名冲突

```kotlin
@JvmInline
value class UInt(val x: Int)

// JVM 上表示为 'public final void compute(int x)'
fun compute(x: Int) { }

// 也表示为 'public final void compute(int x)'，冲突！
fun compute(x: UInt) { }
```

### 解决方案

编译器通过名称修饰解决冲突：

```kotlin
fun compute(x: UInt)
// 编译后：public final void compute-<hashcode>(int x)
```

## 七、实际应用

### 类型安全包装

```kotlin
@JvmInline
value class Meter(val value: Double) {
    operator fun plus(other: Meter) = Meter(value + other.value)
}

@JvmInline
value class Kilometer(val value: Double) {
    fun toMeter() = Meter(value * 1000)
}

fun main() {
    val d1 = Meter(100.0)
    val d2 = Meter(50.0)
    val total = d1 + d2 // 类型安全
}
```

### ID 类型安全

```kotlin
@JvmInline
value class UserId(val value: String)

@JvmInline
value class OrderId(val value: String)

fun getUser(id: UserId) { }
fun getOrder(id: OrderId) { }

fun main() {
    val userId = UserId("user_123")
    val orderId = OrderId("order_456")
    
    getUser(userId)
    // getUser(orderId) // 编译错误：类型不匹配
}
```

## 八、内联类 vs 数据类

| 特性 | 内联类 | 数据类 |
|------|--------|--------|
| **运行时开销** | 无 | 有 |
| **属性数量** | 单一 | 多个 |
| **equals/hashCode** | 基于底层值 | 自动生成 |
| **copy** | 不支持 | 支持 |
| **解构** | 不支持 | 支持 |
| **密封** | 不能密封 | 可以密封 |

## 九、最佳实践

1. **单一职责**：只包装一个值
2. **类型安全**：用于区分相同类型的不同概念
3. **性能敏感**：用于高频创建的对象
4. **不可变**：保持底层属性不可变
5. **避免装箱**：尽量作为自身类型使用

## 学习资源

- [Inline value classes | Kotlin Documentation](https://kotlinlang.org/docs/inline-classes.html)
- [内联的值类 | Kotlin 语言参考文档 中文版](https://kotlin.liying-cn.net/inline-classes.html)
- [Kotlin基础知识点 #139：内联类](https://blog.csdn.net/xwdrhgr/article/details/157944114)

---

*持续学习中...*
