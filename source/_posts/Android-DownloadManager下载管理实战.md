---
title: Android DownloadManager下载管理实战
date: 2026-04-03 23:52:00
tags: [Android, DownloadManager, 下载]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

DownloadManager 是 Android 系统自带的下载服务，应用被杀死也不会影响下载，适合大文件下载场景。

## 一、添加权限

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## 二、创建下载请求

```kotlin
private fun startDownload(url: String) {
    val request = DownloadManager.Request(Uri.parse(url))
        .setTitle("文件下载")
        .setDescription("正在下载...")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "file.zip")
    
    val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
    val downloadId = downloadManager.enqueue(request)
}
```

## 三、查询下载进度

```kotlin
private fun queryDownloadProgress(downloadId: Long) {
    val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
    val query = DownloadManager.Query().setFilterById(downloadId)
    
    val cursor = downloadManager.query(query)
    if (cursor.moveToFirst()) {
        val bytesDownloaded = cursor.getLong(
            cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
        )
        val bytesTotal = cursor.getLong(
            cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
        )
        
        val progress = (bytesDownloaded * 100 / bytesTotal).toInt()
        cursor.close()
    }
}
```

## 学习资源

- [Android 基于 DownloadManager 实现文件下载](https://juejin.cn/post/7382386911197298707)
- [Android开发 下载管理器DownloadManager详解](https://www.cnblogs.com/guanxinjing/p/13299949.html)

---

*持续学习中...*
