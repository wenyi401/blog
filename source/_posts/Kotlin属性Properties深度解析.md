---
title: Kotlin属性Properties深度解析
date: 2026-04-04 06:20:00
tags: [Kotlin, Properties, 属性, getter, setter]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin 属性允许存储和管理数据，无需编写访问函数。每个属性都有名称、类型和自动生成的 getter，可变属性还有 setter。

## 一、声明属性

### 只读属性（val）

```kotlin
val pi = 3.14159
```

### 可变属性（var）

```kotlin
var counter = 0
```

### 类中声明

```kotlin
class Address {
    var name: String = "Holmes, Sherlock"
    var street: String = "Baker"
    var city: String = "London"
}
```

## 二、自定义 Getter 和 Setter

### 自定义 Getter

```kotlin
class Rectangle(val width: Int, val height: Int) {
    val area: Int
        get() = this.width * this.height
}
```

### 自定义 Setter

```kotlin
class Point(var x: Int, var y: Int) {
    var coordinates: String
        get() = "$x,$y"
        set(value) {
            val parts = value.split(",")
            x = parts[0].toInt()
            y = parts[1].toInt()
        }
}
```

### 修改可见性

```kotlin
class BankAccount(initialBalance: Int) {
    var balance: Int = initialBalance
        private set  // 只能在类内部修改
}
```

## 三、Backing Fields

使用 `field` 关键字引用幕后字段：

```kotlin
class Scoreboard {
    var score: Int = 0
        set(value) {
            field = value
            println("Score updated to $field")
        }
}
```

## 四、Backing Properties

使用私有属性作为幕后属性：

```kotlin
class ShoppingCart {
    private val _items = mutableListOf<String>()
    
    val items: List<String>
        get() = _items
    
    fun addItem(item: String) {
        _items.add(item)
    }
}
```

## 五、编译期常量

```kotlin
const val MAX_LOGIN_ATTEMPTS = 3
```

**要求**：
- 顶层或对象声明中
- String 或基本类型
- 无自定义 getter

## 六、延迟初始化

```kotlin
class OrderServiceTest {
    lateinit var orderService: OrderService
    
    @SetUp
    fun setup() {
        orderService = OrderService()
    }
}
```

### 检查是否初始化

```kotlin
if (this::latestReading.isInitialized) {
    println(latestReading)
}
```

## 七、委托属性

```kotlin
class User {
    var name: String by Delegates.observable("") { _, old, new ->
        println("Name changed from $old to $new")
    }
}
```

## 八、最佳实践

### 1. 初始化属性

推荐在声明时初始化。

### 2. 使用 val 而非 var

优先使用不可变属性。

### 3. 合理使用 lateinit

仅在必要时使用延迟初始化。

## 学习资源

- [Properties | Kotlin Documentation](https://kotlinlang.org/docs/properties.html)
- [Delegated Properties | Kotlin Documentation](https://kotlinlang.org/docs/delegated-properties.html)

---

*深入学习中...*
