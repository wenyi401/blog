---
title: Android生物识别Biometric API实战
date: 2026-04-03 23:52:00
tags: [Android, Biometric, 指纹, 生物识别]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Biometric API 提供标准化的生物识别认证支持，包括指纹、人脸、虹膜等，适用于应用登录、支付验证等场景。

## 一、添加依赖

```gradle
dependencies {
    implementation("androidx.biometric:biometric:1.2.0-alpha05")
}
```

## 二、检查设备支持

```kotlin
private fun canAuthenticate(): Int {
    val biometricManager = BiometricManager.from(this)
    return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
}

// 使用
when (canAuthenticate()) {
    BiometricManager.BIOMETRIC_SUCCESS -> {
        // 可以使用生物识别
    }
    BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
        // 没有生物识别硬件
    }
    BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
        // 没有注册生物识别
    }
}
```

## 三、显示认证提示

```kotlin
private fun showBiometricPrompt() {
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("生物识别认证")
        .setSubtitle("使用指纹或面部识别")
        .setNegativeButtonText("取消")
        .build()
    
    val biometricPrompt = BiometricPrompt(
        this,
        ContextCompat.getMainExecutor(this),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                // 认证成功
            }
            
            override fun onAuthenticationFailed() {
                // 认证失败
            }
        }
    )
    
    biometricPrompt.authenticate(promptInfo)
}
```

## 四、加密支持

```kotlin
private fun createEncryptPrompt(): BiometricPrompt {
    val cryptoObject = BiometricPrompt.CryptoObject(
        cipher  // 预先初始化的 Cipher 对象
    )
    
    return BiometricPrompt(
        this,
        ContextCompat.getMainExecutor(this),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                val cipher = result.cryptoObject?.cipher
                // 使用 cipher 进行加密
            }
        }
    )
}
```

## 学习资源

- [Android Biometric API 新手使用指南](https://juejin.cn/post/7485965103113977868)
- [生物识别 | Android Open Source Project](https://source.android.com/docs/security/features/biometric?hl=zh-cn)

---

*持续学习中...*
