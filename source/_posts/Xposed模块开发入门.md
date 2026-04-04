---
title: Xposed模块开发入门
date: 2026-04-03 14:46:00
tags: [Android, Xposed, Hook, Kotlin]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

最近开始学习 Android 开发，特别是 Xposed 模块开发。Xposed 是一个强大的框架，允许开发者通过 Hook 系统或应用的函数来修改其行为，无需修改原始 APK 文件。

## 环境准备

### 必需工具
- Android Studio / IDEA
- JDK (Java Development Kit)
- LSPosed 框架手机（Android 10+）
- JADX 反编译工具
- 开发者助手 APP

### 前置知识
- Java / Kotlin（推荐 Kotlin）
- Java 反射
- Android 基础（Context、View 等）

## 项目配置

### 1. 添加 Xposed 仓库

在 `settings.gradle` 中添加：

```gradle
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url 'https://api.xposed.info/' }
    }
}
```

### 2. 添加依赖

在 `build.gradle` 中添加：

```gradle
dependencies {
    compileOnly 'de.robv.android.xposed:api:82'
}
```

### 3. 声明模块

在 `AndroidManifest.xml` 中：

```xml
<application ... >
    <meta-data android:name="xposedmodule" android:value="true"/>
    <meta-data android:name="xposeddescription" android:value="模块简介"/>
    <meta-data android:name="xposedminversion" android:value="54"/>
    <meta-data android:name="xposedscope" android:resource="@array/xposedscope"/>
</application>
```

### 4. 创建入口文件

在 `src/main/assets/xposed_init` 中写入入口类的完整路径：

```
me.example.xposedmodule.MainHook
```

## 实现 Hook

### MainHook 类

```java
public class MainHook implements IXposedHookLoadPackage {
    @Override
    public void handleLoadPackage(LoadPackageParam lpparam) {
        if (!lpparam.packageName.equals("目标包名")) return;
        
        XposedHelpers.findAndHookMethod(
            "目标类名", 
            lpparam.classLoader,
            "方法名", 
            参数.class,
            new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) {
                    // 方法执行前
                }
                @Override
                protected void afterHookedMethod(MethodHookParam param) {
                    // 方法执行后
                }
            }
        );
    }
}
```

## 学习资源

- [Xposed模块开发入门保姆级教程](https://blog.ketal.icu/cn/Xposed%E6%A8%A1%E5%9D%97%E5%BC%80%E5%8F%91%E5%85%A5%E9%97%A8%E4%BF%9D%E5%A7%86%E7%BA%A7%E6%95%99%E7%A8%8B/)
- [GitHub: xposed topics](https://github.com/topics/xposed)
- [LSPosed](https://github.com/LSPosed/LSPosed)

## 下一步

- 学习 Kotlin 语法
- 实践一个简单的 Xposed 模块
- 研究 GitHub 上的优秀项目

---

*持续学习中...*
