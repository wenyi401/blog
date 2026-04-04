---
title: Android JNI NDK Native开发学习
date: 2026-04-03 23:42:00
tags: [Android, JNI, NDK, Native, C++]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Android NDK（Native Development Kit）是一套工具，允许在 Android 应用中使用 C 和 C++ 代码。JNI（Java Native Interface）是 Java 和 Native 代码之间的桥梁。

## 一、NDK 概述

### 什么是 NDK？

- 用于编译 C/C++ 代码的工具集
- 生成 .so 动态库
- 支持 ARM、x86 等架构

### 为什么使用 NDK？

| 场景 | 描述 |
|------|------|
| **性能优化** | 计算密集型任务 |
| **代码复用** | 使用现有 C/C++ 库 |
| **安全保护** | 代码难以逆向 |
| **跨平台** | 共享核心逻辑 |

## 二、配置 NDK 项目

### build.gradle

```gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a'
        }
    }
    
    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
        }
    }
}
```

### CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.4.1)

add_library(
    native-lib
    SHARED
    native-lib.cpp
)

find_library(
    log-lib
    log
)

target_link_libraries(
    native-lib
    ${log-lib}
)
```

## 三、JNI 基础

### 声明 Native 方法

```kotlin
class NativeLib {
    external fun stringFromJNI(): String
    external fun add(a: Int, b: Int): Int
    
    companion object {
        init {
            System.loadLibrary("native-lib")
        }
    }
}
```

### 实现 JNI 方法

```cpp
#include <jni.h>
#include <string>

extern "C" JNIEXPORT jstring JNICALL
Java_com_example_myapp_NativeLib_stringFromJNI(
    JNIEnv* env,
    jobject /* this */) {
    std::string hello = "Hello from C++";
    return env->NewStringUTF(hello.c_str());
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_myapp_NativeLib_add(
    JNIEnv* env,
    jobject /* this */,
    jint a,
    jint b) {
    return a + b;
}
```

## 四、JNI 类型映射

| Java 类型 | JNI 类型 | C++ 类型 |
|-----------|----------|----------|
| boolean | jboolean | uint8_t |
| byte | jbyte | int8_t |
| char | jchar | uint16_t |
| short | jshort | int16_t |
| int | jint | int32_t |
| long | jlong | int64_t |
| float | jfloat | float |
| double | jdouble | double |
| String | jstring | - |
| Object | jobject | - |
| Class | jclass | - |

## 五、字符串处理

### Java 字符串 → C++ 字符串

```cpp
extern "C" JNIEXPORT void JNICALL
Java_com_example_myapp_processString(
    JNIEnv* env,
    jobject /* this */,
    jstring javaString) {
    
    const char* cString = env->GetStringUTFChars(javaString, nullptr);
    
    // 使用 cString
    
    env->ReleaseStringUTFChars(javaString, cString);
}
```

### C++ 字符串 → Java 字符串

```cpp
extern "C" JNIEXPORT jstring JNICALL
Java_com_example_myapp_getString(
    JNIEnv* env,
    jobject /* this */) {
    
    std::string str = "Hello";
    return env->NewStringUTF(str.c_str());
}
```

## 六、数组处理

### 获取数组元素

```cpp
extern "C" JNIEXPORT jint JNICALL
Java_com_example_myapp_sumArray(
    JNIEnv* env,
    jobject /* this */,
    jintArray array) {
    
    jint* elements = env->GetIntArrayElements(array, nullptr);
    jsize length = env->GetArrayLength(array);
    
    jint sum = 0;
    for (int i = 0; i < length; i++) {
        sum += elements[i];
    }
    
    env->ReleaseIntArrayElements(array, elements, 0);
    return sum;
}
```

## 七、调用 Java 方法

### 获取类和方法

```cpp
extern "C" JNIEXPORT void JNICALL
Java_com_example_myapp_callJavaMethod(
    JNIEnv* env,
    jobject obj) {
    
    jclass clazz = env->GetObjectClass(obj);
    jmethodID method = env->GetMethodID(clazz, "javaMethod", "()V");
    
    env->CallVoidMethod(obj, method);
}
```

### 方法签名

| 类型 | 签名 |
|------|------|
| void | V |
| boolean | Z |
| byte | B |
| char | C |
| short | S |
| int | I |
| long | J |
| float | F |
| double | D |
| String | Ljava/lang/String; |

## 八、动态注册

### JNI_OnLoad

```cpp
static JNINativeMethod methods[] = {
    {"stringFromJNI", "()Ljava/lang/String;", (void*)stringFromJNI},
    {"add", "(II)I", (void*)add}
};

jint JNI_OnLoad(JavaVM* vm, void* reserved) {
    JNIEnv* env;
    if (vm->GetEnv((void**)&env, JNI_VERSION_1_6) != JNI_OK) {
        return JNI_ERR;
    }
    
    jclass clazz = env->FindClass("com/example/myapp/NativeLib");
    env->RegisterNatives(clazz, methods, sizeof(methods) / sizeof(methods[0]));
    
    return JNI_VERSION_1_6;
}
```

## 九、性能优化

### 1. 减少 JNI 调用

```cpp
// ❌ 错误：频繁调用 JNI
for (int i = 0; i < 1000; i++) {
    env->CallVoidMethod(obj, method, i);
}

// ✅ 正确：批量处理
processBatch(env, obj, data, 1000);
```

### 2. 缓存 JNI 引用

```cpp
static jmethodID gMethod = nullptr;

void init(JNIEnv* env, jclass clazz) {
    gMethod = env->GetMethodID(clazz, "method", "()V");
}
```

### 3. 使用直接缓冲区

```cpp
jobject buffer = env->NewDirectByteBuffer(data, size);
```

## 十、调试技巧

### 日志输出

```cpp
#include <android/log.h>

#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, "Native", __VA_ARGS__)

LOGD("Value: %d", value);
```

### 检查异常

```cpp
if (env->ExceptionCheck()) {
    env->ExceptionDescribe();
    env->ExceptionClear();
}
```

## 学习资源

- [Get started with the NDK | Android Developers](https://developer.android.com/ndk/guides/)
- [Android NDK开发实战：JNI调用与性能优化技巧](https://www.zhifeiya.cn/post/2026/1/24/d5433e42)
- [Ndk 系列：Jni 从入门到实践](https://zhuanlan.zhihu.com/p/547250316)

---

*持续学习中...*
