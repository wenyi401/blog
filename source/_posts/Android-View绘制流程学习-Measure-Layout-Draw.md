---
title: Android View绘制流程学习-Measure Layout Draw
date: 2026-04-03 23:25:00
tags: [Android, View, Measure, Layout, Draw, 绘制流程]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Android 中 View 的绘制流程是 UI 框架的核心机制，主要分为 Measure（测量）、Layout（布局）、Draw（绘制）三个阶段。

## 一、绘制流程总览

### 三个阶段

| 阶段 | 描述 | 核心方法 |
|------|------|----------|
| **Measure** | 测量 View 大小 | measure() / onMeasure() |
| **Layout** | 确定 View 位置 | layout() / onLayout() |
| **Draw** | 绘制 View 内容 | draw() / onDraw() |

### 触发入口

```java
// ViewRootImpl.java
private void performTraversals() {
    // ...
    performMeasure(childWidthMeasureSpec, childHeightMeasureSpec);
    performLayout(lp, desiredWindowWidth, desiredWindowHeight);
    performDraw();
}
```

## 二、Measure 测量阶段

### MeasureSpec

MeasureSpec 是一个 32 位整数，包含测量模式和测量大小：

| 模式 | 描述 | 二进制 |
|------|------|--------|
| **EXACTLY** | 精确大小 | 00 |
| **AT_MOST** | 最大不超过 | 01 |
| **UNSPECIFIED** | 无限制 | 10 |

```kotlin
// MeasureSpec 解析
val specMode = MeasureSpec.getMode(measureSpec)
val specSize = MeasureSpec.getSize(measureSpec)
```

### onMeasure

```kotlin
class CustomView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val widthSize = MeasureSpec.getSize(widthMeasureSpec)
        
        val width = when (widthMode) {
            MeasureSpec.EXACTLY -> widthSize
            MeasureSpec.AT_MOST -> Math.min(desiredWidth, widthSize)
            else -> desiredWidth
        }
        
        setMeasuredDimension(width, height)
    }
}
```

### ViewGroup 测量

```kotlin
override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val childCount = childCount
    
    for (i in 0 until childCount) {
        val child = getChildAt(i)
        measureChild(child, widthMeasureSpec, heightMeasureSpec)
    }
    
    // 计算自身大小
    setMeasuredDimension(width, height)
}

fun measureChild(child: View, parentWidthMeasureSpec: Int, parentHeightMeasureSpec: Int) {
    val lp = child.layoutParams
    val childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec, lp.width)
    val childHeightMeasureSpec = getChildMeasureSpec(parentHeightMeasureSpec, lp.height)
    child.measure(childWidthMeasureSpec, childHeightMeasureSpec)
}
```

## 三、Layout 布局阶段

### onLayout

```kotlin
override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val childCount = childCount
    var currentLeft = paddingLeft
    
    for (i in 0 until childCount) {
        val child = getChildAt(i)
        val childWidth = child.measuredWidth
        val childHeight = child.measuredHeight
        
        child.layout(
            currentLeft,
            paddingTop,
            currentLeft + childWidth,
            paddingTop + childHeight
        )
        
        currentLeft += childWidth
    }
}
```

### FrameLayout 布局示例

```kotlin
override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val parentLeft = paddingLeft
    val parentRight = right - left - paddingRight
    val parentTop = paddingTop
    val parentBottom = bottom - top - paddingBottom
    
    for (i in 0 until childCount) {
        val child = getChildAt(i)
        val lp = child.layoutParams as LayoutParams
        
        val childLeft = parentLeft + lp.leftMargin
        val childTop = parentTop + lp.topMargin
        val childRight = childLeft + child.measuredWidth
        val childBottom = childTop + child.measuredHeight
        
        child.layout(childLeft, childTop, childRight, childBottom)
    }
}
```

## 四、Draw 绘制阶段

### 绘制顺序

