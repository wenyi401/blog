---
title: Android EncryptedSharedPreferences加密存储
date: 2026-04-03 23:52:00
tags: [Android, SharedPreferences, 加密, 安全存储]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

EncryptedSharedPreferences 提供了一种安全的方式来存储键值对，使用加密保护敏感数据。

## 一、添加依赖

```gradle
dependencies {
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
```

## 二、创建 EncryptedSharedPreferences

```kotlin
private fun createEncryptedSharedPreferences(context: Context): SharedPreferences {
    val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    return EncryptedSharedPreferences.create(
        context,
        "secret_shared_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
}
```

## 三、使用示例

### 保存数据

```kotlin
val sharedPrefs = createEncryptedSharedPreferences(context)

sharedPrefs.edit().apply {
    putString("api_key", "your-secret-key")
    putString("user_token", "your-token")
    apply()
}
```

### 读取数据

```kotlin
val apiKey = sharedPrefs.getString("api_key", null)
val userToken = sharedPrefs.getString("user_token", null)
```

## 四、迁移指南

### 从 SharedPreferences 迁移

```kotlin
fun migrateToEncrypted(context: Context) {
    val oldPrefs = context.getSharedPreferences("old_prefs", Context.MODE_PRIVATE)
    val encryptedPrefs = createEncryptedSharedPreferences(context)
    
    val allEntries = oldPrefs.all
    encryptedPrefs.edit().apply {
        for ((key, value) in allEntries) {
            when (value) {
                is String -> putString(key, value)
                is Int -> putInt(key, value)
                is Boolean -> putBoolean(key, value)
                is Float -> putFloat(key, value)
                is Long -> putLong(key, value)
            }
        }
        apply()
    }
    
    // 清除旧的 SharedPreferences
    oldPrefs.edit().clear().apply()
}
```

## 五、替代方案

根据 2026 年的迁移指南，推荐使用 **DataStore + Tink** 替代 EncryptedSharedPreferences：

```kotlin
dependencies {
    implementation("androidx.datastore:datastore-preferences:1.1.1")
}
```

## 学习资源

- [EncryptedSharedPreferences | Android Developers](https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences)
- [Goodbye EncryptedSharedPreferences: A 2026 Migration Guide](https://proandroiddev.com/goodbye-encryptedsharedpreferences-a-2026-migration-guide-4b819b4a537a)

---

*持续学习中...*
