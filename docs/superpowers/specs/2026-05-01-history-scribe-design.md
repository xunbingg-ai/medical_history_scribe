# History Scribe — 设计规格文档

## 概述

一款面向医学生和年轻医生的 Web 应用。用户录制问诊对话 → 语音转文字 → AI 整理为结构化病历 → 一键复制。简约移动端优先设计，支持中英文切换。

## 技术栈

- **纯静态 Web 应用**：Vanilla HTML/CSS/JS，零依赖，零构建
- **语音转文字**：浏览器内置 Web Speech API（免费）
- **AI 接口**：用户自填 API Key，默认 DeepSeek（OpenAI 兼容格式）
- **部署**：任意静态服务器（GitHub Pages / Vercel / 本地打开均可）
- **数据存储**：localStorage（API Key、语言偏好等设置）

## 文件结构

```
history-scribe/
├── index.html    — 主页面，包含所有 UI 状态
├── app.js        — 核心逻辑（录音控制、API 调用、状态切换）
├── style.css     — 全部样式（简约移动端风格）
├── i18n.js       — 中英文文本映射表
└── prompts.js    — AI System Prompt 模板（中/英）
```

共 5 个文件，可直接在浏览器打开或部署到任意静态服务器。

## UI 设计

### 单页面，4 个状态

同一页面内切换状态，共享顶栏（标题 + 语言切换按钮）：

| 状态 | 内容 | 用户操作 |
|------|------|---------|
| 1. 待机 | 麦克风图标 + "点击开始录音" | 点击麦克风开始 |
| 2. 录音中 | 红色脉冲图标 + 计时器 + 实时转写文字 | 点击停止按钮 |
| 3. 处理中 | 加载动画 + "正在转录整理..." | 等待 |
| 4. 结果展示 | 结构化病历卡片 + 复制按钮 + 重新录制按钮 | 复制 or 录制新的 |

### 语言切换

- 顶栏右侧「中 / EN」切换按钮，全局生效
- 切换后：UI 文字 + AI 输出病历语言同步切换
- 中文 → 病历输出中文
- English → medical record output in English
- 语言偏好存入 localStorage

### 颜色与风格

- 简约风格，移动端优先
- 主色调：白底 + 蓝色强调（#3498db）
- 录音状态：红色（#e74c3c）
- 最大宽度 480px，移动端全宽，桌面端居中

## 设置面板

从主界面设置按钮打开（弹出层或侧边面板）。所有配置存 localStorage。

### 配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| AI 提供商 | DeepSeek (OpenAI 格式) | 下拉选择，选项包括：DeepSeek (OpenAI 格式)、DeepSeek (Anthropic 格式)、Anthropic (Claude)、OpenAI (GPT-4o)、OpenAI 兼容接口 (自定义) |
| API Key | （空） | 用户填入自己的 Key |
| 模型 | deepseek-v4-flash | 可修改 |
| Base URL | https://api.deepseek.com | 随提供商自动切换，可手动编辑 |
| 语音识别语言 | 中文（自动检测） | 中文 / English 选项 |

### 提供商切换逻辑

- **DeepSeek (OpenAI 格式)**：Base URL = `https://api.deepseek.com`，调用 `/v1/chat/completions`
- **DeepSeek (Anthropic 格式)**：Base URL = `https://api.deepseek.com/anthropic`，调用 `/v1/messages`
- **Anthropic (Claude)**：默认 Base URL = `https://api.anthropic.com`，调用 `/v1/messages`
- **OpenAI**：默认 Base URL = `https://api.openai.com`，调用 `/v1/chat/completions`
- **自定义**：Base URL 由用户填写，按 OpenAI Chat Completions 格式调用

选择提供商时 Base URL 自动更新，用户仍可手动修改。

## 数据流

```
[用户点击录音] → Web Speech API 开始监听
     ↓
[实时转写文字同步显示]
     ↓
[用户停止录音] → 获得完整文字稿
     ↓
[构造请求] → System Prompt（含病历格式 + 语言指令）+ 文字稿
     ↓
[POST {base_url}/v1/chat/completions] 或 [POST {base_url}/v1/messages]
     ↓
[解析 AI 回复] → 渲染到病历卡片
     ↓
[用户点击复制] → navigator.clipboard.writeText()
```

### AI 调用细节

- OpenAI 格式（DeepSeek OpenAI、OpenAI、自定义）：使用 `/v1/chat/completions` 端点，`messages` 数组，`system` + `user` 角色
- Anthropic 格式（DeepSeek Anthropic、Anthropic）：使用 `/v1/messages` 端点，`system` 独立字段，`messages` 中只用 `user` 角色
- Temperature 设为 0.3（保证结构化输出的一致性）
- 响应解析：优先提取 JSON，回退到纯文本

## 病历输出格式（8 项）

无论中文还是英文，AI 必须按以下结构输出：

| 中文 | English |
|------|---------|
| 主诉 | Chief Complaint |
| 现病史 | History of Present Illness |
| 既往史 | Past Medical History |
| 系统回顾 | Review of Systems |
| 个人史 | Personal History |
| 家族史 | Family History |
| 药物及过敏史 | Medication & Allergy History |
| 月经及生育史 | Menstrual & Obstetric History |

## 错误处理

| 场景 | 处理 |
|------|------|
| 麦克风权限被拒绝 | 提示"请开启浏览器麦克风权限" |
| 浏览器不支持 Web Speech | 提示"请使用 Chrome 或 Edge 浏览器" |
| API Key 未配置 | 提示"请先在设置中填入 API Key" |
| API 401（Key 无效） | 提示"API Key 无效，请检查设置" |
| API 429（限流） | 提示"请求过于频繁，请稍后重试" + 重试按钮 |
| API 5xx（服务端错误） | 提示"服务暂时不可用" + 重试按钮 |
| AI 返回格式异常 | 显示原始回复 + 「重新整理」按钮 |
| 网络断开 | 提示"网络不可用"，保留已录制文字 |
| Web Speech 识别为空 | 提示"未识别到语音，请重试" |

### 「重新整理」机制

当 AI 返回格式异常时，用户可点击「重新整理」按钮触发重试：

1. 使用相同的原始文字稿
2. 使用一套更严格的 System Prompt——要求每段必须以固定标题（如 `主诉：` / `Chief Complaint:`）独占一行开头，后跟内容，禁止额外说明或评论
3. 在 user message 末尾追加格式纠错指令：
   > "Your previous output was not in the expected format. You MUST follow the exact structure below, with each section title on its own line followed by content. Do not add any extra commentary."
4. 可重试最多 3 次，每次使用同一严格 prompt；3 次后仍异常则保持显示原始回复

## 隐私与安全

- API Key 仅存浏览器 localStorage，不上传任何服务器
- 录音数据仅在用户设备处理（Web Speech API 浏览器端）
- AI API 调用直接从浏览器发出，不经过中间服务器
- 无后端、无数据库、无日志收集

## 非功能需求

- 首屏加载 < 1 秒（无外部依赖）
- 移动端适配：Chrome Android、Safari iOS（基本兼容）
- 桌面端主推 Chrome / Edge（Web Speech API 支持最好）

## 不做的事情

- 不保存历史记录（MVP 阶段，用户复制后自行管理）
- 不登录/注册（无需账号体系）
- 不提供离线 AI（依赖云端 API）
- 不实现多设备同步
- 不添加任何第三方追踪/分析