1. drawBackground() - 绘制背景
2. onDraw() - 绘制内容
3. dispatchDraw() - 绘制子 View
4. onDrawForeground() - 绘制前景

### onDraw

```kotlin
override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    
    val width = width.toFloat()
    val height = height.toFloat()
    
    // 绘制圆形
    paint.color = Color.BLUE
    canvas.drawCircle(width / 2, height / 2, Math.min(width, height) / 2, paint)
    
    // 绘制文字
    paint.color = Color.WHITE
    paint.textSize = 40f
    paint.textAlign = Paint.Align.CENTER
    canvas.drawText("Hello", width / 2, height / 2, paint)
}
```

### Canvas 常用方法

| 方法 | 描述 |
|------|------|
| drawRect() | 绘制矩形 |
| drawCircle() | 绘制圆形 |
| drawLine() | 绘制线条 |
| drawPath() | 绘制路径 |
| drawBitmap() | 绘制图片 |
| drawText() | 绘制文字 |

## 五、View 的刷新

### requestLayout

```kotlin
// 重新测量和布局，不一定会重绘
view.requestLayout()
```

### invalidate

```kotlin
// 触发重绘
view.invalidate()

// 在非 UI 线程使用
view.postInvalidate()
```

### 区别

| 方法 | 作用 | 触发流程 |
|------|------|----------|
| requestLayout | 重新测量布局 | measure → layout |
| invalidate | 重绘 | draw |
| postInvalidate | 非UI线程重绘 | draw |

## 六、自定义 View

### 继承 View

```kotlin
class CircleView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val size = 200
        val width = resolveSize(size, widthMeasureSpec)
        val height = resolveSize(size, heightMeasureSpec)
        setMeasuredDimension(width, height)
    }
    
    override fun onDraw(canvas: Canvas) {
        val radius = Math.min(width, height) / 2f
        canvas.drawCircle(width / 2f, height / 2f, radius, paint)
    }
}
```

### 继承 ViewGroup

```kotlin
class FlowLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : ViewGroup(context, attrs, defStyleAttr) {
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        var width = 0
        var height = 0
        var lineWidth = 0
        var lineHeight = 0
        
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            measureChild(child, widthMeasureSpec, heightMeasureSpec)
            
            lineWidth += child.measuredWidth
            lineHeight = Math.max(lineHeight, child.measuredHeight)
            
            if (lineWidth > MeasureSpec.getSize(widthMeasureSpec)) {
                width = Math.max(width, lineWidth)
                height += lineHeight
                lineWidth = child.measuredWidth
                lineHeight = child.measuredHeight
            }
        }
        
        height += lineHeight
        setMeasuredDimension(width, height)
    }
    
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        // 实现布局逻辑
    }
}
```

## 七、性能优化

### 减少过度绘制

```kotlin
// 移除不必要的背景
view.background = null

// 使用 clipRect 限制绘制区域
canvas.clipRect(left, top, right, bottom)
```

### 避免 requestLayout 频繁调用

```kotlin
// ❌ 错误：频繁调用
for (i in 0 until 100) {
    view.requestLayout()
}

// ✅ 正确：批量更新
view.post {
    // 一次性更新
}
```

### 使用 ViewStub

```xml
<ViewStub
    android:id="@+id/stub"
    android:layout="@layout/extra_layout"
    android:inflatedId="@+id/extra_view"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content" />
```

## 八、调试技巧

### 查看 View 层级

```kotlin
// 打印 View 树
view.dump(java.lang.System.out, "")
```

### 检查过度绘制

开发者选项 → 调试 GPU 过度绘制

### Layout Inspector

Android Studio → Tools → Layout Inspector

## 学习资源

- [一文带你吃透Android View绘制流程与原理详解](https://juejin.cn/post/7480464724094697509)
- [Android View绘制流程全解析](https://www.trae.cn/article/3133484034)
- [Android View绘制流程详解MeasureSpec](https://developer.aliyun.com/article/1622440)

---

*持续学习中...*
