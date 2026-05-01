# History Scribe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page web app that records medical conversations, transcribes via Web Speech API, and formats into structured medical records via AI API.

**Architecture:** 5 flat files — HTML for DOM, CSS for styles, two data files (i18n.js + prompts.js) for content, app.js for all logic. Globals `I18N` and `PROMPTS` act as read-only data contracts consumed by app.js.

**Tech Stack:** Vanilla HTML/CSS/JS, zero dependencies, Web Speech API, fetch() for AI API, localStorage for settings.

---

### Task 1: HTML Scaffold

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write the full HTML page**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>病史记录 / Medical Scribe</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header id="header">
      <h1 id="app-title">病史记录</h1>
      <button id="lang-toggle" class="btn-small">EN</button>
    </header>

    <!-- State 1: Standby -->
    <main id="state-standby" class="state">
      <div class="center-content">
        <button id="btn-record" class="btn-mic" aria-label="开始录音">
          <span class="mic-icon">🎤</span>
        </button>
        <p id="standby-hint" class="hint">点击开始录音</p>
      </div>
    </main>

    <!-- State 2: Recording -->
    <main id="state-recording" class="state hidden">
      <div class="center-content">
        <div class="recording-indicator pulse"></div>
        <p id="timer" class="timer">00:00</p>
        <p id="interim-text" class="interim"></p>
        <button id="btn-stop" class="btn-stop">停止录音</button>
      </div>
    </main>

    <!-- State 3: Processing -->
    <main id="state-processing" class="state hidden">
      <div class="center-content">
        <div class="spinner"></div>
        <p id="processing-text">正在转录整理...</p>
      </div>
    </main>

    <!-- State 4: Result -->
    <main id="state-result" class="state hidden">
      <div id="result-card" class="result-card">
        <p id="result-content"></p>
      </div>
      <div class="result-actions">
        <button id="btn-copy" class="btn-primary">📋 一键复制</button>
        <p id="copy-feedback" class="copy-feedback hidden">已复制到剪贴板</p>
        <button id="btn-new-recording" class="btn-secondary">🔄 录制新的</button>
      </div>
      <!-- Retry section, hidden by default -->
      <div id="retry-section" class="hidden">
        <button id="btn-retry" class="btn-warning">🔄 重新整理</button>
        <p id="retry-info" class="hint"></p>
      </div>
    </main>

    <!-- Error banner -->
    <div id="error-banner" class="error-banner hidden">
      <span id="error-message"></span>
      <button id="btn-dismiss-error" class="btn-small">✕</button>
    </div>

    <!-- Settings button -->
    <button id="btn-settings" class="btn-icon" aria-label="设置">⚙</button>

    <!-- Settings overlay -->
    <div id="settings-overlay" class="overlay hidden">
      <div id="settings-panel" class="settings-panel">
        <div class="settings-header">
          <h2 id="settings-title">设置</h2>
          <button id="btn-close-settings" class="btn-small">✕</button>
        </div>
        <div class="settings-body">
          <div class="form-group">
            <label id="label-provider" for="select-provider">AI 提供商</label>
            <select id="select-provider">
              <option value="deepseek-openai">DeepSeek (OpenAI 格式)</option>
              <option value="deepseek-anthropic">DeepSeek (Anthropic 格式)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="custom">OpenAI 兼容接口 (自定义)</option>
            </select>
          </div>
          <div class="form-group">
            <label id="label-apikey" for="input-apikey">API Key</label>
            <input type="password" id="input-apikey" placeholder="sk-...">
            <p id="apikey-hint" class="form-hint">Key 仅保存在此浏览器中</p>
          </div>
          <div class="form-group">
            <label id="label-model" for="input-model">模型</label>
            <input type="text" id="input-model" value="deepseek-v4-flash">
          </div>
          <div class="form-group">
            <label id="label-baseurl" for="input-baseurl">Base URL</label>
            <input type="text" id="input-baseurl" value="https://api.deepseek.com">
            <p id="baseurl-hint" class="form-hint"></p>
          </div>
          <div class="form-group">
            <label id="label-speech-lang" for="select-speech-lang">语音识别语言</label>
            <select id="select-speech-lang">
              <option value="zh-CN">中文（自动检测）</option>
              <option value="en-US">English (auto-detect)</option>
            </select>
          </div>
          <button id="btn-save-settings" class="btn-primary">保存设置</button>
        </div>
      </div>
    </div>
  </div>

  <script src="i18n.js"></script>
  <script src="prompts.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify file exists and loads without JS errors**

