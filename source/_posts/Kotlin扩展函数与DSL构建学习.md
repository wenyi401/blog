---
title: Kotlin扩展函数与DSL构建学习
date: 2026-04-03 23:18:00
tags: [Kotlin, 扩展函数, DSL, 高阶函数]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 扩展函数让你可以在不使用继承或设计模式（如装饰器）的情况下，为类或接口添加新功能。当你无法直接修改第三方库时，扩展函数尤其有用。一旦创建，你可以像调用原始类或接口的成员一样调用这些扩展。

## 一、扩展函数

### 基本语法

```kotlin
fun String.truncate(maxLength: Int): String {
    return if (this.length <= maxLength) this else take(maxLength - 3) + "..."
}

fun main() {
    val shortUsername = "KotlinFan42"
    val longUsername = "JetBrainsLoverForever"

    println("Short username: ${shortUsername.truncate(15)}")
    // KotlinFan42
    println("Long username: ${longUsername.truncate(15)}")
    // JetBrainsLov...
}
```

### 扩展接口

```kotlin
interface User {
    val name: String
    val email: String
}

fun User.displayInfo(): String = "User(name=$name, email=$email)"

class RegularUser(override val name: String, override val email: String) : User

fun main() {
    val user = RegularUser("Alice", "alice@example.com")
    println(user.displayInfo())
    // User(name=Alice, email=alice@example.com)
}
```

### 扩展集合

```kotlin
fun Map<String, Int>.mostVoted(): String? {
    return maxByOrNull { (key, value) -> value }?.key
}

fun main() {
    val poll = mapOf(
        "Cats" to 37,
        "Dogs" to 58,
        "Birds" to 22
    )
    
    println("Top choice: ${poll.mostVoted()}")
    // Dogs
}
```

## 二、泛型扩展函数

```kotlin
fun <T> List<T>.endpoints(): Pair<T, T> {
    return first() to last()
}

fun main() {
    val cities = listOf("Paris", "London", "Berlin", "Prague")
    val (start, end) = cities.endpoints()
    println("Start: $start, End: $end")
    // Start: Paris, End: Prague
}
```

## 三、扩展属性

```kotlin
val String.isLong: Boolean
    get() = this.length > 10

val Int.squared: Int
    get() = this * this

fun main() {
    val text = "Hello World"
    println(text.isLong) // true
    
    val number = 5
    println(number.squared) // 25
}
```

## 四、标准库扩展函数

| 函数 | 描述 |
|------|------|
| `.map()` | 转换集合元素 |
| `.filter()` | 过滤集合元素 |
| `.reduce()` | 累积计算 |
| `.fold()` | 带初始值的累积计算 |
| `.groupBy()` | 分组 |
| `.joinToString()` | 转换为字符串 |
| `.filterNotNull()` | 过滤空值 |

## 五、高阶函数

### 定义

高阶函数是接受函数作为参数或返回函数的函数。

```kotlin
fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

fun main() {
    val numbers = listOf(1, 2, 3, 4, 5)
    val evenNumbers = numbers.customFilter { it % 2 == 0 }
    println(evenNumbers) // [2, 4]
}
```

## 六、内联函数

### 内联优化

使用 `inline` 关键字可以消除高阶函数的运行时开销：

```kotlin
inline fun <T> List<T>.customForEach(action: (T) -> Unit) {
    for (item in this) {
        action(item)
    }
}
```

### 内联优势

- 消除函数对象创建
- 减少内存分配
- 避免虚拟调用开销

## 七、DSL 构建

### 什么是 DSL？

DSL（领域特定语言）是一种编程语言，被设计用来解决特定领域的问题。Kotlin 主要支持内部 DSL，可以利用 Kotlin 的语法和特性创建特定领域的语言。

### DSL 示例

```kotlin
class HTML {
    private val elements = mutableListOf<String>()
    
    fun body(block: Body.() -> Unit) {
        val body = Body()
        body.block()
        elements.add(body.toString())
    }
    
    override fun toString() = elements.joinToString("\n")
}

class Body {
    private val content = StringBuilder()
    
    fun p(text: String) {
        content.append("<p>$text</p>\n")
    }
    
    fun h1(text: String) {
        content.append("<h1>$text</h1>\n")
    }
    
    override fun toString() = "<body>\n$content</body>"
}

fun html(block: HTML.() -> Unit): HTML {
    val html = HTML()
    html.block()
    return html
}

fun main() {
    val document = html {
        body {
            h1("Hello, Kotlin DSL!")
            p("This is a paragraph.")
        }
    }
    println(document)
}
```

### DSL 核心

- 扩展函数
- Lambda 表达式
- 接收者 Lambda（`T.() -> Unit`）
- 内联函数

## 八、实际应用

### Gradle Kotlin DSL

```kotlin
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
}
```

### Compose DSL

```kotlin
Column {
    Text("Hello, World!")
    Button(onClick = { }) {
        Text("Click Me")
    }
}
```

### Anko SQL DSL

```kotlin
data class User(val id: Int, val name: String, val email: String)

fun users() = "SELECT * FROM users".execAndParse {
    User(
        id = it.getInt("id"),
        name = it.getString("name"),
        email = it.getString("email")
    )
}
```

## 九、最佳实践

1. **优先使用标准库扩展**：避免重复造轮子
2. **合理使用内联**：对高阶函数使用 inline
3. **保持扩展简洁**：避免复杂的扩展逻辑
4. **命名清晰**：扩展函数名应该清晰表达意图
5. **避免命名冲突**：注意与成员函数的优先级

## 学习资源

- [Extensions | Kotlin Documentation](https://kotlinlang.org/docs/extensions.html)
- [魔法般的Kotlin DSL：让代码更优雅](https://zhuanlan.zhihu.com/p/624257394)
- [Kotlin高阶函数——写法的演变过程](https://juejin.cn/post/7499050342775013430)

---

*持续学习中...*
