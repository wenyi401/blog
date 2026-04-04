---
title: Android ViewModel协程作用域viewModelScope详解
date: 2026-04-03 23:52:00
tags: [Android, ViewModel, viewModelScope, 协程]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

每个 ViewModel 都定义了 viewModelScope，在此作用域中启动的协程会在 ViewModel 清除时自动取消。

## 一、viewModelScope

```kotlin
class MyViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {
            val data = repository.fetchData()
            _data.value = data
        }
    }
}
```

## 二、lifecycleScope

```kotlin
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            // 协程会在 Activity 销毁时取消
        }
    }
}
```

## 三、对比

| 作用域 | 生命周期 |
|--------|----------|
| viewModelScope | ViewModel 清除时取消 |
| lifecycleScope | Lifecycle 销毁时取消 |
| GlobalScope | 应用进程结束 |

## 学习资源

- [将 Kotlin 协程与生命周期感知型组件一起使用](https://developer.android.google.cn/topic/libraries/architecture/coroutines?hl=zh-cn)
- [viewModelScope 的深入解析与应用指南](https://juejin.cn/post/7514260785336008715)

---

*持续学习中...*
