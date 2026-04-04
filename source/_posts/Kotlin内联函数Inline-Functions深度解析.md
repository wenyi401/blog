---
title: Kotlin内联函数Inline Functions深度解析
date: 2026-04-04 04:20:00
tags: [Kotlin, inline, 内联函数, reified]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

使用高阶函数会带来一定的运行时开销：每个函数都是一个对象，并且会捕获闭包。内联函数可以消除这些开销。

## 一、inline 修饰符

### 基本用法

```kotlin
inline fun <T> lock(lock: Lock, body: () -> T): T {
    lock.lock()
    try {
        return body()
    } finally {
        lock.unlock()
    }
}

// 调用
lock(l) { foo() }

// 编译后
l.lock()
try {
    foo()
} finally {
    l.unlock()
}
```

### 工作原理

inline 修饰符影响函数本身和传递给它的 lambda：所有这些都会内联到调用点。

## 二、noinline 修饰符

如果不想内联所有 lambda，使用 noinline：

```kotlin
inline fun foo(inlined: () -> Unit, noinline notInlined: () -> Unit) {
    inlined()
    notInlined()
}
```

**noinline lambda 可以**：
- 存储在字段中
- 作为参数传递
- 以任何方式操作

## 三、非局部返回

### 普通函数不允许返回

```kotlin
fun ordinaryFunction(block: () -> Unit) {
    println("hi!")
}

fun foo() {
    ordinaryFunction {
        return // 错误：不能让 foo 在这里返回
    }
}
```

### 内联函数允许返回

```kotlin
inline fun inlined(block: () -> Unit) {
    println("hi!")
}

fun foo() {
    inlined {
        return // OK：lambda 被内联
    }
}
```

### 常见用例：循环

```kotlin
fun hasZeros(ints: List<Int>): Boolean {
    ints.forEach {
        if (it == 0) return true // 从 hasZeros 返回
    }
    return false
}
```

## 四、crossinline 修饰符

当内联函数在另一个执行上下文中调用 lambda 时，使用 crossinline 禁止非局部返回：

```kotlin
inline fun f(crossinline body: () -> Unit) {
    val f = object : Runnable {
        override fun run() = body()
    }
}
```

## 五、Reified 类型参数

### 问题

普通泛型类型参数在运行时被擦除：

```kotlin
fun <T> TreeNode.findParentOfType(clazz: Class<T>): T? {
    var p = parent
    while (p != null && !clazz.isInstance(p)) {
        p = p.parent
    }
    return p as T?
}

// 调用
treeNode.findParentOfType(MyTreeNode::class.java)
```

### 解决方案

使用 reified 修饰符保留类型信息：

```kotlin
inline fun <reified T> TreeNode.findParentOfType(): T? {
    var p = parent
    while (p != null && p !is T) {
        p = p.parent
    }
    return p as T?
}

// 调用
treeNode.findParentOfType<MyTreeNode>()
```

### 优势

- 无需反射
- 可使用 `is` 和 `as` 操作符
- 语法更简洁

### 与反射配合

```kotlin
inline fun <reified T> membersOf() = T::class.members

fun main() {
    println(membersOf<StringBuilder>().joinToString("\n"))
}
```

## 六、内联属性

### 单个访问器

```kotlin
val foo: Foo
    inline get() = Foo()

var bar: Bar
    get() = ...
    inline set(v) { ... }
```

### 整个属性

```kotlin
inline var bar: Bar
    get() = ...
    set(v) { ... }
```

## 七、公共 API 内联函数的限制

当内联函数是 public 或 protected 但不是 private 或 internal 声明的一部分时：

**不允许使用**：
- private 声明
- internal 声明

**例外**：使用 @PublishedApi 注解的 internal 声明：

```kotlin
@PublishedApi
internal fun internalHelper() { }

inline fun publicInlineFunction() {
    internalHelper() // OK
}
```

## 八、最佳实践

### 1. 内联小函数

```kotlin
// 推荐：小函数
inline fun measure(block: () -> Unit) {
    val start = System.currentTimeMillis()
    block()
    println("Took ${System.currentTimeMillis() - start}ms")
}

// 不推荐：大函数
inline fun complexOperation() {
    // 大量代码...
}
```

### 2. 使用 reified 简化泛型操作

```kotlin
// 使用 reified
inline fun <reified T> Gson.fromJson(json: String): T = fromJson(json, T::class.java)

// 调用
val user: User = gson.fromJson(json)
```

### 3. 使用 crossinline 防止误用

```kotlin
inline fun withLock(lock: Lock, crossinline block: () -> Unit) {
    lock.lock()
    try {
        block()
    } finally {
        lock.unlock()
    }
}
```

## 九、常见问题

### 问题 1：生成的代码过大

**原因**：内联大型函数。

**解决方案**：只内联小函数或标记为 private。

### 问题 2：二进制兼容性问题

**原因**：公共 API 内联函数使用了非公共声明。

**解决方案**：使用 @PublishedApi 或将函数改为非内联。

### 问题 3：非局部返回导致的意外行为

**原因**：在嵌套 lambda 中使用 return。

**解决方案**：使用 crossinline 或标签返回。

## 学习资源

- [Inline functions | Kotlin Documentation](https://kotlinlang.org/docs/inline-functions.html)
- [Reified type parameters | Kotlin Documentation](https://kotlinlang.org/docs/inline-functions.html#reified-type-parameters)

---

*深入学习中...*
