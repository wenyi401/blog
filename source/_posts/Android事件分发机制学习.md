---
title: Android事件分发机制学习
date: 2026-04-03 23:28:00
tags: [Android, 事件分发, TouchEvent, dispatchTouchEvent]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Android 的触摸事件分发是 UI 交互的核心机制。事件从 Activity 开始，经由 Window 和 DecorView，层层传递给目标 View。

## 一、事件分发顺序

### 传递路径

```
Activity → Window → DecorView → ViewGroup → View
```

### 三个核心方法

| 方法 | 描述 | 返回值 |
|------|------|--------|
| **dispatchTouchEvent** | 分发事件 | true：消费；false：继续传递 |
| **onInterceptTouchEvent** | 拦截事件 | true：拦截；false：不拦截 |
| **onTouchEvent** | 处理事件 | true：消费；false：不消费 |

## 二、dispatchTouchEvent

### Activity

```kotlin
override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    // 先分发给 Window
    if (window.superDispatchTouchEvent(ev)) {
        return true
    }
    // 如果没有被消费，调用自己的 onTouchEvent
    return onTouchEvent(ev)
}
```

### ViewGroup

```kotlin
override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    // 检查是否拦截
    val intercepted = onInterceptTouchEvent(ev)
    
    if (!intercepted) {
        // 分发给子 View
        for (i in childCount - 1 downTo 0) {
            val child = getChildAt(i)
            if (child.dispatchTouchEvent(ev)) {
                return true
            }
        }
    }
    
    // 自己处理
    return onTouchEvent(ev)
}
```

### View

```kotlin
override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    // 先检查 OnTouchListener
    if (onTouchListener?.onTouch(this, ev) == true) {
        return true
    }
    // 调用 onTouchEvent
    return onTouchEvent(ev)
}
```

## 三、onInterceptTouchEvent

### ViewGroup 拦截

```kotlin
override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.action) {
        MotionEvent.ACTION_DOWN -> {
            // 按下时不拦截
            return false
        }
        MotionEvent.ACTION_MOVE -> {
            // 移动时判断是否拦截
            if (shouldIntercept) {
                return true
            }
        }
    }
    return false
}
```

### 滑动冲突处理

```kotlin
// 外部拦截法
override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.action) {
        MotionEvent.ACTION_DOWN -> {
            mLastX = ev.x
            mLastY = ev.y
            return false
        }
        MotionEvent.ACTION_MOVE -> {
            val dx = ev.x - mLastX
            val dy = ev.y - mLastY
            
            // 判断滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动，拦截
                return true
            }
        }
    }
    return false
}
```

## 四、onTouchEvent

### 处理事件

```kotlin
override fun onTouchEvent(ev: MotionEvent): Boolean {
    when (ev.action) {
        MotionEvent.ACTION_DOWN -> {
            // 按下
            return true
        }
        MotionEvent.ACTION_MOVE -> {
            // 移动
            return true
        }
        MotionEvent.ACTION_UP -> {
            // 抬起
            performClick()
            return true
        }
    }
    return super.onTouchEvent(ev)
}
```

### 点击事件

```kotlin
override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (ev.action == MotionEvent.ACTION_UP) {
        // 检查是否是点击
        if (isClick(ev)) {
            performClick()
        }
    }
    return true
}
```

## 五、事件分发流程图

```
Activity.dispatchTouchEvent()
    │
    ▼
Window.superDispatchTouchEvent()
    │
    ▼
DecorView.dispatchTouchEvent()
    │
    ▼
ViewGroup.dispatchTouchEvent()
    │
    ├── onInterceptTouchEvent()?
    │       │
    │       ├── true → ViewGroup.onTouchEvent()
    │       └── false → 子 View.dispatchTouchEvent()
    │
    ▼
View.dispatchTouchEvent()
    │
    ├── OnTouchListener.onTouch()?
    │       │
    │       ├── true → 返回
    │       └── false → View.onTouchEvent()
    │
    ▼
View.onTouchEvent()
    │
    ├── true → 消费
    └── false → 返回父 View
```

## 六、常见问题

### Q1: 如何让子 View 不拦截事件？

```kotlin
// 子 View 调用
parent.requestDisallowInterceptTouchEvent(true)
```

### Q2: 如何处理滑动冲突？

1. **外部拦截法**：父 View 在 onInterceptTouchEvent 中拦截
2. **内部拦截法**：子 View 在 dispatchTouchEvent 中处理

### Q3: OnClickListener 何时触发？

在 onTouchEvent 的 ACTION_UP 中，如果检测到是点击，则调用 performClick()。

## 七、最佳实践

1. **优先使用 OnTouchListener**：可以提前拦截事件
2. **合理拦截**：在 ACTION_DOWN 中不拦截
3. **处理滑动冲突**：明确滑动方向
4. **避免事件透传**：注意透明 View 的事件传递
5. **及时消费**：不处理的事件返回 false

## 学习资源

- [Android事件分发机制详解](https://blog.csdn.net/qq_33209777/article/details/135147729)
- [最详细的 Android View 的事件分发原理](https://zhuanlan.zhihu.com/p/653059612)
- [Android事件传递机制详解](https://yanfukun.com/read/anroid-dev1/event)

---

*持续学习中...*
