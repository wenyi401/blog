---
title: Android CameraX相机开发实战
date: 2026-04-03 23:52:00
tags: [Android, CameraX, 相机, 拍照]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

CameraX 是一个 Jetpack 库，旨在帮助您更轻松地开发相机应用。它提供了一个一致且易于使用的 API，该 API 适用于绝大多数 Android 设备，并向后兼容 Android 5.0（API 级别 21）。

## 一、添加依赖

```gradle
dependencies {
    val camerax_version = "1.4.1"
    implementation("androidx.camera:camera-core:${camerax_version}")
    implementation("androidx.camera:camera-camera2:${camerax_version}")
    implementation("androidx.camera:camera-lifecycle:${camerax_version}")
    implementation("androidx.camera:camera-view:${camerax_version}")
}
```

## 二、添加权限

```xml
<uses-feature android:name="android.hardware.camera.any" />
<uses-permission android:name="android.permission.CAMERA" />
```

## 三、初始化相机

### 获取 ProcessCameraProvider

```kotlin
private lateinit var cameraProvider: ProcessCameraProvider

private fun startCamera() {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
    
    cameraProviderFuture.addListener({
        cameraProvider = cameraProviderFuture.get()
        bindCameraUseCases()
    }, ContextCompat.getMainExecutor(this))
}
```

## 四、绑定用例

### 预览用例

```kotlin
private var preview: Preview? = null
private var camera: Camera? = null

private fun bindCameraUseCases() {
    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
    
    preview = Preview.Builder()
        .build()
        .also {
            it.setSurfaceProvider(viewFinder.surfaceProvider)
        }
    
    cameraProvider.unbindAll()
    camera = cameraProvider.bindToLifecycle(
        this, cameraSelector, preview
    )
}
```

### 拍照用例

```kotlin
private var imageCapture: ImageCapture? = null

private fun bindCameraUseCases() {
    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
    
    preview = Preview.Builder().build()
    
    imageCapture = ImageCapture.Builder()
        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
        .build()
    
    cameraProvider.unbindAll()
    camera = cameraProvider.bindToLifecycle(
        this, cameraSelector, preview, imageCapture
    )
}
```

### 拍照

```kotlin
private fun takePhoto() {
    val imageCapture = imageCapture ?: return
    
    val photoFile = File(
        outputDirectory,
        SimpleDateFormat(FILENAME_FORMAT, Locale.US)
            .format(System.currentTimeMillis()) + ".jpg"
    )
    
    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
    
    imageCapture.takePicture(
        outputOptions,
        ContextCompat.getMainExecutor(this),
        object : ImageCapture.OnImageSavedCallback {
            override fun onError(exc: ImageCaptureException) {
                Log.e(TAG, "Photo capture failed: ${exc.message}")
            }
            
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                val savedUri = Uri.fromFile(photoFile)
                Log.d(TAG, "Photo capture succeeded: $savedUri")
            }
        }
    )
}
```

## 五、切换摄像头

```kotlin
private var lensFacing = CameraSelector.LENS_FACING_BACK

private fun switchCamera() {
    lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
        CameraSelector.LENS_FACING_FRONT
    } else {
        CameraSelector.LENS_FACING_BACK
    }
    
    bindCameraUseCases()
}
```

## 六、闪光灯控制

```kotlin
private fun enableFlash(enabled: Boolean) {
    camera?.cameraControl?.enableTorch(enabled)
}
```

## 七、缩放控制

```kotlin
private fun setZoom(ratio: Float) {
    camera?.cameraControl?.setLinearZoom(ratio)
}
```

## 八、对焦控制

```kotlin
private fun focusOnPoint(x: Float, y: Float) {
    val point = MeteringPointFactory.createPoint(x, y)
    val action = FocusMeteringAction.Builder(point).build()
    camera?.cameraControl?.startFocusAndMetering(action)
}
```

## 九、视频录制

```kotlin
private var videoCapture: VideoCapture<Recorder>? = null

private fun bindVideoCapture() {
    val recorder = Recorder.Builder()
        .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
        .build()
    
    videoCapture = VideoCapture.withOutput(recorder)
    
    cameraProvider.bindToLifecycle(
        this, cameraSelector, preview, videoCapture
    )
}

private fun startRecording() {
    val mediaStoreOutput = MediaStoreOutputOptions
        .Builder(contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
        .setContentValues(ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, "video_${System.currentTimeMillis()}")
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
        })
        .build()
    
    currentRecording = videoCapture?.output
        ?.prepareRecording(this, mediaStoreOutput)
        ?.start(ContextCompat.getMainExecutor(this)) { recordEvent ->
            when (recordEvent) {
                is VideoRecordEvent.Start -> {
                    Log.d(TAG, "Recording started")
                }
                is VideoRecordEvent.Finalize -> {
                    if (!recordEvent.hasError()) {
                        Log.d(TAG, "Recording saved: ${recordEvent.outputResults.outputUri}")
                    }
                }
            }
        }
}
```

## 十、最佳实践

1. **生命周期感知**：绑定到生命周期
2. **权限检查**：运行时权限请求
3. **异常处理**：处理相机不可用情况
4. **资源释放**：及时释放相机资源
5. **内存管理**：避免内存泄漏

## 学习资源

- [CameraX 概览 | Android Developers](https://developer.android.google.cn/media/camera/camerax?hl=zh-cn)
- [Android Jetpack CameraX实战](https://www.zhifeiya.cn/post/2026/3/12/363c91a6)
- [Compose-Native CameraX in 2026](https://proandroiddev.com/compose-native-camerax-in-2026-the-complete-guide-bf36c76a78e9)

---

*持续学习中...*
