---
title: Kotlin类Classes深度解析
date: 2026-04-04 07:20:00
tags: [Kotlin, Classes, 构造函数, 抽象类]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 使用类封装数据（属性）和行为（函数）。类是对象的蓝图，通过构造函数创建实例。

## 一、类声明

```kotlin
class Person { /*...*/ }

// 无类体时可省略大括号
class Person(val name: String, var age: Int)
```

## 二、创建实例

```kotlin
val person = Person("Alice", 30)
println(person.name)  // Alice
```

## 三、主构造函数

```kotlin
class Person(val name: String, var age: Int) {
    // val/var 声明属性
}
```

### 默认值

```kotlin
class Person(val name: String = "John", var age: Int = 30)

val person = Person()  // 使用默认值
```

## 四、初始化块

```kotlin
class Person(val name: String, var age: Int) {
    init {
        require(age > 0) { "age must be positive" }
        println("Person created: $name")
    }
}
```

## 五、次构造函数

```kotlin
class Person(val name: String, var age: Int) {
    // 次构造函数委托给主构造函数
    constructor(name: String) : this(name, 0)
    
    constructor() : this("Bob")
}
```

## 六、抽象类

```kotlin
abstract class Person(val name: String) {
    abstract fun introduce()
    
    fun greet() {
        println("Hello, I'm $name")
    }
}

class Student(name: String, val school: String) : Person(name) {
    override fun introduce() {
        println("I study at $school")
    }
}
```

## 七、伴生对象

```kotlin
class Person(val name: String) {
    companion object {
        fun createAnonymous() = Person("Anonymous")
    }
}

val anonymous = Person.createAnonymous()
```

## 八、最佳实践

### 1. 使用主构造函数

优先使用主构造函数初始化属性。

### 2. 使用 init 块验证

```kotlin
init {
    require(age >= 0) { "Invalid age" }
}
```

### 3. 数据类

对于只保存数据的类，使用 data class：

```kotlin
data class User(val name: String, val age: Int)
```

## 学习资源

- [Classes | Kotlin Documentation](https://kotlinlang.org/docs/classes.html)
- [Inheritance | Kotlin Documentation](https://kotlinlang.org/docs/inheritance.html)

---

*深入学习中...*