Open `index.html` in Chrome. Expected: blank page, no console errors (CSS/JS files not yet created will 404, that's OK).

- [ ] **Step 3: Commit**

```
git add index.html
git commit -m "feat: add HTML scaffold with all UI states and settings panel"
```

---

### Task 2: CSS Styles

**Files:**
- Create: `style.css`

- [ ] **Step 1: Write the full stylesheet**

```css
/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f8f9fa;
  --surface: #ffffff;
  --text: #212529;
  --muted: #6c757d;
  --border: #dee2e6;
  --primary: #3498db;
  --primary-hover: #2980b9;
  --danger: #e74c3c;
  --danger-hover: #c0392b;
  --warning: #f39c12;
  --warning-hover: #e67e22;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,.08);
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  display: flex;
  justify-content: center;
}

#app {
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  background: var(--surface);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* === Header === */
#header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

#app-title {
  font-size: 18px;
  font-weight: 700;
}

/* === Buttons === */
.btn-small {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
.btn-small:hover { background: var(--bg); }

.btn-primary, .btn-secondary, .btn-stop, .btn-warning {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--border); }
.btn-stop { background: var(--danger); color: white; }
.btn-stop:hover { background: var(--danger-hover); }
.btn-warning { background: var(--warning); color: white; }
.btn-warning:hover { background: var(--warning-hover); }

.btn-mic {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: var(--primary);
  box-shadow: 0 4px 20px rgba(52,152,219,.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .15s;
}
.btn-mic:active { transform: scale(.93); }
.mic-icon { font-size: 36px; }

.btn-icon {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 20px;
  cursor: pointer;
  box-shadow: var(--shadow);
  z-index: 10;
}

/* === States === */
.state { flex: 1; display: flex; flex-direction: column; padding: 24px 20px; }
.hidden { display: none !important; }

.center-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.hint { color: var(--muted); font-size: 14px; }
.timer { font-size: 32px; font-weight: 300; font-variant-numeric: tabular-nums; }
.interim {
  font-size: 14px;
  color: var(--muted);
  max-width: 100%;
  word-wrap: break-word;
  text-align: center;
  max-height: 120px;
  overflow-y: auto;
}

/* === Recording indicator === */
.recording-indicator {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--danger);
}
.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,60,.5); }
  50% { box-shadow: 0 0 0 20px rgba(231,76,60,0); }
}

/* === Spinner === */
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* === Result === */
.result-card {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
  flex: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.copy-feedback {
  text-align: center;
  font-size: 13px;
  color: #27ae60;
  font-weight: 500;
}

/* === Error banner === */
.error-banner {
  position: absolute;
  top: 60px;
  left: 20px;
  right: 20px;
  background: #fdecea;
  color: var(--danger);
  padding: 12px 16px;
  border-radius: var(--radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}

/* === Settings Overlay === */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.settings-panel {
  background: var(--surface);
  width: 100%;
  max-width: 480px;
  border-radius: 16px 16px 0 0;
  max-height: 85dvh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
}
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}
.settings-header h2 { font-size: 17px; }
.settings-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; }
.form-group input, .form-group select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font);
}
.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: var(--primary);
}
.form-hint { font-size: 11px; color: var(--muted); }

/* === Retry section === */
#retry-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

/* === Responsive === */
@media (min-width: 481px) {
  #app { border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
  .overlay { align-items: center; }
  .settings-panel { border-radius: var(--radius); }
}
```

- [ ] **Step 2: Verify styles visually**

Open `index.html` in Chrome. Confirm: header visible, mic button centered, settings gear visible at bottom-right. Expect a clean white card centered on desktop.

- [ ] **Step 3: Commit**

```
git add style.css
git commit -m "feat: add complete mobile-first stylesheet"
```

---

### Task 3: Internationalization (i18n.js)

**Files:**
- Create: `i18n.js`

- [ ] **Step 1: Write the translation data**

```javascript
const I18N = {
  zh: {
    appTitle: "病史记录",
    standbyHint: "点击开始录音",
    stopBtn: "停止录音",
    processing: "正在转录整理...",
    copyBtn: "📋 一键复制",
    copied: "已复制到剪贴板",
    newRecording: "🔄 录制新的",
    retryBtn: "🔄 重新整理",
    retryAttempt: "第 {n} 次重试整理...",
    retryMaxed: "已重试 3 次，下方为原始回复",
    settings: "设置",
    provider: "AI 提供商",
    apikey: "API Key",
    apikeyHint: "Key 仅保存在此浏览器中",
    model: "模型",
    baseUrl: "Base URL",
    baseUrlHintOpenAI: "调用 /v1/chat/completions",
    baseUrlHintAnthropic: "调用 /v1/messages",
    speechLang: "语音识别语言",
    saveSettings: "保存设置",
    settingsSaved: "设置已保存",
    errMicDenied: "请开启浏览器麦克风权限",
    errNotSupported: "请使用 Chrome 或 Edge 浏览器",
    errNoApiKey: "请先在设置中填入 API Key",
    errApi401: "API Key 无效，请检查设置",
    errApi429: "请求频繁，请稍后重试",
    errApi5xx: "服务暂时不可用",
    errNetwork: "网络不可用",
    errEmptySpeech: "未识别到语音，请重试",
    errFormat: "AI 返回格式异常",
    retry: "重试",
    dismiss: "✕",
    chinese: "中文",
    english: "English",
    langSwitch: "EN",
  },
  en: {
    appTitle: "Medical Scribe",
    standbyHint: "Tap to start recording",
    stopBtn: "Stop Recording",
    processing: "Transcribing & organizing...",
    copyBtn: "📋 Copy All",
    copied: "Copied to clipboard",
    newRecording: "🔄 New Recording",
    retryBtn: "🔄 Reorganize",
    retryAttempt: "Retry attempt {n}...",
    retryMaxed: "Retried 3 times. Showing original response below.",
    settings: "Settings",
    provider: "AI Provider",
    apikey: "API Key",
    apikeyHint: "Key stored in browser only",
    model: "Model",
    baseUrl: "Base URL",
    baseUrlHintOpenAI: "Calls /v1/chat/completions",
    baseUrlHintAnthropic: "Calls /v1/messages",
    speechLang: "Speech Language",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved",
    errMicDenied: "Please enable microphone permission",
    errNotSupported: "Please use Chrome or Edge",
    errNoApiKey: "Please enter API Key in Settings",
    errApi401: "Invalid API Key. Check Settings.",
    errApi429: "Too many requests. Try again later.",
    errApi5xx: "Service temporarily unavailable",
    errNetwork: "Network unavailable",
    errEmptySpeech: "No speech detected. Please try again.",
    errFormat: "AI response format error",
    retry: "Retry",
    dismiss: "✕",
    chinese: "中文",
    english: "English",
    langSwitch: "中",
  }
};
```

- [ ] **Step 2: Verify in browser console**

Open `index.html` in Chrome, open DevTools console. Type `I18N.zh.appTitle`. Expected: `"病史记录"`. Type `I18N.en.appTitle`. Expected: `"Medical Scribe"`.

- [ ] **Step 3: Commit**

```
git add i18n.js
git commit -m "feat: add Chinese/English translation mappings"
```

---

### Task 4: AI Prompt Templates (prompts.js)

**Files:**
- Create: `prompts.js`

- [ ] **Step 1: Write the prompt templates**

```javascript
const PROMPTS = {
  // Normal prompt — used on first attempt
  normal: {
    zh: `你是一位专业的医学记录助手。请根据以下语音转录内容，按照以下 8 个部分整理成一份结构化的中文病历。如果某部分没有相关信息，请填写"无相关记录"。

要求严格按以下格式输出，每个标题独占一行，后跟相应内容：

主诉：
现病史：
既往史：
系统回顾：
个人史：
家族史：
药物及过敏史：
月经及生育史：

以下是语音转录内容：`,

    en: `You are a professional medical scribe. Based on the following transcript, organize the information into a structured medical record with the 8 sections below. If a section has no relevant information, write "No relevant record."

Output must strictly follow this format, with each heading on its own line followed by content:

Chief Complaint:
History of Present Illness:
Past Medical History:
Review of Systems:
Personal History:
Family History:
Medication & Allergy History:
Menstrual & Obstetric History:

Here is the transcript:`,
  },

  // Strict prompt — used on retry when format was invalid
  strict: {
    zh: `你是一位专业的医学记录助手。请根据以下语音转录内容，整理成结构化中文病历。

【重要格式要求 — 必须严格遵守】
你必须且只能输出 8 个段落。每个段落必须以指定的标题独占一行开头（带中文冒号），紧接着是该段内容。不要添加任何开场白、结束语、解释或额外评论。不要使用 markdown 代码块。不要编号。直接输出病历内容。

输出结构如下：
主诉：
（内容）
现病史：
（内容）
既往史：
（内容）
系统回顾：
（内容）
个人史：
（内容）
家族史：
（内容）
药物及过敏史：
（内容）
月经及生育史：
（内容）

如果某部分没有相关信息，填写"无相关记录"。

以下是语音转录内容：`,

    en: `You are a professional medical scribe. Based on the following transcript, organize the information into a structured medical record.

【CRITICAL FORMAT REQUIREMENTS — MUST FOLLOW EXACTLY】
You MUST output exactly 8 sections. Each section MUST start with the specified heading on its own line (with a colon), immediately followed by the section content. Do NOT add any preamble, closing remarks, explanations, or extra commentary. Do NOT use markdown code blocks. Do NOT number the sections. Output the medical record directly.

Output structure:
Chief Complaint:
(content)
History of Present Illness:
(content)
Past Medical History:
(content)
Review of Systems:
(content)
Personal History:
(content)
Family History:
(content)
Medication & Allergy History:
(content)
Menstrual & Obstetric History:
(content)

If a section has no relevant information, write "No relevant record."

Here is the transcript:`,
  },

  // Format error suffix — appended to user message on retry
  formatErrorSuffix: {
    zh: `\n\n[系统提示：你上一次的输出格式不符合要求。你必须严格按照上述格式要求输出，每个标题独占一行，后面跟内容。不要添加任何额外说明。]`,
    en: `\n\n[System note: Your previous output was not in the expected format. You MUST follow the exact structure above, with each section title on its own line followed by content. Do not add any extra commentary.]`,
  },
};
```

- [ ] **Step 2: Verify in browser console**

Open `index.html`, test in console: `PROMPTS.normal.zh.includes('主诉')`. Expected: `true`.

- [ ] **Step 3: Commit**

```
git add prompts.js
git commit -m "feat: add AI prompt templates for normal and strict retry modes"
```

---

### Task 5: App Core — Settings & Storage

**Files:**
- Create: `app.js` (first section)

- [ ] **Step 1: Write settings management code**

```javascript
// === Settings Management ===

const DEFAULT_SETTINGS = {
  provider: 'deepseek-openai',
  apiKey: '',
  model: 'deepseek-v4-flash',
  baseUrl: 'https://api.deepseek.com',
  speechLang: 'zh-CN',
  language: 'zh', // 'zh' or 'en'
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('history-scribe-settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) { /* corrupted data, use defaults */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem('history-scribe-settings', JSON.stringify(settings));
}

let settings = loadSettings();

// Provider → default baseUrl mapping
const PROVIDER_BASE_URLS = {
  'deepseek-openai': 'https://api.deepseek.com',
  'deepseek-anthropic': 'https://api.deepseek.com/anthropic',
  'anthropic': 'https://api.anthropic.com',
  'openai': 'https://api.openai.com',
  'custom': '',
};

function isOpenAIFormat(provider) {
  return provider === 'deepseek-openai' || provider === 'openai' || provider === 'custom';
}
```

- [ ] **Step 2: Write settings UI bindings**

```javascript
// === Settings UI ===

const $selectProvider = document.getElementById('select-provider');
const $inputApiKey = document.getElementById('input-apikey');
const $inputModel = document.getElementById('input-model');
const $inputBaseUrl = document.getElementById('input-baseurl');
const $selectSpeechLang = document.getElementById('select-speech-lang');
const $baseUrlHint = document.getElementById('baseurl-hint');

function populateSettingsForm() {
  $selectProvider.value = settings.provider;
  $inputApiKey.value = settings.apiKey;
  $inputModel.value = settings.model;
  $inputBaseUrl.value = settings.baseUrl;
  $selectSpeechLang.value = settings.speechLang;
  updateBaseUrlHint();
}

function updateBaseUrlHint() {
  const provider = $selectProvider.value;
  const lang = settings.language;
  const hints = {
    'deepseek-openai': lang === 'zh' ? '调用 /v1/chat/completions' : 'Calls /v1/chat/completions',
    'deepseek-anthropic': lang === 'zh' ? '调用 /v1/messages' : 'Calls /v1/messages',
    'anthropic': lang === 'zh' ? '调用 /v1/messages' : 'Calls /v1/messages',
    'openai': lang === 'zh' ? '调用 /v1/chat/completions' : 'Calls /v1/chat/completions',
    'custom': lang === 'zh' ? '使用 OpenAI Chat Completions 格式' : 'Uses OpenAI Chat Completions format',
  };
  $baseUrlHint.textContent = hints[provider] || '';
}

$selectProvider.addEventListener('change', () => {
  const provider = $selectProvider.value;
  if (provider !== 'custom') {
    $inputBaseUrl.value = PROVIDER_BASE_URLS[provider];
  }
  updateBaseUrlHint();
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
  settings.provider = $selectProvider.value;
  settings.apiKey = $inputApiKey.value.trim();
  settings.model = $inputModel.value.trim() || DEFAULT_SETTINGS.model;
  settings.baseUrl = $inputBaseUrl.value.trim();
  settings.speechLang = $selectSpeechLang.value;
  saveSettings(settings);
  closeSettings();
  showCopyFeedback(I18N[settings.language].settingsSaved);
});
```

- [ ] **Step 3: Verify settings save/load**

Open `index.html` in Chrome, open settings panel, change provider to "OpenAI", enter a test key, click Save. Reload page, open settings panel. Confirm values persist.

- [ ] **Step 4: Commit**

```
git add app.js
git commit -m "feat: add settings management and settings UI bindings"
```

---

### Task 6: App Core — State Management & Language Toggle

**Files:**
- Modify: `app.js` (append)

- [ ] **Step 1: Write state management**

```javascript
// === State Management ===

const STATE_IDS = ['state-standby', 'state-recording', 'state-processing', 'state-result'];

function showState(stateId) {
  STATE_IDS.forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== stateId);
  });
  // Hide retry section when switching away from result
  if (stateId !== 'state-result') {
    document.getElementById('retry-section').classList.add('hidden');
  }
}

function showError(msg) {
  const $banner = document.getElementById('error-banner');
  const $msg = document.getElementById('error-message');
  $msg.textContent = msg;
  $banner.classList.remove('hidden');
}

function dismissError() {
  document.getElementById('error-banner').classList.add('hidden');
}

document.getElementById('btn-dismiss-error').addEventListener('click', dismissError);
```

- [ ] **Step 2: Write language toggle**

```javascript
// === Language Toggle ===

function t(key, replacements) {
  let text = I18N[settings.language][key] || key;
  if (replacements) {
    Object.keys(replacements).forEach(k => {
      text = text.replace(`{${k}}`, replacements[k]);
    });
  }
  return text;
}

function applyLanguage() {
  const lang = settings.language;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.getElementById('app-title').textContent = I18N[lang].appTitle;
  document.getElementById('standby-hint').textContent = I18N[lang].standbyHint;
  document.getElementById('btn-stop').textContent = I18N[lang].stopBtn;
  document.getElementById('processing-text').textContent = I18N[lang].processing;
  document.getElementById('btn-copy').textContent = I18N[lang].copyBtn;
  document.getElementById('btn-new-recording').textContent = I18N[lang].newRecording;
  document.getElementById('btn-retry').textContent = I18N[lang].retryBtn;
  document.getElementById('btn-settings').setAttribute('aria-label', I18N[lang].settings);
  document.getElementById('settings-title').textContent = I18N[lang].settings;
  document.getElementById('label-provider').textContent = I18N[lang].provider;
  document.getElementById('label-apikey').textContent = I18N[lang].apikey;
  document.getElementById('apikey-hint').textContent = I18N[lang].apikeyHint;
  document.getElementById('label-model').textContent = I18N[lang].model;
  document.getElementById('label-baseurl').textContent = I18N[lang].baseUrl;
  document.getElementById('label-speech-lang').textContent = I18N[lang].speechLang;
  document.getElementById('lang-toggle').textContent = I18N[lang].langSwitch;
  document.getElementById('btn-save-settings').textContent = I18N[lang].saveSettings;
  updateBaseUrlHint();
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  settings.language = settings.language === 'zh' ? 'en' : 'zh';
  saveSettings(settings);
  applyLanguage();
});
```

- [ ] **Step 3: Wire up settings panel open/close**

```javascript
// === Settings Panel Toggle ===

function openSettings() {
  populateSettingsForm();
  document.getElementById('settings-overlay').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
}

document.getElementById('btn-settings').addEventListener('click', openSettings);
document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
document.getElementById('settings-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSettings();
});
```

- [ ] **Step 4: Initialize on page load**

```javascript
// === Initialization ===

function init() {
  applyLanguage();
  showState('state-standby');
}

init();
```

- [ ] **Step 5: Verify language toggle**

Open `index.html` in Chrome. Click "EN" button in header. Confirm: title changes to "Medical Scribe", hint changes to "Tap to start recording". Click "中" to switch back. Confirm Chinese is restored.

- [ ] **Step 6: Commit**

```
git add app.js
git commit -m "feat: add state management, language toggle, and settings panel toggle"
```

---

### Task 7: App Core — Speech Recognition

**Files:**
- Modify: `app.js` (append)

- [ ] **Step 1: Write speech recognition module**

```javascript
// === Speech Recognition ===

let recognition = null;
let finalTranscript = '';
let recordingStartTime = 0;
let timerInterval = null;

function isSpeechSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = settings.speechLang;

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }
    document.getElementById('interim-text').textContent = finalTranscript + interim;
  };

  rec.onerror = (event) => {
    stopTimer();
    if (event.error === 'not-allowed') {
      showError(t('errMicDenied'));
    } else if (event.error === 'no-speech') {
      showError(t('errEmptySpeech'));
    } else {
      showError(event.error);
    }
    showState('state-standby');
  };

  rec.onend = () => {
    stopTimer();
    // If we have transcript content and we stopped intentionally, proceed
    if (finalTranscript.trim() && recognition) {
      processTranscript(finalTranscript.trim());
    } else if (!finalTranscript.trim() && recognition) {
      showState('state-standby');
    }
    recognition = null;
  };

  return rec;
}

function startTimer() {
  recordingStartTime = Date.now();
  const $timer = document.getElementById('timer');
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    $timer.textContent = `${mins}:${secs}`;
  }, 200);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
```

- [ ] **Step 2: Wire up record/stop buttons**

```javascript
// === Record / Stop Handlers ===

document.getElementById('btn-record').addEventListener('click', () => {
  if (!isSpeechSupported()) {
    showError(t('errNotSupported'));
    return;
  }

  finalTranscript = '';
  document.getElementById('interim-text').textContent = '';
  document.getElementById('timer').textContent = '00:00';

  recognition = createRecognition();
  recognition.start();
  startTimer();
  showState('state-recording');
});

document.getElementById('btn-stop').addEventListener('click', () => {
  if (recognition) {
    // Set recognition to null so onend knows we stopped intentionally
    const rec = recognition;
    recognition = null;
    rec.stop();
  }
});
```

- [ ] **Step 3: Verify speech recognition**

Open `index.html` in Chrome. Click mic button, grant microphone permission. Speak a few sentences. Confirm timer runs and interim text appears. Click "停止录音". Confirm recorder stops.

- [ ] **Step 4: Commit**

```
git add app.js
git commit -m "feat: add Web Speech API integration with recording controls"
```

---

### Task 8: App Core — AI API Calls

**Files:**
- Modify: `app.js` (append)

- [ ] **Step 1: Write API call functions**

```javascript
// === AI API Calls ===

async function callOpenAIFormat(baseUrl, apiKey, model, systemPrompt, userMessage) {
  const url = baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('errApi401');
    if (status === 429) throw new Error('errApi429');
    if (status >= 500) throw new Error('errApi5xx');
    const body = await response.text();
    throw new Error(body || `HTTP ${status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropicFormat(baseUrl, apiKey, model, systemPrompt, userMessage) {
  const url = baseUrl.replace(/\/+$/, '') + '/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('errApi401');
    if (status === 429) throw new Error('errApi429');
    if (status >= 500) throw new Error('errApi5xx');
    const body = await response.text();
    throw new Error(body || `HTTP ${status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callAI(systemPrompt, userMessage) {
  if (!settings.apiKey) throw new Error('errNoApiKey');

  if (isOpenAIFormat(settings.provider)) {
    return callOpenAIFormat(settings.baseUrl, settings.apiKey, settings.model, systemPrompt, userMessage);
  } else {
    return callAnthropicFormat(settings.baseUrl, settings.apiKey, settings.model, systemPrompt, userMessage);
  }
}
```

- [ ] **Step 2: Write transcript processing and result display**

```javascript
// === Transcript Processing ===

let currentTranscript = '';
let retryCount = 0;
const MAX_RETRIES = 3;

async function processTranscript(transcript, isRetry = false) {
  currentTranscript = transcript;
  if (!isRetry) retryCount = 0;

  showState('state-processing');

  try {
    if (!settings.apiKey) {
      showError(t('errNoApiKey'));
      showState('state-standby');
      return;
    }

    const lang = settings.language;
    const promptType = isRetry ? 'strict' : 'normal';
    const systemPrompt = PROMPTS[promptType][lang];
    let userMessage = transcript;

    if (isRetry) {
      userMessage += PROMPTS.formatErrorSuffix[lang];
    }

    const result = await callAI(systemPrompt, userMessage);
    displayResult(result);
    retryCount = 0;
  } catch (err) {
    handleAPIError(err);
  }
}

function displayResult(text) {
  document.getElementById('result-content').textContent = text;
  document.getElementById('retry-section').classList.add('hidden');
  showState('state-result');
}

function handleAPIError(err) {
  const key = I18N[settings.language][err.message] ? err.message : null;
  if (key) {
    showError(t(key));
  } else {
    showError(err.message);
  }
  showState('state-standby');
}
```

- [ ] **Step 3: Verify API call with a test key**

Open `index.html` in Chrome. Set a valid DeepSeek API key in settings. Record a short test sentence. Confirm processing state appears, then result displays.

- [ ] **Step 4: Commit**

```
git add app.js
git commit -m "feat: add AI API call logic for OpenAI and Anthropic formats"
```

---

### Task 9: App Core — Copy, Retry, and New Recording

**Files:**
- Modify: `app.js` (append)

- [ ] **Step 1: Write copy to clipboard**

```javascript
// === Copy to Clipboard ===

document.getElementById('btn-copy').addEventListener('click', async () => {
  const text = document.getElementById('result-content').textContent;
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback(t('copied'));
  } catch (_) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback(t('copied'));
  }
});

function showCopyFeedback(msg) {
  const $el = document.getElementById('copy-feedback');
  $el.textContent = msg;
  $el.classList.remove('hidden');
  setTimeout(() => $el.classList.add('hidden'), 2000);
}
```

- [ ] **Step 2: Write retry (reorganize) logic**

```javascript
// === Retry / Reorganize ===

document.getElementById('btn-retry').addEventListener('click', async () => {
  if (retryCount >= MAX_RETRIES) {
    document.getElementById('retry-info').textContent = t('retryMaxed');
    return;
  }
  retryCount++;
  document.getElementById('retry-info').textContent = t('retryAttempt', { n: String(retryCount) });
  await processTranscript(currentTranscript, true);
});
```

- [ ] **Step 3: Write "New Recording" button**

```javascript
// === New Recording ===

document.getElementById('btn-new-recording').addEventListener('click', () => {
  currentTranscript = '';
  retryCount = 0;
  document.getElementById('result-content').textContent = '';
  document.getElementById('interim-text').textContent = '';
  document.getElementById('copy-feedback').classList.add('hidden');
  showState('state-standby');
});
```

- [ ] **Step 4: Wire up retry section visibility for format errors**

Find `displayResult` and extend it:

```javascript
function displayResult(text, showRetryOption = false) {
  document.getElementById('result-content').textContent = text;
  const $retry = document.getElementById('retry-section');
  if (showRetryOption) {
    $retry.classList.remove('hidden');
    document.getElementById('retry-info').textContent = t('errFormat');
  } else {
    $retry.classList.add('hidden');
  }
  showState('state-result');
}
```

Then in `processTranscript`, after `callAI`, add a format check:

```javascript
function isFormatValid(text, lang) {
  const titles = lang === 'zh'
    ? ['主诉', '现病史', '既往史', '系统回顾', '个人史', '家族史', '药物及过敏史', '月经及生育史']
    : ['Chief Complaint', 'History of Present Illness', 'Past Medical History', 'Review of Systems',
       'Personal History', 'Family History', 'Medication & Allergy History', 'Menstrual & Obstetric History'];
  // Require at least 6 of 8 section titles to be present
  const found = titles.filter(t => text.includes(t)).length;
  return found >= 6;
}

// In processTranscript, after getting result:
const valid = isFormatValid(result, lang);
displayResult(result, !valid);
```

- [ ] **Step 5: Verify full flow end-to-end**

Open `index.html` in Chrome. Set API key. Record a short medical conversation sample. Confirm: transcription → processing → result with 8 sections. Click "Copy All". Confirm copied. Click "New Recording". Confirm returns to standby.

- [ ] **Step 6: Commit**

```
git add app.js
git commit -m "feat: add copy, retry, new recording, and format validation"
```

---

### Task 10: Error Handling & Polish

**Files:**
- Modify: `app.js` (append)

- [ ] **Step 1: Add network error detection**

```javascript
// === Network Detection ===

window.addEventListener('offline', () => {
  showError(t('errNetwork'));
});

// In processTranscript, wrap API call with network check:
// Add at the top of processTranscript, before calling callAI:
if (!navigator.onLine) {
  showError(t('errNetwork'));
  showState('state-standby');
  return;
}
```

- [ ] **Step 2: Add retry button for API 5xx and 429 errors**

Modify `handleAPIError`:

```javascript
function handleAPIError(err) {
  const errorKey = I18N[settings.language][err.message] ? err.message : null;
  if (errorKey) {
    const msg = t(errorKey);
    // For retryable errors, show a retry action
    if (errorKey === 'errApi429' || errorKey === 'errApi5xx' || errorKey === 'errNetwork') {
      showRetryableError(msg);
    } else {
      showError(msg);
    }
  } else {
    showError(err.message);
  }
  showState('state-result');
  // Show original transcript in result so user doesn't lose it
  document.getElementById('result-content').textContent = currentTranscript;
}

function showRetryableError(msg) {
  const $banner = document.getElementById('error-banner');
  const $msg = document.getElementById('error-message');
  $msg.innerHTML = `${msg} <button id="btn-retry-api" class="btn-small" style="margin-left:8px">${t('retry')}</button>`;
  $banner.classList.remove('hidden');
  document.getElementById('btn-retry-api').addEventListener('click', () => {
    dismissError();
    processTranscript(currentTranscript, retryCount > 0);
  }, { once: true });
}
```

- [ ] **Step 3: Verify error handling**

Test scenarios:
- Remove API key → record → should show "请先在设置中填入 API Key"
- Use invalid API key → record → should show "API Key 无效"
- Toggle airplane mode → should show "网络不可用" (if browser fires offline event)
- Record without speaking → should show "未识别到语音" error

- [ ] **Step 4: Commit**

```
git add app.js
git commit -m "feat: add network detection and error handling polish"
```

---

### Task 11: Final Integration Test & Fixup

**Files:**
- Modify: `app.js` (any remaining integration fixes)
- Modify: `style.css` (visual tweaks)

- [ ] **Step 1: Full end-to-end test**

Run the complete golden path:
1. Open `index.html` in Chrome
2. Verify standby state: mic button centered, settings gear visible
3. Open settings → confirm DeepSeek defaults are populated
4. Enter API key → save
5. Switch language to English → confirm UI changes
6. Switch back to Chinese → confirm UI restores
7. Click mic → grant permission → speak ~30 seconds of medical conversation
8. Click stop → confirm processing spinner
9. Verify result card shows all 8 sections
10. Click copy → confirm "已复制到剪贴板"
11. Click new recording → confirm returns to standby

- [ ] **Step 2: Run error paths**

Test each error scenario from the spec:
- Mic denied → error shown
- No API key → error shown
- Invalid API key → error shown
- Speaking nothing → empty speech error
- Copy works on mobile Chrome

- [ ] **Step 3: Final visual check**

Verify on mobile viewport (Chrome DevTools device toolbar, iPhone 14 or similar):
- App fills screen width
- No horizontal scroll
- Touch targets are large enough
- Settings panel slides up from bottom
- Safe area insets respected (notch phones)

- [ ] **Step 4: Commit any final fixes**

```
git add -A
git commit -m "chore: final integration fixes and polish"
```

---

### Task 12: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write .gitignore**

```
.superpowers/
```

- [ ] **Step 2: Commit**

```
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

## File Manifest (After Implementation)

```
history-scribe/
├── index.html        — HTML scaffold, all UI states and settings panel DOM
├── style.css         — Mobile-first minimalist stylesheet
├── i18n.js           — Chinese/English translation strings (data only)
├── prompts.js        — AI system prompt templates, normal and strict modes (data only)
├── app.js            — All logic: settings, state, speech, API, copy, retry
├── .gitignore        — Ignores .superpowers/
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-05-01-history-scribe-design.md
        └── plans/
            └── 2026-05-01-history-scribe-plan.md
```
