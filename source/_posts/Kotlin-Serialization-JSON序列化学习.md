---
title: Kotlin Serialization-JSON序列化学习
date: 2026-04-03 23:07:00
tags: [Kotlin, Serialization, JSON, 数据序列化]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

序列化是将应用程序使用的数据转换为可以通过网络传输或存储在数据库或文件中的格式的过程。反序列化则是相反的过程，即从外部源读取数据并将其转换为运行时对象。Kotlin 提供了 kotlinx.serialization 库来处理数据序列化。

## kotlinx.serialization 概述

### 组成部分

kotlinx.serialization 由以下几个部分组成：

1. **org.jetbrains.kotlin.plugin.serialization** - Gradle 插件
2. **运行时库** - 核心序列化 API
3. **编译器插件** - 生成可序列化类的访问者代码

### 支持的平台

- JVM
- JavaScript
- Native
- Multiplatform

---

## 一、添加依赖

### Gradle 插件

```kotlin
plugins {
    kotlin("jvm") version "2.3.20"
    kotlin("plugin.serialization") version "2.3.20"
}
```

### 添加 JSON 序列化库

```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.10.0")
}
```

---

## 二、支持的序列化格式

| 格式 | 库 |
|------|-----|
| **JSON** | kotlinx-serialization-json |
| **Protocol Buffers** | kotlinx-serialization-protobuf |
| **CBOR** | kotlinx-serialization-cbor |
| **Properties** | kotlinx-serialization-properties |
| **HOCON** | kotlinx-serialization-hocon（仅 JVM） |

**注意：** 除了 JSON 序列化外，其他格式都是实验性的。

---

## 三、JSON 序列化示例

### 定义可序列化类

使用 `@Serializable` 注解标记类：

```kotlin
import kotlinx.serialization.Serializable

@Serializable
data class Data(val a: Int, val b: String)
```

### 序列化对象

```kotlin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

fun main() {
    val data = Data(42, "Hello")
    val jsonString = Json.encodeToString(data)
    println(jsonString) // {"a":42,"b":"Hello"}
}
```

### 反序列化对象

```kotlin
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

fun main() {
    val jsonString = """{"a":42,"b":"Hello"}"""
    val data = Json.decodeFromString<Data>(jsonString)
    println(data) // Data(a=42, b=Hello)
}
```

---

## 四、高级特性

### 可选字段

```kotlin
@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String? = null  // 可选字段
)
```

### 默认值

```kotlin
@Serializable
data class Config(
    val debug: Boolean = false,
    val timeout: Int = 30000
)
```

### 自定义字段名

```kotlin
import kotlinx.serialization.SerialName

@Serializable
data class User(
    @SerialName("user_id")
    val id: Int,
    
    @SerialName("user_name")
    val name: String
)
```

### 嵌套对象

```kotlin
@Serializable
data class Address(
    val city: String,
    val street: String
)

@Serializable
data class Person(
    val name: String,
    val address: Address
)
```

### 列表序列化

```kotlin
@Serializable
data class Response(
    val users: List<User>
)

// 序列化列表
val users = listOf(User(1, "Alice"), User(2, "Bob"))
val jsonString = Json.encodeToString(users)

// 反序列化列表
val userList = Json.decodeFromString<List<User>>(jsonString)
```

---

## 五、Json 配置

```kotlin
val json = Json {
    ignoreUnknownKeys = true        // 忽略未知字段
    isLenient = true                // 宽松模式
    encodeDefaults = true           // 编码默认值
    prettyPrint = true              // 美化输出
    coerceInputValues = true        // 强制输入值
}

val data = json.decodeFromString<Data>(jsonString)
```

---

## 六、与 Gson 的对比

| 特性 | Gson | kotlinx.serialization |
|------|------|------------------------|
| **类型安全** | 运行时检查 | 编译时检查 |
| **Kotlin 支持** | 需要额外配置 | 原生支持 |
| **空安全** | 可能导致 NPE | 编译时验证 |
| **默认值** | 不支持 | 支持 |
| **性能** | 较慢 | 更快 |
| **多平台** | 仅 JVM | JVM/JS/Native |

---

## 七、最佳实践

1. **使用 data class** - 自动生成 equals、hashCode、toString
2. **使用 @SerialName** - 自定义 JSON 字段名
3. **处理可空字段** - 使用 `?` 标记可选字段
4. **配置 Json 实例** - 根据需求调整配置
5. **测试序列化/反序列化** - 确保数据完整性

---

## 学习资源

- [Serialization | Kotlin Documentation](https://kotlinlang.org/docs/serialization.html)
- [kotlinx.serialization - GitHub](https://github.com/Kotlin/kotlinx.serialization)
- [高效的 Json 解析框架 kotlinx.serialization](https://zhuanlan.zhihu.com/p/671728767)

---

*持续学习中...*
