---
title: Android插件化Hook技术学习
date: 2026-04-03 23:37:00
tags: [Android, 插件化, Hook, ClassLoader, 热更新]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Android 插件化是一种开发模式，允许动态加载和卸载 APK，实现模块化开发和热更新功能。Hook 技术是插件化的核心技术之一。

## 一、插件化原理

### 类加载机制

Android 插件化的核心原理基于 Java 的类加载机制：

```
BootClassLoader (启动类加载器)
    │
    ▼
PathClassLoader (应用类加载器)
    │
    ▼
DexClassLoader (动态类加载器)
```

### 双亲委托机制

```
加载类请求
    │
    ▼
检查是否已加载
    │
    ├── 已加载 → 返回
    │
    └── 未加载 → 委托父加载器
          │
          ▼
        父加载器无法加载
          │
          ▼
        自己加载
```

## 二、ClassLoader 详解

### PathClassLoader

```java
// 用于加载已安装 APK 的类
PathClassLoader pathClassLoader = new PathClassLoader(
    dexPath,    // dex 文件路径
    librarySearchPath,  // native 库路径
    parent      // 父加载器
);
```

### DexClassLoader

```java
// 用于加载未安装 APK 的类
DexClassLoader dexClassLoader = new DexClassLoader(
    dexPath,        // dex 文件路径
    optimizedDirectory,  // 优化后的 dex 存放目录
    librarySearchPath,   // native 库路径
    parent          // 父加载器
);
```

## 三、Hook 技术

### Hook 定义

Hook（钩子）是一种拦截和修改程序执行流程的技术，在插件化中用于：
- 替换系统对象
- 拦截方法调用
- 修改方法行为

### Hook 方式

| 方式 | 描述 |
|------|------|
| **反射** | 修改私有字段 |
| **动态代理** | 代理接口调用 |
| **Xposed** | 全局 Hook 框架 |
| **ASM** | 字节码修改 |

## 四、Hook ClassLoader

### 加载插件类

```java
public class PluginClassLoader extends PathClassLoader {
    
    public Class<?> loadPluginClass(String className) {
        try {
            // 先检查是否已加载
            Class<?> clazz = findLoadedClass(className);
            if (clazz != null) {
                return clazz;
            }
            
            // 从插件 dex 中加载
            return findClass(className);
        } catch (ClassNotFoundException e) {
            // 委托给父加载器
            return super.loadClass(className, false);
        }
    }
}
```

### 合并 Dex

```java
// 将插件 dex 合并到宿主
public void combineDex(ClassLoader hostClassLoader, String pluginDexPath) {
    Object pathList = getField(hostClassLoader, "pathList");
    Object[] pluginDexElements = makeDexElements(pluginDexPath);
    Object[] hostDexElements = (Object[]) getField(pathList, "dexElements");
    
    // 合并数组
    Object[] combined = combineArrays(hostDexElements, pluginDexElements);
    setField(pathList, "dexElements", combined);
}
```

## 五、Hook Activity 启动

### AMS Hook

```java
// Hook IActivityManager
public void hookAMS() {
    Object gDefault = getField(null, "android.app.ActivityManager", "IActivityManagerSingleton");
    Object rawIActivityManager = getField(gDefault, "mInstance");
    
    Object proxy = Proxy.newProxyInstance(
        rawIActivityManager.getClass().getClassLoader(),
        new Class<?>[] { Class.forName("android.app.IActivityManager") },
        new IActivityManagerProxy(rawIActivityManager)
    );
    
    setField(gDefault, "mInstance", proxy);
}
```

### 代理类

```java
public class IActivityManagerProxy implements InvocationHandler {
    private Object mOrigin;
    
    public IActivityManagerProxy(Object origin) {
        mOrigin = origin;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if ("startActivity".equals(method.getName())) {
            // 替换为占位 Activity
            replaceActivity(args);
        }
        return method.invoke(mOrigin, args);
    }
}
```

## 六、插件化框架对比

| 框架 | 特点 |
|------|------|
| **DroidPlugin** | 完全 Hook，支持四大组件 |
| **RePlugin** | 百度出品，性能优秀 |
| **VirtualAPK** | 滴滴出品，功能完整 |
| **Shadow** | 腾讯出品，零反射实现 |

## 七、资源加载

### AssetManager Hook

```java
public void addAssetPath(String pluginPath) {
    AssetManager assetManager = AssetManager.class.newInstance();
    Method addAssetPath = AssetManager.class.getMethod("addAssetPath", String.class);
    addAssetPath.invoke(assetManager, pluginPath);
    
    Resources resources = new Resources(
        assetManager,
        context.getResources().getDisplayMetrics(),
        context.getResources().getConfiguration()
    );
}
```

## 八、生命周期管理

### 代理 Activity

```java
public class ProxyActivity extends Activity {
    private PluginActivity mPluginActivity;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        String className = getIntent().getStringExtra("className");
        try {
            Class<?> clazz = mPluginClassLoader.loadClass(className);
            mPluginActivity = (PluginActivity) clazz.newInstance();
            mPluginActivity.attach(this);
            mPluginActivity.onCreate(savedInstanceState);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 九、签名问题

### PMS Hook

```java
// Hook PackageManagerService
public void hookPMS() {
    Object gDefault = getField(null, "android.app.ActivityThread", "sPackageManager");
    
    Object proxy = Proxy.newProxyInstance(
        gDefault.getClass().getClassLoader(),
        new Class<?>[] { Class.forName("android.content.pm.IPackageManager") },
        new IPackageManagerProxy(gDefault)
    );
    
    setField(null, "android.app.ActivityThread", "sPackageManager", proxy);
}
```

## 十、最佳实践

1. **选择合适框架**：根据需求选择插件化框架
2. **理解 Hook 原理**：深入理解类加载和 Hook 机制
3. **处理兼容性**：Android 版本差异处理
4. **资源管理**：正确加载和管理插件资源
5. **生命周期**：正确处理插件组件生命周期

## 学习资源

- [Android插件化技术详解](https://cloud.tencent.com/developer/article/2250321)
- [插件化框架原理与实现](https://blog.csdn.net/xwdrhgr/article/details/158538042)
- [Android插件化原理与方案详解](https://jishuzhan.net/article/2000133376926351361)

---

*持续学习中...*
