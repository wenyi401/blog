---
title: Android WebView与JSBridge交互学习
date: 2026-04-03 23:18:00
tags: [Android, WebView, JSBridge, JavaScript, Hybrid]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Hybrid 混合开发通过 WebView 承载 H5 业务，Native 提供基础能力，平衡了灵活性和性能。JSBridge 是实现 WebView 与 JavaScript 双向交互的核心技术。

## 一、WebView 基础配置

### WebSettings 配置

```kotlin
val webView: WebView = findViewById(R.id.webView)

webView.settings.apply {
    // 启用 JavaScript
    javaScriptEnabled = true
    
    // 启用 DOM 存储
    domStorageEnabled = true
    
    // 设置缓存模式
    cacheMode = WebSettings.LOAD_DEFAULT
    
    // 支持缩放
    setSupportZoom(true)
    builtInZoomControls = true
    
    // 自适应屏幕
    useWideViewPort = true
    loadWithOverviewMode = true
}
```

### WebViewClient 定制

```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
        // 拦截 URL 跳转
        return false
    }
    
    override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
        // 页面开始加载
        showLoading()
    }
    
    override fun onPageFinished(view: WebView, url: String) {
        // 页面加载完成
        hideLoading()
    }
}
```

## 二、JavaScript 调用 Android

### 方式一：addJavascriptInterface

```kotlin
class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    @JavascriptInterface
    fun getUserInfo(): String {
        return "{\"name\":\"Alice\",\"age\":25}"
    }
}

// 添加 JavaScript 接口
webView.addJavascriptInterface(WebAppInterface(this), "Android")

// JavaScript 调用
// Android.showToast("Hello from JS!")
```

### 方式二：WebViewClient 拦截

```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()
        
        // 拦截自定义协议
        if (url.startsWith("jsbridge://")) {
            handleJsBridge(url)
            return true
        }
        
        return false
    }
}

fun handleJsBridge(url: String) {
    // 解析 URL 参数并执行 Native 方法
    val uri = Uri.parse(url)
    val action = uri.host
    val params = uri.queryParameterNames
    // ...
}
```

## 三、Android 调用 JavaScript

### 方式一：loadUrl

```kotlin
// 调用无返回值的 JS 函数
webView.loadUrl("javascript:showMessage('Hello from Android!')")
```

### 方式二：evaluateJavascript

```kotlin
// 调用有返回值的 JS 函数
webView.evaluateJavascript("javascript:getUserInfo()") { result ->
    // 处理返回值
    Log.d("WebView", "Result: $result")
}
```

## 四、JSBridge 框架

### 定义 Handler

```kotlin
class JsBridge {
    private val handlers = mutableMapOf<String, BridgeHandler>()
    
    fun registerHandler(name: String, handler: BridgeHandler) {
        handlers[name] = handler
    }
    
    fun callHandler(name: String, data: String, callback: (String) -> Unit) {
        handlers[name]?.handle(data, callback)
    }
}

interface BridgeHandler {
    fun handle(data: String, callback: (String) -> Unit)
}
```

### 注册处理器

```kotlin
jsBridge.registerHandler("getUserInfo", object : BridgeHandler {
    override fun handle(data: String, callback: (String) -> Unit) {
        val userInfo = getUserInfo()
        callback(userInfo)
    }
})

jsBridge.registerHandler("openCamera", object : BridgeHandler {
    override fun handle(data: String, callback: (String) -> Unit) {
        openCamera()
        callback("{\"success\":true}")
    }
})
```

## 五、完整示例

### Android 端

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var jsBridge: JsBridge
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webView)
        jsBridge = JsBridge(webView)
        
        // 配置 WebView
        setupWebView()
        
        // 注册 JSBridge 处理器
        registerHandlers()
        
        // 加载页面
        webView.loadUrl("file:///android_asset/index.html")
    }
    
    private fun setupWebView() {
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(jsBridge, "JsBridge")
    }
    
    private fun registerHandlers() {
        jsBridge.registerHandler("getLocation") { data, callback ->
            val location = getLastLocation()
            callback(location)
        }
        
        jsBridge.registerHandler("takePhoto") { data, callback ->
            takePhoto()
            callback("{\"status\":\"success\"}")
        }
    }
}
```

### JavaScript 端

```javascript
// 调用 Native 方法
function getLocation() {
    JsBridge.callHandler('getLocation', '', function(response) {
        console.log('Location: ' + response);
    });
}

function takePhoto() {
    JsBridge.callHandler('takePhoto', '', function(response) {
        console.log('Photo result: ' + response);
    });
}

// 注册 JS 方法供 Native 调用
JsBridge.registerHandler('showMessage', function(data, callback) {
    alert(data);
    callback('Message shown');
});
```

## 六、安全注意事项

| 安全问题 | 解决方案 |
|----------|----------|
| **远程代码执行** | 仅加载可信来源 |
| **敏感信息泄露** | 限制 JavaScriptInterface 暴露的方法 |
| **URL 欺骗** | 验证 URL 来源 |
| **跨站脚本攻击** | 过滤输入参数 |

## 七、性能优化

1. **预加载 WebView**：提前初始化 WebView
2. **缓存策略**：合理使用缓存
3. **懒加载**：延迟加载非必要内容
4. **内存管理**：及时销毁 WebView

## 八、调试技巧

### 启用调试模式

```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true)
}
```

### Chrome DevTools

1. 连接设备
2. 打开 `chrome://inspect`
3. 选择 WebView 进行调试

## 学习资源

- [Access native APIs with JavaScript bridge](https://developer.android.com/develop/ui/views/layout/webapps/native-api-access-jsbridge)
- [Android-JsBridge - GitHub](https://github.com/wragony/Android-JsBridge)
- [WebView与Hybrid混合开发完全指南](https://blog.csdn.net/xwdrhgr/article/details/159736520)

---

*持续学习中...*
