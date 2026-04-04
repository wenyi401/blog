---
title: Android Jetpack组件学习-DataStore数据存储
date: 2026-04-03 18:06:00
tags: [Android, Jetpack, DataStore, Kotlin, SharedPreferences]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Jetpack DataStore 是一种数据存储解决方案，是 SharedPreferences 的现代替代方案。它使用 Kotlin 协程和 Flow 以异步、一致的事务方式存储数据。

## DataStore 概述

### 优势

- **异步 API**：使用协程和 Flow
- **类型安全**：支持类型化对象存储
- **事务性**：数据更新是一致的
- **错误处理**：提供完善的错误处理机制

### 两种实现

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| **Preferences DataStore** | 类似 SharedPreferences，不需要预定义架构 | 简单键值对存储 |
| **Proto DataStore** | 存储类型化对象，需要预定义架构 | 复杂数据结构 |

## 设置依赖

### Preferences DataStore

```gradle
dependencies {
    implementation("androidx.datastore:datastore-preferences:1.2.1")
}
```

### Proto DataStore

```gradle
dependencies {
    implementation("androidx.datastore:datastore:1.2.1")
    implementation("com.google.protobuf:protobuf-kotlin-lite:4.32.1")
}
```

## Preferences DataStore 使用

### 创建 DataStore

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")
```

### 定义键

```kotlin
val EXAMPLE_COUNTER = intPreferencesKey("example_counter")
val USER_NAME = stringPreferencesKey("user_name")
val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
```

### 读取数据

```kotlin
val flow: Flow<Int> = context.dataStore.data
    .map { preferences ->
        preferences[EXAMPLE_COUNTER] ?: 0
    }
```

### 写入数据

```kotlin
suspend fun incrementCounter() {
    context.dataStore.edit { preferences ->
        val currentCounter = preferences[EXAMPLE_COUNTER] ?: 0
        preferences[EXAMPLE_COUNTER] = currentCounter + 1
    }
}
```

## Proto DataStore 使用

### 定义 Proto 文件

```protobuf
syntax = "proto3";

option java_package = "com.example.datastore";
option java_multiple_files = true;

message Settings {
  int32 example_counter = 1;
  string user_name = 2;
}
```

### 定义序列化器

```kotlin
object SettingsSerializer : Serializer<Settings> {
    override val defaultValue: Settings = Settings.getDefaultInstance()

    override suspend fun readFrom(input: InputStream): Settings {
        try {
            return Settings.parseFrom(input)
        } catch (exception: InvalidProtocolBufferException) {
            throw CorruptionException("Cannot read proto.", exception)
        }
    }

    override suspend fun writeTo(t: Settings, output: OutputStream) {
        t.writeTo(output)
    }
}
```

### 创建 DataStore

```kotlin
private val Context.settingsDataStore: DataStore<Settings> by dataStore(
    fileName = "settings.pb",
    serializer = SettingsSerializer
)
```

### 读取数据

```kotlin
val flow: Flow<Settings> = context.settingsDataStore.data
```

### 写入数据

```kotlin
suspend fun updateSettings(newCounter: Int) {
    context.settingsDataStore.updateData { currentSettings ->
        currentSettings.toBuilder()
            .setExampleCounter(newCounter)
            .build()
    }
}
```

## 使用规则

1. **不要创建多个实例**：同一进程中为给定文件只创建一个 DataStore 实例
2. **类型必须不可变**：DataStore 的泛型类型必须不可变
3. **不要混用**：不要对同一个文件混用 SingleProcessDataStore 和 MultiProcessDataStore

## 从 SharedPreferences 迁移

```kotlin
val dataStore: DataStore<Preferences> = context.dataStore

// 迁移 SharedPreferences
dataStore.edit { preferences ->
    val sharedPrefs = context.getSharedPreferences("old_prefs", Context.MODE_PRIVATE)
    sharedPrefs.all.forEach { (key, value) ->
        when (value) {
            is Int -> preferences[intPreferencesKey(key)] = value
            is String -> preferences[stringPreferencesKey(key)] = value
            is Boolean -> preferences[booleanPreferencesKey(key)] = value
        }
    }
}
```

## 学习资源

- [DataStore 官方文档](https://developer.android.google.cn/topic/libraries/architecture/datastore?hl=zh-cn)
- [DataStore迁移指南](https://www.zhifeiya.cn/post/2026/4/1/5438f624)
- [DataStore vs SharedPreferences](https://juejin.cn/post/7535135041821212723)

## 下一步

- 学习 WorkManager（后台任务）
- 学习 Hilt（依赖注入）
- 学习 Paging 3（分页加载）

---

*持续学习中...*
