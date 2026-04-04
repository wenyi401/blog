---
title: Android Media3 ExoPlayer音视频播放实战
date: 2026-04-03 23:52:00
tags: [Android, ExoPlayer, Media3, 音视频]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Media3 ExoPlayer 是 Google 推出的新一代媒体处理框架，相比 MediaPlayer 更强大、更灵活。

## 一、添加依赖

```gradle
dependencies {
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-ui:1.4.1")
}
```

## 二、创建播放器

```kotlin
private lateinit var player: ExoPlayer

private fun initializePlayer() {
    player = ExoPlayer.Builder(this).build()
    playerView.player = player
    
    val mediaItem = MediaItem.fromUrl("https://example.com/video.mp4")
    player.setMediaItem(mediaItem)
    player.prepare()
    player.playWhenReady = true
}

override fun onStop() {
    super.onStop()
    player.release()
}
```

## 三、播放控制

```kotlin
// 播放/暂停
player.playWhenReady = !player.playWhenReady

// 跳转
player.seekTo(positionMs)

// 倍速播放
player.setPlaybackSpeed(1.5f)
```

## 学习资源

- [Media3 ExoPlayer | Android Developers](https://developer.android.com/media/media3/exoplayer)
- [Android Media3 ExoPlayer 开发全攻略](https://blog.csdn.net/g984160547/article/details/146093650)

---

*持续学习中...*
