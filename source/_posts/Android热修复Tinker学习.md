---
title: Android热修复Tinker学习
date: 2026-04-03 23:41:00
tags: [Android, Tinker, 热修复, 热更新]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Tinker 是腾讯开源的 Android 热补丁解决方案，支持动态下发代码、So 库以及资源，让应用能够在不需要重新安装的情况下实现更新。

## 一、Tinker 概述

### 核心功能

| 功能 | 描述 |
|------|------|
| **代码热修复** | 动态下发 dex 补丁 |
| **资源热修复** | 动态更新资源文件 |
| **So 库热修复** | 动态更新 native 库 |

### 组成部分

- **gradle 编译插件**：tinker-patch-gradle-plugin
- **核心 SDK 库**：tinker-android-lib
- **命令行版本**：非 gradle 用户

## 二、添加依赖

### 项目 build.gradle

```gradle
buildscript {
    dependencies {
        classpath 'com.tencent.tinker:tinker-patch-gradle-plugin:1.9.14.25'
    }
}
```

### app build.gradle

```gradle
dependencies {
    implementation 'com.tencent.tinker:tinker-android-lib:1.9.14.25'
}

apply plugin: 'com.tencent.tinker.patch'

tinkerPatch {
    oldApk = "${bakPath}/app-debug.apk"
    ignoreWarning = false
    useSign = true
    dex {
        dexMode = "jar"
        pattern = ["classes*.dex", "assets/secondary-dex-?.jar"]
    }
    lib {
        pattern = ["lib/*/*.so"]
    }
    res {
        pattern = ["res/*", "r/*", "assets/*", "resources.arsc", "AndroidManifest.xml"]
        ignoreChange = []
        largeModSize = 100
    }
    packageConfig {}
    sevenZip {
        zipArtifact = "com.tencent.mm:SevenZip:1.2.21"
    }
    buildConfig {
        keepDexApply = false
    }
}
```

## 三、初始化 Tinker

### Application 类

```kotlin
class MyApplication : Application() {
    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base)
        TinkerInstaller.install(this)
    }
}
```

### 配置 TINKER_ID

```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0"
        
        buildConfigField "String", "TINKER_ID", "\"${gitSha()}\""
    }
}

def gitSha() {
    return 'git rev-parse --short HEAD'.execute().text.trim()
}
```

## 四、生成补丁

### 编译基准包

```bash
./gradlew assembleDebug
```

### 复制基准包

```bash
cp app/build/outputs/apk/debug/app-debug.apk app/bak/
```

### 修复 bug 后生成补丁

```bash
./gradlew tinkerPatchDebug
```

### 补丁输出

```
app/build/outputs/tinkerPatch/debug/patch_signed_7zip.apk
```

## 五、加载补丁

### 服务端下发

```kotlin
class PatchService {
    fun downloadPatch(url: String): File {
        // 下载补丁
    }
    
    fun applyPatch(context: Context, patchFile: File) {
        TinkerInstaller.onReceiveUpgradePatch(
            context,
            patchFile.absolutePath
        )
    }
}
```

### 补丁加载结果

```kotlin
// 注册结果回调
Tinker.with(application).setPatchResultListener { result ->
    if (result.isSuccess) {
        println("补丁加载成功")
    } else {
        println("补丁加载失败: ${result.errCode}")
    }
}
```

## 六、补丁管理

### 版本检查

```kotlin
class PatchManager(private val context: Context) {
    
    fun checkUpdate() {
        val currentVersion = BuildConfig.TINKER_ID
        val latestVersion = fetchLatestPatchVersion()
        
        if (latestVersion > currentVersion) {
            downloadAndApplyPatch(latestVersion)
        }
    }
    
    private fun downloadAndApplyPatch(version: String) {
        val patchUrl = "https://api.example.com/patches/$version"
        // 下载并应用补丁
    }
}
```

### 补丁清理

```kotlin
// 清理所有补丁
Tinker.with(context).cleanPatch()

// 重启应用
Tinker.with(context).setPatchResultListener { result ->
    if (result.isSuccess) {
        ProcessPhoenix.triggerRebirth(context)
    }
}
```

## 七、补丁验证

### 签名校验

```kotlin
tinkerPatch {
    useSign = true
    
    signConfig {
        storeFile = file("keystore.jks")
        storePassword = "password"
        keyAlias = "alias"
        keyPassword = "password"
    }
}
```

### MD5 校验

```kotlin
fun verifyPatch(patchFile: File): Boolean {
    val expectedMd5 = fetchExpectedMd5()
    val actualMd5 = calculateMd5(patchFile)
    return expectedMd5 == actualMd5
}
```

## 八、注意事项

### 限制

- 不支持新增 Activity
- 不支持修改 AndroidManifest.xml
- 不支持修改布局 id

### 最佳实践

1. **小范围修复**：仅修复关键 bug
2. **充分测试**：补丁上线前充分测试
3. **版本管理**：记录每个补丁的版本号
4. **灰度发布**：先小范围发布，观察效果

## 九、Tinker vs 其他方案

| 方案 | 支持 dex | 支持资源 | 支持 so |
|------|----------|----------|---------|
| **Tinker** | ✅ | ✅ | ✅ |
| **AndFix** | ✅ | ❌ | ❌ |
| **HotFix** | ✅ | ❌ | ❌ |
| **Robust** | ✅ | ❌ | ❌ |

## 学习资源

- [Tinker GitHub Wiki](https://github.com/Tencent/tinker/wiki)
- [Tinker热修复框架详解](https://blog.csdn.net/bryant_liu24/article/details/144273326)
- [微信Android热更新Tinker使用详解](https://www.zhangshengrong.com/p/zD1y76pNrv/)

---

*持续学习中...*
