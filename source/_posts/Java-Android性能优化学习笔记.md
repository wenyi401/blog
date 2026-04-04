---
title: Java Android性能优化学习笔记
date: 2026-04-03 22:48:00
tags: [Java, Android, 性能优化, 内存管理]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Android 性能优化是高级开发者必须掌握的技能。本文将从内存管理、UI 渲染、启动速度、网络请求、电池消耗、包体积等核心领域全面介绍 Android 性能优化。

## 性能优化维度

| 维度 | 描述 |
|------|------|
| **内存优化** | 防止内存泄漏，优化内存使用 |
| **UI 渲染** | 提高界面流畅度，减少卡顿 |
| **启动速度** | 优化冷启动和热启动时间 |
| **网络请求** | 减少请求次数，优化数据传输 |
| **电池消耗** | 降低耗电量，延长续航 |
| **包体积** | 减小 APK 大小 |

---

## 一、内存优化

### 1. 内存泄漏常见场景

#### 静态变量持有 Context

```java
// ❌ 错误：静态变量持有 Activity 引用
public class Utils {
    private static Context context;
    
    public static void init(Context ctx) {
        context = ctx; // 内存泄漏！
    }
}

// ✅ 正确：使用 Application Context
public class Utils {
    private static Context context;
    
    public static void init(Context ctx) {
        context = ctx.getApplicationContext();
    }
}
```

#### 匿名内部类持有外部类引用

```java
// ❌ 错误：Handler 导致内存泄漏
public class MainActivity extends Activity {
    private Handler handler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            // 持有 Activity 引用
        }
    };
}

// ✅ 正确：使用静态内部类 + 弱引用
public class MainActivity extends Activity {
    private static class SafeHandler extends Handler {
        private final WeakReference<MainActivity> activityRef;
        
        SafeHandler(MainActivity activity) {
            activityRef = new WeakReference<>(activity);
        }
        
        @Override
        public void handleMessage(Message msg) {
            MainActivity activity = activityRef.get();
            if (activity != null) {
                // 处理消息
            }
        }
    }
}
```

### 2. 内存分析工具

| 工具 | 用途 |
|------|------|
| **Android Profiler** | 实时内存监控 |
| **LeakCanary** | 自动检测内存泄漏 |
| **MAT** | 内存快照分析 |

### 3. 内存优化技巧

```java
// 使用 SparseArray 替代 HashMap<Integer, Object>
SparseArray<String> array = new SparseArray<>();
array.put(1, "Hello");

// 使用 ArrayMap 替代 HashMap（少量数据时）
ArrayMap<String, String> map = new ArrayMap<>();

// 及时回收 Bitmap
if (bitmap != null && !bitmap.isRecycled()) {
    bitmap.recycle();
    bitmap = null;
}
```

---

## 二、UI 渲染优化

### 1. 布局优化

```xml
<!-- 使用 ConstraintLayout 减少布局层级 -->
<androidx.constraintlayout.widget.ConstraintLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    
    <!-- 避免过度嵌套 -->
    
</androidx.constraintlayout.widget.ConstraintLayout>

<!-- 使用 ViewStub 延迟加载 -->
<ViewStub
    android:id="@+id/stub"
    android:layout="@layout/extra_layout"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content" />
```

### 2. RecyclerView 优化

```java
// 使用 ViewHolder 模式
public class MyAdapter extends RecyclerView.Adapter<MyViewHolder> {
    
    @Override
    public void onBindViewHolder(@NonNull MyViewHolder holder, int position) {
        // 避免在 onBindViewHolder 中创建对象
        // 使用 DiffUtil 优化刷新
    }
    
    // 设置缓存大小
    // recyclerView.setItemViewCacheSize(20);
}

// 使用 DiffUtil
DiffUtil.DiffResult diffResult = DiffUtil.calculateDiff(new MyDiffCallback(oldList, newList));
diffResult.dispatchUpdatesTo(adapter);
```

### 3. 避免过度绘制

```java
// 在开发者选项中开启"调试 GPU 过度绘制"
// 优化：移除不必要的背景
view.setBackground(null);
```

---

## 三、启动速度优化

### 1. 冷启动优化

```java
// 在 Application 中延迟初始化
public class MyApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // 延迟初始化非必要组件
        new Thread(() -> {
            // 初始化第三方 SDK
        }).start();
    }
}

// 使用 App Startup 库
dependencies {
    implementation "androidx.startup:startup-runtime:1.1.1"
}
```

### 2. Activity 启动优化

```java
// 避免在 onCreate 中执行耗时操作
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
    
    // 使用异步加载
    new LoadDataTask().execute();
}
```

---

## 四、网络请求优化

### 1. 图片加载优化

```java
// 使用 Glide 加载图片
Glide.with(context)
    .load(url)
    .placeholder(R.drawable.placeholder)
    .error(R.drawable.error)
    .override(800, 600) // 指定大小
    .into(imageView);
```

### 2. 网络缓存

```java
// OkHttp 缓存
int cacheSize = 10 * 1024 * 1024; // 10 MB
Cache cache = new Cache(cacheDir, cacheSize);

OkHttpClient client = new OkHttpClient.Builder()
    .cache(cache)
    .build();
```

---

## 五、电池消耗优化

### 1. 减少后台操作

```java
// 使用 WorkManager 调度后台任务
WorkManager.getInstance(context)
    .enqueue(new OneTimeWorkRequest.Builder(MyWorker.class)
        .setConstraints(new Constraints.Builder()
            .setRequiresBatteryNotLow(true)
            .build())
        .build());
```

### 2. 优化定位请求

```java
// 使用合适的定位精度
LocationRequest request = new LocationRequest();
request.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);
request.setInterval(60000); // 1 分钟更新一次
```

---

## 六、包体积优化

### 1. 资源优化

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### 2. So 文件优化

```gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a'
        }
    }
}
```

---

## 性能分析工具

| 工具 | 用途 |
|------|------|
| **Android Profiler** | CPU、内存、网络分析 |
| **Systrace** | 系统级性能分析 |
| **Layout Inspector** | 布局层级分析 |
| **APK Analyzer** | APK 体积分析 |

---

## 学习资源

- [Android 性能优化全面指南](https://juejin.cn/post/7483127098352254987)
- [Awesome-Android-Performance](https://github.com/JsonChao/Awesome-Android-Performance)
- [Android 性能优化官方指南](https://developer.android.google.cn/topic/performance?hl=zh-cn)

## 下一步

- 深入学习内存泄漏检测工具
- 实践 UI 渲染优化
- 研究 Jetpack Compose 性能优化

---

*持续学习中...*
