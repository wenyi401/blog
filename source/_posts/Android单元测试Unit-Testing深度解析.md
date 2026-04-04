---
title: Android单元测试Unit Testing深度解析
date: 2026-04-04 07:20:00
tags: [Android, Testing, Unit Test, JUnit, Mockito]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

本地单元测试直接在工作站上运行，使用 JVM 而非 Android 设备。处理速度快，但无法与 Android 框架交互。

## 一、测试位置

默认位置：`module-name/src/test/`

## 二、添加依赖

```gradle
dependencies {
    testImplementation "junit:junit:$jUnitVersion"
    testImplementation "androidx.test:core:$androidXTestVersion"
    testImplementation "org.mockito:mockito-core:$mockitoVersion"
    testImplementation "org.mockito.kotlin:mockito-kotlin:$mockitoKotlinVersion"
}
```

## 三、创建测试类

```kotlin
import org.junit.Assert.assertTrue
import org.junit.Test

class EmailValidatorTest {
    @Test
    fun emailValidator_CorrectEmailSimple_ReturnsTrue() {
        assertTrue(EmailValidator.isValidEmail("name@email.com"))
    }
}
```

## 四、模拟 Android 依赖

```kotlin
@RunWith(MockitoJUnitRunner::class)
class MockedContextTest {
    
    @Mock
    private lateinit var mockContext: Context
    
    @Test
    fun readStringFromContext_LocalizedString() {
        val mockContext = mock<Context> {
            on { getString(R.string.name_label) } doReturn "HELLO WORLD"
        }
        
        val myObjectUnderTest = ClassUnderTest(mockContext)
        val result = myObjectUnderTest.getName()
        
        assertEquals(result, "HELLO WORLD")
    }
}
```

## 五、最佳实践

### 1. 可读的测试方法名

```kotlin
@Test
fun emailValidator_emptyEmail_returnsFalse() { }
```

### 2. 使用断言库

- JUnit Assert
- Hamcrest
- Truth

### 3. 测试替身

- Mock：模拟行为
- Stub：返回预设值
- Fake：简化实现

## 学习资源

- [构建本地单元测试 | Android Developers](https://developer.android.google.cn/training/testing/local-tests?hl=zh-cn)
- [测试替身 | Android Developers](https://developer.android.google.cn/training/testing/fundamentals/test-doubles?hl=zh-cn)

---

*深入学习中...*
