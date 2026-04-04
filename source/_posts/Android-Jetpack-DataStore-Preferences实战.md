---
title: Android Jetpack DataStore Preferences实战
date: 2026-04-03 23:52:00
tags: [Android, DataStore, Preferences]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

DataStore 是 Jetpack 推荐的数据存储方案，提供了 Preferences DataStore 和 Proto DataStore 两种实现。相比 SharedPreferences，它支持异步操作、数据迁移和类型安全。

## 一、添加依赖

```gradle
dependencies {
    implementation("androidx.datastore:datastore-preferences:1.1.1")
}
```

## 二、创建 DataStore

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")
```

## 三、保存数据

```kotlin
suspend fun saveTheme(isDark: Boolean) {
    val key = booleanPreferencesKey("is_dark_theme")
    context.dataStore.edit { preferences ->
        preferences[key] = isDark
    }
}
```

## 四、读取数据

```kotlin
val isDarkTheme: Flow<Boolean> = context.dataStore.data
    .map { preferences ->
        preferences[booleanPreferencesKey("is_dark_theme")] ?: false
    }
```

## 五、迁移 SharedPreferences

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(SharedPreferencesMigration(context, "old_prefs"))
    }
)
```

## 学习资源

- [DataStore | Android Developers](https://developer.android.com/topic/libraries/architecture/datastore)
- [Stop Using SharedPreferences: Mastering Jetpack DataStore in 2026](https://medium.com/@kemal_codes/stop-using-sharedpreferences-mastering-jetpack-datastore-in-2026-b88b2db50e91)

---

*持续学习中...*
