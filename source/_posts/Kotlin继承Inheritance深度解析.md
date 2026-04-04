---
title: Kotlin继承Inheritance深度解析
date: 2026-04-04 08:20:00
tags: [Kotlin, Inheritance, 继承, open, override]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 所有类都有一个共同的超类 Any，包含 equals()、hashCode() 和 toString() 方法。Kotlin 类默认为 final，使用 open 关键字允许继承。

## 一、基本语法

```kotlin
open class Base(p: Int)

class Derived(p: Int) : Base(p)
```

## 二、open 关键字

```kotlin
open class Person(val name: String) {
    open fun introduce() {
        println("Hello, my name is $name.")
    }
}

class Student(name: String, val school: String) : Person(name) {
    override fun introduce() {
        println("Hi, I'm $name, and I study at $school.")
    }
}
```

## 三、覆盖方法

```kotlin
open class Shape {
    open fun draw() { }
    fun fill() { }
}

class Circle : Shape() {
    override fun draw() { }
}
```

## 四、覆盖属性

```kotlin
open class Shape {
    open val vertexCount: Int = 0
}

class Rectangle : Shape() {
    override val vertexCount = 4
}
```

## 五、调用超类实现

```kotlin
open class Rectangle {
    open fun draw() { println("Drawing a rectangle") }
}

class FilledRectangle : Rectangle() {
    override fun draw() {
        super.draw()
        println("Filling the rectangle")
    }
}
```

## 六、覆盖规则

多继承时必须覆盖并提供实现：

```kotlin
open class Rectangle {
    open fun draw() { }
}

interface Polygon {
    fun draw() { }
}

class Square : Rectangle(), Polygon {
    override fun draw() {
        super<Rectangle>.draw()
        super<Polygon>.draw()
    }
}
```

## 七、初始化顺序

基类初始化先于派生类：

```kotlin
open class Base(val name: String) {
    init { println("Initializing base") }
}

class Derived(name: String, val lastName: String) : Base(name) {
    init { println("Initializing derived") }
}
```

## 学习资源

- [Inheritance | Kotlin Documentation](https://kotlinlang.org/docs/inheritance.html)
- [Classes | Kotlin Documentation](https://kotlinlang.org/docs/classes.html)

---

*深入学习中...*
