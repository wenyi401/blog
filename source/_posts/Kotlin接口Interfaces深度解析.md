---
title: Kotlin接口Interfaces深度解析
date: 2026-04-04 07:50:00
tags: [Kotlin, Interfaces, 接口, 多继承]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 接口可以包含抽象方法声明和方法实现。与抽象类不同，接口不能存储状态。

## 一、接口定义

```kotlin
interface MyInterface {
    fun bar()
    fun foo() {
        // 可选的方法体
    }
}
```

## 二、实现接口

```kotlin
class Child : MyInterface {
    override fun bar() {
        // 方法体
    }
}
```

## 三、接口中的属性

```kotlin
interface MyInterface {
    val prop: Int  // 抽象属性
    
    val propertyWithImplementation: String
        get() = "foo"
}

class Child : MyInterface {
    override val prop: Int = 29
}
```

## 四、接口继承

```kotlin
interface Named {
    val name: String
}

interface Person : Named {
    val firstName: String
    val lastName: String
    
    override val name: String
        get() = "$firstName $lastName"
}

data class Employee(
    override val firstName: String,
    override val lastName: String,
    val position: Position
) : Person
```

## 五、解决覆盖冲突

```kotlin
interface A {
    fun foo() { print("A") }
    fun bar()
}

interface B {
    fun foo() { print("B") }
    fun bar() { print("bar") }
}

class D : A, B {
    override fun foo() {
        super<A>.foo()
        super<B>.foo()
    }
    
    override fun bar() {
        super<B>.bar()
    }
}
```

## 六、JVM 默认方法

配置 `-jvm-default` 编译选项：

```kotlin
kotlin {
    compilerOptions {
        jvmDefault = JvmDefaultMode.NO_COMPATIBILITY
    }
}
```

## 七、最佳实践

### 1. 接口 vs 抽象类

- **接口**：定义行为契约
- **抽象类**：共享实现和状态

### 2. 多继承

使用接口实现多继承：

```kotlin
class MyClass : InterfaceA, InterfaceB {
    // 实现所有抽象成员
}
```

## 学习资源

- [Interfaces | Kotlin Documentation](https://kotlinlang.org/docs/interfaces.html)
- [Inheritance | Kotlin Documentation](https://kotlinlang.org/docs/inheritance.html)

---

*深入学习中...*
