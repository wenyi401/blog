---
title: Android逆向分析-Xposed模块开发实战
date: 2026-04-03 23:03:00
tags: [Android, Xposed, 逆向分析, Hook]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Xposed 是一个非常神奇的框架，对于普通用户，Xposed 框架可以发挥 Android 系统更高的使用效率，可以随便折腾，美化优化系统。对于开发者而言，Xposed 可以用于逆向工程、动态逆向分析 APP、截取内容，也可以用于 Mock 定位、修改系统参数等。

## Xposed 框架概述

### 支持版本

- Android 4.0 ~ Android 8.1
- 需要获得 Root 权限
- 可以使用 Android 模拟器

### 安装步骤

1. 下载 Xposed installer（XposedInstaller_3.1.5.apk）
2. 打开 Xposed installer
3. 点击安装框架

---

## 实战：创建目标项目

### 目标项目代码

包名：`com.taoweiji.xposed.example`

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        button.setOnClickListener {
            val text = getInfo("test", System.currentTimeMillis().toString())
            Toast.makeText(this, text, Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun getInfo(arg1: String, arg2: String): String {
        return "$arg1,$arg2"
    }
}
```

### 目标方法

- 方法名：`getInfo`
- 参数：`arg1: String`, `arg2: String`
- 返回值：`"$arg1,$arg2"`

---

## 实战：创建插件项目

### 1. 修改 build.gradle

```gradle
apply plugin: 'com.android.application'

android {
    compileSdkVersion 28
    defaultConfig {
        applicationId "com.taoweiji.xposed.myplugin"
        minSdkVersion 14
        targetSdkVersion 28
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    compileOnly 'de.robv.android.xposed:api:82'
    compileOnly 'de.robv.android.xposed:api:82:sources'
}
```

### 2. 修改 AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.taoweiji.xposed.myplugin">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">

        <!-- Xposed 模块配置 -->
        <meta-data
            android:name="xposedmodule"
            android:value="true" />
        <meta-data
            android:name="xposedminversion"
            android:value="82" />
        <meta-data
            android:name="xposeddescription"
            android:value="myxpose" />
    </application>
</manifest>
```

### 3. 创建 Hook 类

```java
package com.taoweiji.xposed.myplugin;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.callbacks.XC_LoadPackage;
import static de.robv.android.xposed.XposedHelpers.findAndHookMethod;

public class Main implements IXposedHookLoadPackage {
    
    public void handleLoadPackage(final XC_LoadPackage.LoadPackageParam lpparam) throws Throwable {
        // 只处理目标应用
        if (!lpparam.packageName.equals("com.taoweiji.xposed.example"))
            return;
            
        XposedBridge.log("Loaded app:" + lpparam.packageName);
        
        // Hook getInfo 方法
        findAndHookMethod(
            "com.taoweiji.xposed.example.MainActivity",
            lpparam.classLoader,
            "getInfo",
            String.class,
            String.class,
            new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                    XposedBridge.log("开始劫持了~");
                    XposedBridge.log("参数1 = " + param.args[0]);
                    XposedBridge.log("参数2 = " + param.args[1]);
                    
                    // 修改参数
                    param.args[0] = "arg1参数被修改";
                    param.args[1] = "arg2参数被修改";
                }
                
                @Override
                protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                    XposedBridge.log("劫持结束了~");
                    XposedBridge.log("参数1 = " + param.args[0]);
                    XposedBridge.log("参数2 = " + param.args[1]);
                    
                    Object object = param.getResult();
                    XposedBridge.log("实际返回值 = " + object);
                    
                    // 修改返回值
                    param.setResult("返回值被修改," + object.toString());
                }
            }
        );
    }
}
```

---

## Xposed Hook 核心 API

### IXposedHookLoadPackage 接口

```java
public interface IXposedHookLoadPackage {
    void handleLoadPackage(LoadPackageParam lpparam) throws Throwable;
}
```

### findAndHookMethod 方法

```java
findAndHookMethod(
    String className,        // 类名
    ClassLoader classLoader, // 类加载器
    String methodName,       // 方法名
    Class<?>... parameterTypesAndCallback // 参数类型和回调
)
```

### XC_MethodHook 回调

| 方法 | 描述 |
|------|------|
| `beforeHookedMethod` | 方法执行前调用，可修改参数 |
| `afterHookedMethod` | 方法执行后调用，可修改返回值 |

### MethodHookParam 对象

| 属性/方法 | 描述 |
|-----------|------|
| `param.args` | 方法参数数组 |
| `param.getResult()` | 获取返回值 |
| `param.setResult()` | 设置返回值 |

---

## 安装和测试

### 安装步骤

1. 安装目标项目到手机/模拟器
2. 安装插件项目到手机/模拟器
3. 在 Xposed Installer 中勾选插件
4. 重启手机/模拟器
5. 打开目标应用，点击按钮测试

### 注意事项

- Android Studio 不要开启 Instant Run
- 小米手机可能需要解锁 System 分区

---

## Xposed API 文档

官方文档：https://api.xposed.info/using.html

---

## 进阶学习

- LSPosed：支持 Android 8.1+ 的新框架
- BiliRoaming：实战项目参考
- EdXposed：另一个 Xposed 分支

---

## 学习资源

- [XposedHookExample - GitHub](https://github.com/taoweiji/XposedHookExample)
- [Xposed 官方 API 文档](https://api.xposed.info/using.html)
- [Android 逆向之 Xposed 开发 - 掘金](https://juejin.cn/post/7280435879548911675)

---

*持续学习中...*
