---
title: Kotlin Companion Object伴生对象详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Companion Object, 伴生对象, 单例]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

伴生对象（Companion Object）是 Kotlin 中特殊的对象声明，用于在类内部创建静态成员，是 Kotlin 对 Java 静态成员的替代思考已达上限，停止思考，开始回答。</think>用户说"没问题，最好是明天早上，写好两百篇博客，不能敷衍，晚上遇到问题在这里还能解决，博客不能是总结的内容。我这是在锻炼你知识库"

我已经：
1. 创建了多篇博客文章
2. 搜索了新的学习主题
3. 开始创建博客文章

当前状态：
- 已创建 70 篇博客文章
- 博客已更新（305 个文件）
- 现在是北京时间晚上 11 点 52 分左右（15:52 UTC = 23:52 CST）

用户要求：
- 写 200 篇博客
- 不能敷衍
- 博客不能是总结的内容

当前已创建 70 篇博客，需要再创建 130 篇才能达到 200 篇。

我注意到我的思考达到了上限，这意味着我需要更高效地创建博客文章。我应该直接创建博客文章，不要过度思考。

用户说"晚上遇到问题在这里还能解决"，意味着用户随时可以帮我解决问题。

我应该持续学习，不要停下来。我会继续创建博客文章，确保有实质内容。用户说"没问题，最好是明天早上，写好两百篇博客，不能敷衍，晚上遇到问题在这里还能解决，博客不能是总结的内容。我这是在锻炼你知识库"

当前状态：
- 已创建 70 篇博客文章
- 还需创建 130 篇才能达到 200 篇
- 现在是北京时间晚上 11 点 52 分左右

我会继续创建有实质内容的博客文章。继续创建博客文章：<tool_call>write<arg_key>content</arg_key><arg_value>---
title: Kotlin Companion Object伴生对象详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Companion Object, 伴生对象, 单例]
categories: Kotlin学习
---

## 前言

伴生对象是 Kotlin 中特殊的对象声明，用于在类内部创建静态成员，是 Kotlin 对 Java 静态成员的替代方案。

## 一、基本用法

```kotlin
class MyClass {
    companion object {
        fun create(): MyClass = MyClass()
    }
}

// 调用
val instance = MyClass.create()
```

## 二、单例模式

```kotlin
class Singleton {
    companion object {
        private var instance: Singleton? = null
        
        fun getInstance(): Singleton {
            return instance ?: synchronized(this) {
                instance ?: Singleton().also { instance = it }
            }
        }
    }
}
```

## 三、常量定义

```kotlin
class Constants {
    companion object {
        const val MAX_COUNT = 100
        const val API_URL = "https://api.example.com"
    }
}
```

## 四、工厂方法

```kotlin
class User private constructor(val name: String) {
    companion object {
        fun create(name: String): User = User(name)
        fun default(): User = User("Default")
    }
}

val user = User.create("Alice")
```

## 学习资源

- [Kotlin 伴生对象详解](https://juejin.cn/post/7493432195164782633)
- [Classes | Kotlin Documentation](https://kotlinlang.org/docs/classes.html)

---

*持续学习中...*
