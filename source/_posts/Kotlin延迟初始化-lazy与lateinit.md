---
title: Kotlin延迟初始化-lazy与lateinit
date: 2026-04-03 23:52:00
tags: [Kotlin, lazy, lateinit, 延迟初始化]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin 提供了两种延迟初始化机制：`by lazy` 和 `lateinit`。它们的核心目标一致——实现属性的延迟初始化，但实现方式和适用场景不同。

## 一、by lazy

### 基本用法

```kotlin
val heavyObject: HeavyClass by lazy {
    HeavyClass()
}
```

### 特点

- 只适用于 `val`（不可变属性）
- 线程安全（默认）
- 首次访问时初始化
- 初始化后缓存结果

### 线程安全模式

```kotlin
// 同步锁（默认）
val lazyValue: String by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
    "Hello"
}

// 无锁（单线程环境）
val lazyValue: String by lazy(LazyThreadSafetyMode.NONE) {
    "Hello"
}

// 发布模式
val lazyValue: String by lazy(LazyThreadSafetyMode.PUBLICATION) {
    "Hello"
}
```

### 使用场景

```kotlin
class MainActivity : AppCompatActivity() {
    // 延迟初始化适配器
    private val adapter by lazy {
        MyAdapter()
    }
    
    // 延迟初始化 ViewModel
    private val viewModel by lazy {
        ViewModelProvider(this)[MyViewModel::class.java]
    }
}
```

## 二、lateinit

### 基本用法

```kotlin
lateinit var name: String

fun init() {
    name = "Alice"
}
```

### 特点

- 只适用于 `var`（可变属性）
- 非线程安全
- 需要手动初始化
- 访问前必须初始化，否则抛出异常

### 检查是否初始化

```kotlin
lateinit var name: String

if (::name.isInitialized) {
    println(name)
}
```

### 使用场景

```kotlin
class MainActivity : AppCompatActivity() {
    // 延迟初始化 View
    private lateinit var textView: TextView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        textView = findViewById(R.id.textView)
    }
}
```

## 三、对比

| 特性 | by lazy | lateinit |
|------|---------|----------|
| 适用变量 | val | var |
| 初始化时机 | 首次访问 | 手动初始化 |
| 线程安全 | 是 | 否 |
| 可空性 | 非空 | 非空 |
| 初始化检查 | 无 | ::property.isInitialized |

## 四、选择建议

- **使用 by lazy**：初始化成本高、首次访问时才需要、需要线程安全
- **使用 lateinit**：需要在外部初始化、需要多次修改、性能敏感场景

## 学习资源

- [Kotlin 延遲初始化：lazy 與 lateinit 的抉擇](https://blog.cashwu.com/blog/2026/kotlin-lazy-and-lateinit)
- [Kotlin类：延迟初始化：lateinit 与 by lazy 的对决](https://juejin.cn/post/7576888607479496723)

---

*持续学习中...*
