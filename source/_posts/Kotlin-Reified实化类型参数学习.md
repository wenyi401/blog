---
title: Kotlin Reified实化类型参数学习
date: 2026-04-03 23:33:00
tags: [Kotlin, Reified, 泛型, 类型擦除, 内联函数]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 和 Java 一样，在编译阶段会擦除泛型类型信息。reified 关键字可以让泛型参数在运行时"具体化"，获得其实际类型信息。

## 一、类型擦除问题

### 什么是类型擦除？

在编译阶段，泛型类型信息会被擦除：

- `List<String>` 和 `List<Int>` 在运行时都只是 `List`

### 带来的问题

```kotlin
// ❌ 编译错误：无法访问 T.class
fun <T> readValue(data: ByteArray): T {
    val type = T::class.java // 错误！
}
```

### Java 的解决方案

```java
// 使用 TypeReference
Map<String, String> json = objectMapper.readValue(data,
    new TypeReference<Map<String, String>>() {});
```

## 二、内联函数

### inline 关键字

```kotlin
inline fun printHello() {
    print("Hello ")
    println("World")
}

// 编译后，函数体会被内联到调用点
fun main() {
    print("Hello ")
    println("World")
}
```

### 内联的优势

- 减少函数调用开销
- 在编译时知道调用点的上下文信息
- 为 reified 类型参数提供可能

## 三、reified 使用

### 基本语法

```kotlin
inline fun <reified T> ObjectMapper.readValue(data: ByteArray): T =
    readValue(data, object : TypeReference<T>() {})
```

### 调用方式

```kotlin
// ✅ 简洁调用
val json = objectMapper.readValue<String>(data)

// ✅ 利用类型推导
val json: String = objectMapper.readValue(data)

// ✅ 泛型结构
val json: Map<String, String> = objectMapper.readValue(data)
```

## 四、常用场景

### 类型检查

```kotlin
inline fun <reified T> Any?.isOfType(): Boolean {
    return this is T
}

// 使用
println("hello".isOfType<String>()) // true
println("hello".isOfType<Int>())    // false
```

### 创建实例

```kotlin
inline fun <reified T> create(): T {
    return T::class.java.getDeclaredConstructor().newInstance()
}

// 使用
val user = create<User>()
```

### 泛型数组

```kotlin
inline fun <reified T> createArray(size: Int): Array<T> {
    return Array(size) { create<T>() }
}

// 使用
val users = createArray<User>(10)
```

### JSON 解析

```kotlin
inline fun <reified T> fromJson(json: String): T {
    return Gson().fromJson(json, T::class.java)
}

// 使用
val user = fromJson<User>(jsonString)
```

### 启动 Activity

```kotlin
inline fun <reified T : Activity> Context.startActivity() {
    val intent = Intent(this, T::class.java)
    startActivity(intent)
}

// 使用
startActivity<DetailActivity>()
```

## 五、原理分析

### 字节码层面

```kotlin
val json: Map<String, String> = objectMapper.readValue(data)
```

等价于 Java 代码：

```java
Map<String, String> json = objectMapper.readValue(data,
    new TypeReference<Map<String, String>>() {});
```

### 编译器魔法

- 内联时保留泛型类型信息
- 生成 TypeReference 匿名子类
- 自动进行类型转换

## 六、限制

### 只能用于内联函数

```kotlin
// ❌ 错误：reified 只能用于内联函数
fun <reified T> wrong() { }

// ✅ 正确
inline fun <reified T> correct() { }
```

### 不能用于类

```kotlin
// ❌ 错误：不能用于类
class Container<reified T> { }
```

### 不能用于非内联函数参数

```kotlin
// ❌ 错误
inline fun <reified T> foo(block: (T) -> Unit) {
    // 不能在非内联 lambda 中使用 T
}
```

## 七、最佳实践

### 1. 结合扩展函数

```kotlin
inline fun <reified T> String.parseJson(): T {
    return Gson().fromJson(this, T::class.java)
}
```

### 2. 工厂方法

```kotlin
inline fun <reified T : ViewModel> viewModelFactory(): ViewModelProvider.Factory {
    return object : ViewModelProvider.Factory {
        override fun <VM : ViewModel> create(modelClass: Class<VM>): VM {
            @Suppress("UNCHECKED_CAST")
            return create<T>() as VM
        }
    }
}
```

### 3. 反射简化

```kotlin
inline fun <reified T> KClass<T>.createInstance(): T {
    return java.getDeclaredConstructor().newInstance()
}
```

## 八、reified vs Java 泛型

| 特性 | Java | Kotlin reified |
|------|------|----------------|
| **运行时类型** | 擦除 | 保留 |
| **类型检查** | 不支持 | 支持 `is T` |
| **类字面量** | 不支持 `T.class` | 支持 `T::class` |
| **简洁性** | 需要 TypeReference | 直接使用 |

## 学习资源

- [Kotlin 中的 reified 函数详解](https://www.baeldung-cn.com/kotlin/reified-functions)
- [告别"类型擦除"：深入解析 Kotlin 中的 Inline 与 Reified 黑魔法](https://juejin.cn/post/7597416716542640134)
- [Kotlin泛型数组创建终极指南](https://blog.csdn.net/gitblog_00385/article/details/152391529)

---

*持续学习中...*
