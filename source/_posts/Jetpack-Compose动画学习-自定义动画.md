---
title: Jetpack Compose动画学习-自定义动画
date: 2026-04-03 23:05:00
tags: [Android, Jetpack Compose, 动画, Kotlin]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Jetpack Compose 提供了一套创新的声明式动画系统，通过状态驱动实现 UI 的动态效果。相比传统 Android 动画，Compose 动画具有更简洁的声明式语法、与 UI 状态深度绑定、可组合性强等优势。

## AnimationSpec 参数

大多数动画 API 允许开发者通过可选的 `AnimationSpec` 参数来自定义动画规范。

```kotlin
val alpha: Float by animateFloatAsState(
    targetValue = if (enabled) 1f else 0.5f,
    animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
    label = "alpha"
)
```

---

## 一、spring - 基于物理特性的动画

`spring` 可在起始值和结束值之间创建基于物理特性的动画。

### 参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `dampingRatio` | 弹簧的弹性 | `Spring.DampingRatioNoBouncy` |
| `stiffness` | 弹簧向结束值移动的速度 | `Spring.StiffnessMedium` |

### 示例

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = spring(
        dampingRatio = Spring.DampingRatioHighBouncy,
        stiffness = Spring.StiffnessMedium
    ),
    label = "spring spec"
)
```

### 优势

相比基于时长的 `AnimationSpec` 类型，`spring` 可以更流畅地处理中断，因为它可以在目标值在动画中变化时保证速度的连续性。

---

## 二、tween - 基于时长的动画

`tween` 在指定的 `durationMillis` 内使用缓和曲线在起始值和结束值之间添加动画效果。

### 参数

| 参数 | 描述 |
|------|------|
| `durationMillis` | 动画时长 |
| `delayMillis` | 延迟开始时间 |
| `easing` | 缓和曲线 |

### 示例

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = tween(
        durationMillis = 300,
        delayMillis = 50,
        easing = LinearOutSlowInEasing
    ),
    label = "tween delay"
)
```

---

## 三、keyframes - 关键帧动画

`keyframes` 会根据在动画时长内的不同时间戳中指定的快照值添加动画效果。

### 示例

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = keyframes {
        durationMillis = 375
        0.0f at 0 using LinearOutSlowInEasing // 0-15 ms
        0.2f at 15 using FastOutLinearInEasing // 15-75 ms
        0.4f at 75 // ms
        0.4f at 225 // ms
    },
    label = "keyframe"
)
```

---

## 四、keyframesWithSplines - 平滑关键帧动画

如需创建在值之间转换时遵循平滑曲线的动画，可以使用 `keyframesWithSplines`。

```kotlin
val offset by animateOffsetAsState(
    targetValue = Offset(300f, 300f),
    animationSpec = keyframesWithSpline {
        durationMillis = 6000
        Offset(0f, 0f) at 0
        Offset(150f, 200f) atFraction 0.5f
        Offset(0f, 100f) atFraction 0.7f
    }
)
```

基于样条曲线的关键帧对于屏幕上项的 2D 移动尤为有用。

---

## 五、repeatable - 重复动画

`repeatable` 反复运行基于时长的动画，直至达到指定的迭代计数。

### 参数

| 参数 | 描述 |
|------|------|
| `iterations` | 迭代次数 |
| `animation` | 动画规范 |
| `repeatMode` | 重复模式（Restart/Reverse） |

### 示例

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = repeatable(
        iterations = 3,
        animation = tween(durationMillis = 300),
        repeatMode = RepeatMode.Reverse
    ),
    label = "repeatable spec"
)
```

---

## 六、infiniteRepeatable - 无限重复动画

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = infiniteRepeatable(
        animation = tween(durationMillis = 300),
        repeatMode = RepeatMode.Reverse
    ),
    label = "infinite repeatable"
)
```

---

## 七、snap - 立即切换

`snap` 会立即将值切换到结束值。

```kotlin
val value by animateFloatAsState(
    targetValue = 1f,
    animationSpec = snap(delayMillis = 50),
    label = "snap spec"
)
```

---

## Easing 函数

基于时长的 `AnimationSpec` 操作使用 `Easing` 来调整动画的小数值。

### 内置 Easing 函数

| Easing | 描述 |
|--------|------|
| `FastOutSlowInEasing` | 快出慢入 |
| `LinearOutSlowInEasing` | 线性出慢入 |
| `FastOutLinearEasing` | 快出线性入 |
| `LinearEasing` | 线性 |
| `CubicBezierEasing` | 贝塞尔曲线 |

### 自定义 Easing

```kotlin
val CustomEasing = Easing { fraction -> fraction * fraction }

@Composable
fun EasingUsage() {
    val value by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(
            durationMillis = 300,
            easing = CustomEasing
        ),
        label = "custom easing"
    )
}
```

---

## 自定义数据类型动画

### TwoWayConverter

任何动画值都表示为 `AnimationVector`。使用 `TwoWayConverter` 将值转换为 `AnimationVector`，反之亦然。

```kotlin
val IntToVector: TwoWayConverter<Int, AnimationVector1D> =
    TwoWayConverter(
        { AnimationVector1D(it.toFloat()) },
        { it.value.toInt() }
    )
```

### AnimationVector 类型

| 类型 | 维度 |
|------|------|
| `AnimationVector1D` | 1 个浮点值 |
| `AnimationVector2D` | 2 个浮点值 |
| `AnimationVector3D` | 3 个浮点值 |
| `AnimationVector4D` | 4 个浮点值 |

### 自定义类型示例

```kotlin
data class MySize(val width: Dp, val height: Dp)

@Composable
fun MyAnimation(targetSize: MySize) {
    val animSize: MySize by animateValueAsState(
        targetSize,
        TwoWayConverter(
            convertToVector = { size: MySize ->
                AnimationVector2D(size.width.value, size.height.value)
            },
            convertFromVector = { vector: AnimationVector2D ->
                MySize(vector.v1.dp, vector.v2.dp)
            }
        ),
        label = "size"
    )
}
```

### 内置 VectorConverter

- `Color.VectorConverter`
- `Dp.VectorConverter`
- `Offset.VectorConverter`
- `Int.VectorConverter`
- `Float.VectorConverter`
- `IntSize.VectorConverter`

---

## 学习资源

- [自定义动画 | Android Developers](https://developer.android.google.cn/develop/ui/compose/animation/customize?hl=zh-cn)
- [速度 - Material Design](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration)

---

*持续学习中...*
