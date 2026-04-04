---
title: Android IPC Binder进程间通信学习
date: 2026-04-03 23:20:00
tags: [Android, IPC, Binder, AIDL, 进程通信]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Binder 是 Android 系统中高效的跨进程通信（IPC）机制，它将运行在不同进程中的组件进行绑定，实现彼此通信。Binder 支撑着 Android 四大组件的调度与系统服务调用。

## 一、IPC 基本概念

### 为什么需要 IPC？

- **进程隔离**：Android 每个应用运行在独立进程中
- **安全考虑**：进程间内存不共享
- **资源共享**：需要跨进程传递数据和调用方法

### IPC 方式对比

| 方式 | 描述 | 适用场景 |
|------|------|----------|
| **Intent** | 简单数据传递 | 四大组件通信 |
| **Binder** | 高效进程间通信 | 复杂数据交互 |
| **AIDL** | Binder 的简化封装 | 定义跨进程接口 |
| **Messenger** | 基于消息队列 | 低并发场景 |
| **ContentProvider** | 数据共享 | 跨进程数据访问 |
| **Socket** | 网络通信 | 跨设备通信 |

## 二、Binder 概述

### 什么是 Binder？

Binder 是一种进程间通信系统，让两个进程在 Android 设备上通信。Binder 提供了一种完全透明的方式在另一个进程中执行函数调用。

### Binder 角色

| 角色 | 描述 |
|------|------|
| **Client** | 调用进程 |
| **Server** | 被调用进程 |
| **Binder Proxy** | 客户端端点 |
| **Binder Stub** | 服务端端点 |
| **Binder Driver** | 内核驱动 |

### Binder 优势

- **一次拷贝**：数据只需拷贝一次，高效
- **安全权限**：支持 UID/PID 验证
- **面向对象**：透明的远程调用

## 三、AIDL 使用

### 定义 AIDL 接口

```aidl
// IRemoteService.aidl
package com.example;

interface IRemoteService {
    int getPid();
    void basicTypes(int anInt, long aLong, boolean aBoolean, 
                    float aFloat, double aDouble, String aString);
}
```

### 实现服务端

```kotlin
class RemoteService : Service() {
    
    private val binder = object : IRemoteService.Stub() {
        override fun getPid(): Int {
            return Process.myPid()
        }
        
        override fun basicTypes(anInt: Int, aLong: Long, aBoolean: Boolean,
                               aFloat: Float, aDouble: Double, aString: String) {
            // 处理基本类型
        }
    }
    
    override fun onBind(intent: Intent): IBinder {
        return binder
    }
}
```

### 客户端绑定

```kotlin
class MainActivity : AppCompatActivity() {
    
    private var remoteService: IRemoteService? = null
    
    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, service: IBinder) {
            remoteService = IRemoteService.Stub.asInterface(service)
            try {
                val pid = remoteService?.pid
                Log.d("IPC", "Remote PID: $pid")
            } catch (e: RemoteException) {
                e.printStackTrace()
            }
        }
        
        override fun onServiceDisconnected(name: ComponentName) {
            remoteService = null
        }
    }
    
    override fun onStart() {
        super.onStart()
        val intent = Intent(this, RemoteService::class.java)
        bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }
    
    override fun onStop() {
        super.onStop()
        unbindService(connection)
    }
}
```

## 四、AIDL 数据类型

### 支持的类型

| 类型 | 描述 |
|------|------|
| **基本类型** | int, long, boolean, float, double, String |
| **List** | 泛型参数必须是支持的类型 |
| **Map** | 泛型参数必须是支持的类型 |
| **Parcelable** | 实现了 Parcelable 的自定义类 |
| **AIDL 接口** | 其他 AIDL 定义 |

### Parcelable 实现

```kotlin
@Parcelize
data class User(
    val id: Int,
    val name: String,
    val email: String
) : Parcelable
```

### AIDL 中使用 Parcelable

```aidl
// User.aidl
package com.example;
parcelable User;

// IRemoteService.aidl
package com.example;
import com.example.User;

interface IRemoteService {
    User getUser(int id);
    void setUser(User user);
}
```

## 五、Binder 原理

### 通信流程

```
Client                        Binder Driver                      Server
   │                               │                                │
   │ ── transact() ────────────────>│                                │
   │                               │ ── onTransact() ───────────────>│
   │                               │                                │
   │                               │ <── return result ─────────────│
   │ <── return result ────────────│                                │
```

### 一次拷贝原理

传统 IPC 需要两次拷贝：
1. 用户空间 → 内核空间
2. 内核空间 → 目标进程用户空间

Binder 只需一次拷贝：
1. 通过 mmap 共享内存，直接写入目标进程空间

## 六、多进程注意事项

### Application 多次创建

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // 每个进程都会调用
        Log.d("MyApp", "Process: ${Process.myPid()}")
    }
}
```

### SharedPreferences 跨进程

```kotlin
// 不推荐：跨进程不安全
val prefs = getSharedPreferences("data", MODE_PRIVATE)

// 推荐：使用 ContentProvider 或 MODE_MULTI_PROCESS
```

### 单例模式

```kotlin
// 每个进程都有独立的单例实例
object Singleton {
    var data: String = ""
}
```

## 七、调试技巧

### 查看 Binder 状态

```bash
# 查看 Binder 线程池
adb shell cat /proc/<pid>/status

# 查看 Binder 调用
adb shell dumpsys activity services <package_name>
```

### 监控 Binder 调用

```kotlin
class LoggingBinder : Binder() {
    override fun onTransact(code: Int, data: Parcel, reply: Parcel?, flags: Int): Boolean {
        Log.d("Binder", "onTransact: code=$code")
        return super.onTransact(code, data, reply, flags)
    }
}
```

## 八、最佳实践

1. **异步调用**：避免阻塞 UI 线程
2. **异常处理**：捕获 RemoteException
3. **连接管理**：及时绑定和解绑
4. **权限控制**：使用 permission 保护服务
5. **数据限制**：避免传输大数据

## 学习资源

- [Binder overview - Android Open Source Project](https://source.android.com/docs/core/architecture/ipc/binder-overview)
- [循序渐进 Android Binder（一）](https://zhuanlan.zhihu.com/p/1913005193198543940)
- [Android跨进程通信：Binder 进程间通信机制解析](https://developer.cloud.tencent.com/article/2595944)

---

*持续学习中...*
