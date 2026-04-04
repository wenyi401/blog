---
title: Kotlin Multiplatform跨平台开发学习
date: 2026-04-03 22:51:00
tags: [Kotlin, KMP, 跨平台, Compose Multiplatform]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin Multiplatform (KMP) 是 JetBrains 的开源技术，可以在 Android、iOS、desktop、web、server 之间共享代码，同时保留原生开发的优势。使用 Compose Multiplatform，还可以跨平台共享 UI 代码。

## KMP 概述

### 为什么选择 KMP？

| 优势 | 描述 |
|------|------|
| **成本效率** | 减少重复和维护成本 |
| **更快交付** | 同时在多个平台发布功能 |
| **团队协作** | 统一逻辑便于知识传递 |
| **原生性能** | 使用 Kotlin/Native 生成原生二进制 |
| **灵活性** | 可以渐进式采用 |

### 2024 年 KMP 调查数据

- **55%** 用户报告采用 KMP 后协作改善
- **65%** 团队报告性能和质量提升

### 采用 KMP 的公司

Google, Duolingo, Forbes, Philips, McDonald's, Bolt, H&M, Baidu, Kuaishou, Bilibili 等

## 代码共享方式

### 1. 共享隔离模块

共享特定模块（如网络或存储），逐步扩展共享代码。

```
shared/
├── network/    # 网络层
├── storage/    # 存储层
└── utils/      # 工具类
```

### 2. 共享业务逻辑

共享所有业务逻辑，保持 UI 原生。

```
shared/
├── domain/     # 领域层
├── data/       # 数据层
└── presentation/ # 表示层逻辑
```

### 3. 共享 UI 和逻辑

使用 Compose Multiplatform 共享 UI 和业务逻辑。

```
shared/
├── domain/
├── data/
└── ui/         # Compose UI
```

## 支持的平台

| 平台 | 目标 | UI 框架 |
|------|------|---------|
| Android | androidTarget | Jetpack Compose |
| iOS | iosArm64, iosX64, iosSimulatorArm64 | SwiftUI / UIKit / Compose |
| Desktop | jvm | Compose Desktop |
| Web | js | Compose Web |
| Server | jvm | Ktor / Spring |

## 项目结构

```gradle
kotlin {
    androidTarget()
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    jvm("desktop")
    
    sourceSets {
        val commonMain by getting
        val androidMain by getting
        val iosMain by getting
    }
}
```

## Compose Multiplatform

### 添加依赖

```gradle
kotlin {
    sourceSets {
        val commonMain by getting {
            dependencies {
                api(compose.runtime)
                api(compose.foundation)
                api(compose.material3)
            }
        }
    }
}
```

### 共享 UI 示例

```kotlin
@Composable
fun SharedApp() {
    MaterialTheme {
        Surface {
            Text("Hello from KMP!")
        }
    }
}
```

## iOS 集成

### 原生 UI (SwiftUI)

```swift
struct ContentView: View {
    var body: some View {
        Text("Native iOS UI")
    }
}
```

### 共享 UI (Compose)

```swift
// 使用 Compose Multiplatform
ContentViewKt.ContentView()
```

## 工具支持

### IntelliJ IDEA / Android Studio

- Kotlin Multiplatform IDE 插件
- 通用 UI 预览
- Compose 热重载
- 跨语言导航
- Kotlin 和 Swift 代码调试

### AI 辅助开发

Junie - JetBrains AI 编码代理，可以处理 KMP 任务。

## 学习资源

- [KMP 官方文档](https://kotlinlang.org/docs/multiplatform/kmp-overview.html)
- [Compose Multiplatform 教程](https://kotlinlang.org/docs/multiplatform/compose-multiplatform-create-first-app.html)
- [KMP 案例研究](https://kotlinlang.org/case-studies/?type=multiplatform)
- [klibs.io - KMP 库搜索](https://klibs.io/)

## 下一步

- 实践 KMP quickstart
- 学习 Compose Multiplatform
- 探索 iOS 集成方法

---

*持续学习中...*
