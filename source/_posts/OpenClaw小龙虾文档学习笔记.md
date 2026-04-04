---
title: OpenClaw小龙虾文档学习笔记
date: 2026-04-03 23:01:00
tags: [OpenClaw, 小龙虾, AI Agent, 自动化]
categories: 工具学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

OpenClaw（小龙虾）是一个多通道网关，连接 WhatsApp、Telegram、Discord、iMessage 等聊天应用到 AI 编码代理。自托管，运行在你自己的硬件上，支持多代理路由、技能系统、自动化等功能。

## OpenClaw 核心概念

### 什么是 OpenClaw？

- **自托管**：运行在你自己的硬件上，你的规则
- **多通道**：一个 Gateway 同时服务 WhatsApp、Telegram、Discord 等
- **Agent-native**：为编码代理构建，支持工具使用、会话、内存和多代理路由
- **开源**：MIT 许可，社区驱动

### 架构

```
Chat apps + plugins --> Gateway --> Pi agent
                           --> CLI
                           --> Web Control UI
                           --> macOS app
                           --> iOS and Android nodes
```

---

## 一、Multi-Agent Routing（多代理路由）

### 什么是 Agent？

一个 **agent** 是一个完全独立的大脑，有自己的：

- **Workspace**（工作区）：文件、AGENTS.md/SOUL.md/USER.md
- **State directory**（状态目录）：auth profiles、model registry
- **Session store**（会话存储）：聊天历史 + 路由状态

### 路径映射

| 类型 | 路径 |
|------|------|
| Config | `~/.openclaw/openclaw.json` |
| Workspace | `~/.openclaw/workspace` |
| Agent dir | `~/.openclaw/agents/<agentId>/agent` |
| Sessions | `~/.openclaw/agents/<agentId>/sessions` |

### 创建新 Agent

```bash
openclaw agents add work
openclaw agents list --bindings
```

---

## 二、Sub-Agents（子代理）

### 什么是 Sub-Agent？

Sub-agents 是从现有 agent 运行中生成的后台 agent 运行。它们在自己的会话中运行，完成后会向请求者聊天频道宣布结果。

### 命令

```bash
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents spawn <agentId> <task> [--model <model>]
```

### 使用 sessions_spawn 工具

```json
{
  "task": "研究 Kotlin 协程",
  "label": "kotlin-coroutines",
  "model": "glm-5",
  "thinking": "medium"
}
```

### 目标

- 并行化"研究/长任务/慢工具"工作
- 保持子代理隔离
- 支持可配置的嵌套深度

---

## 三、Skills（技能系统）

### 技能加载位置和优先级

| 优先级 | 位置 |
|--------|------|
| 最高 | `<workspace>/skills` |
| 2 | `<workspace>/.agents/skills` |
| 3 | `~/.agents/skills` |
| 4 | `~/.openclaw/skills` |
| 5 | Bundled skills |
| 最低 | `skills.load.extraDirs` |

### Per-Agent vs Shared Skills

- **Per-agent skills**：`<workspace>/skills`，仅对该 agent 可见
- **Shared skills**：`~/.openclaw/skills`，对所有 agent 可见

### ClawHub

ClawHub 是公共技能注册表：https://clawhub.com

```bash
# 安装技能
openclaw skills install <skill-slug>

# 更新所有技能
openclaw skills update --all
```

### SKILL.md 格式

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

# 使用说明...
```

---

## 四、Cron Jobs（定时任务）

### 概述

Cron 是 Gateway 的内置调度器。Jobs 持久化在 `~/.openclaw/cron/`。

### 执行风格

| 风格 | 描述 |
|------|------|
| **Main session** | 在下一个心跳时运行 |
| **Isolated** | 在专用 agent turn 中运行 |
| **Current session** | 绑定到创建 cron 的会话 |
| **Custom session** | 在持久化命名会话中运行 |

### 创建定时任务

```bash
# 一次性任务
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the docs" \
  --wake now \
  --delete-after-run

# 周期性任务
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce
```

### 常用命令

```bash
openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

---

## 五、Hooks（钩子系统）

### 什么是 Hooks？

Hooks 提供了一个可扩展的事件驱动系统，用于自动化 agent 命令和事件的响应。

### Bundled Hooks

| Hook | 描述 |
|------|------|
| **session-memory** | 重置会话时保存上下文到内存 |
| **bootstrap-extra-files** | 注入额外的 workspace bootstrap 文件 |
| **command-logger** | 记录所有命令事件 |
| **boot-md** | Gateway 启动时运行 BOOT.md |

### 命令

```bash
openclaw hooks list
openclaw hooks enable session-memory
openclaw hooks check
openclaw hooks info session-memory
```

---

## 六、Memory（内存系统）

### 内存文件布局

| 文件 | 描述 |
|------|------|
| `memory/YYYY-MM-DD.md` | 每日日志（追加） |
| `MEMORY.md` | 精选的长期内存 |

### 内存工具

| 工具 | 描述 |
|------|------|
| `memory_search` | 语义召回 |
| `memory_get` | 针对性读取 |

### 何时写入内存

- 决策、偏好和持久事实 → `MEMORY.md`
- 日常笔记和运行上下文 → `memory/YYYY-MM-DD.md`
- 如果有人说"记住这个"，写下来

### 自动内存刷新

当会话接近自动压缩时，OpenClaw 会触发一个静默的 agent turn，提醒模型在上下文被压缩之前写入持久内存。

---

## 学习资源

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [ClawHub 技能市场](https://clawhub.com)
- [GitHub](https://github.com/openclaw/openclaw)

---

*持续学习中...*
