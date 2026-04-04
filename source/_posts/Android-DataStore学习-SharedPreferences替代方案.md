---
title: Android DataStore学习-SharedPreferences替代方案
date: 2026-04-03 23:10:00
tags: [Android, DataStore, SharedPreferences, 数据存储]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

SharedPreferences 作为 Android 早期的轻量级存储方案，已经服务了开发者十多年。但随着 Android 开发的演进，SharedPreferences 的局限性逐渐显现。Jetpack DataStore 作为其现代化替代方案，提供了更安全、高效的异步数据存储能力。

## 一、SharedPreferences 的问题

| 问题 | 描述 |
|------|------|
| **同步 I/O** | 主线程调用可能导致 ANR |
| **运行时错误** | 解析错误只能在运行时发现 |
| **类型安全** | 缺乏编译时类型检查 |
| **API 设计** | 同步 API 不适合现代异步架构 |
| **数据安全** | 无内置加密支持 |

---

## 二、DataStore 概述

### 两种类型

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| **Preferences DataStore** | 键值对存储 | 简单配置 |
| **Proto DataStore** | 类型化对象存储 | 复杂数据结构 |

### 优势

- **异步 API**：基于协程和 Flow
- **类型安全**：Proto DataStore 提供编译时类型检查
- **数据一致性**：事务性写入
- **错误处理**：更好的错误恢复机制
- **迁移支持**：从 SharedPreferences 平滑迁移

---

## 三、Preferences DataStore

### 添加依赖

```gradle
dependencies {
    implementation("androidx.datastore:datastore-preferences:1.1.1")
}
```

### 创建 DataStore

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings"
)
```

### 定义 Key

```kotlin
// 基本类型
val STRING_KEY = stringPreferencesKey("string_key")
val INT_KEY = intPreferencesKey("int_key")
val BOOLEAN_KEY = booleanPreferencesKey("boolean_key")
val FLOAT_KEY = floatPreferencesKey("float_key")
val LONG_KEY = longPreferencesKey("long_key")
val DOUBLE_KEY = doublePreferencesKey("double_key")

// Set 类型
val STRING_SET_KEY = stringSetPreferencesKey("string_set_key")
```

### 写入数据

```kotlin
suspend fun saveString(value: String) {
    dataStore.edit { preferences ->
        preferences[STRING_KEY] = value
    }
}

suspend fun saveInt(value: Int) {
    dataStore.edit { preferences ->
        preferences[INT_KEY] = value
    }
}
```

### 读取数据

```kotlin
// 使用 Flow 读取
val stringValue: Flow<String> = dataStore.data
    .map { preferences ->
        preferences[STRING_KEY] ?: ""
    }

// 一次性读取
suspend fun getStringOnce(): String {
    return dataStore.data.first()[STRING_KEY] ?: ""
}
```

### 完整示例

```kotlin
class SettingsManager(private val context: Context) {
    
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
        name = "settings"
    )
    
    companion object {
        val DARK_MODE = booleanPreferencesKey("dark_mode")
        val FONT_SIZE = intPreferencesKey("font_size")
    }
    
    // 读取设置
    val settingsFlow: Flow<Settings> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(androidx.datastore.preferences.core.emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            Settings(
                darkMode = preferences[DARK_MODE] ?: false,
                fontSize = preferences[FONT_SIZE] ?: 14
            )
        }
    
    // 保存设置
    suspend fun updateDarkMode(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[DARK_MODE] = enabled
        }
    }
    
    suspend fun updateFontSize(size: Int) {
        context.dataStore.edit { preferences ->
            preferences[FONT_SIZE] = size
        }
    }
}

data class Settings(
    val darkMode: Boolean = false,
    val fontSize: Int = 14
)
```

---

## 四、Proto DataStore

### 添加依赖

```gradle
dependencies {
    implementation("androidx.datastore:datastore:1.1.1")
}
```

### 定义 Proto Schema

```proto
// app/src/main/proto/settings.proto
syntax = "proto3";

option java_package = "com.example.app";
option java_multiple_files = true;

message Settings {
    bool dark_mode = 1;
    int32 font_size = 2;
    string theme = 3;
}
```

### 创建 Serializer

```kotlin
object SettingsSerializer : Serializer<Settings> {
    override val defaultValue: Settings = Settings.getDefaultInstance()
    
    override suspend fun readFrom(input: InputStream): Settings {
        return try {
            Settings.parseFrom(input)
        } catch (exception: InvalidProtocolBufferException) {
            defaultValue
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

### 使用示例

```kotlin
// 读取数据
val settingsFlow: Flow<Settings> = context.settingsDataStore.data
    .catch { exception ->
        if (exception is IOException) {
            emit(Settings.getDefaultInstance())
        } else {
            throw exception
        }
    }

// 更新数据
suspend fun updateSettings(settings: Settings) {
    context.settingsDataStore.updateData { currentSettings ->
        currentSettings.toBuilder()
            .setDarkMode(settings.darkMode)
            .setFontSize(settings.fontSize)
            .build()
    }
}
```

---

## 五、从 SharedPreferences 迁移

### Preferences DataStore 迁移

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(SharedPreferencesMigration(context, "old_preferences"))
    }
)
```

### 迁移策略

```kotlin
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "settings",
    produceMigrations = { context ->
        listOf(
            SharedPreferencesMigration(
                context = context,
                sharedPreferencesName = "old_preferences",
                migrate = { sharedPreferences, preferences ->
                    // 自定义迁移逻辑
                    val darkMode = sharedPreferences.getBoolean("dark_mode", false)
                    preferences.toMutablePreferences().apply {
                        this[DARK_MODE] = darkMode
                    }
                }
            )
        )
    }
)
```

---

## 六、DataStore vs SharedPreferences

| 特性 | DataStore | SharedPreferences |
|------|-----------|-------------------|
| **API** | 异步（协程 + Flow） | 同步 |
| **类型安全** | Proto DataStore 支持 | 否 |
| **数据一致性** | 事务性写入 | 可能不一致 |
| **错误处理** | 完善 | 有限 |
| **加密支持** | 需要额外配置 | EncryptedSharedPreferences |
| **迁移** | 支持 | - |

---

## 七、最佳实践

1. **使用 Preferences DataStore** 处理简单键值对
2. **使用 Proto DataStore** 处理复杂数据结构
3. **处理异常**：使用 `catch` 操作符处理 IO 异常
4. **避免同步调用**：始终在协程中使用
5. **合理迁移**：从 SharedPreferences 平滑过渡

---

## 学习资源

- [Android Jetpack DataStore：终极SharedPreferences替代方案完整指南](https://blog.csdn.net/gitblog_00025/article/details/137814519)
- [Stop Using SharedPreferences: Mastering Jetpack DataStore in 2026](https://medium.com/@kemal_codes/stop-using-sharedpreferences-mastering-jetpack-datastore-in-2026-b88b2db50e91)
- [从SharedPreferences到DataStore：Android存储进化之路](https://juejin.cn/post/7622306009688473600)

---

*持续学习中...*
