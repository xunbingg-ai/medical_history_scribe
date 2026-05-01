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

// === Initialization ===

function init() {
  applyLanguage();
  showState('state-standby');
}

init();

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

  let rafPending = false;
  let pendingText = '';
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
    pendingText = finalTranscript + interim;
    // Throttle DOM updates with rAF to prevent main-thread congestion on mobile
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        document.getElementById('interim-text').textContent = pendingText;
        rafPending = false;
      });
    }
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
    // recognition is null when user clicked stop (intentional), truthy when ended unexpectedly
    if (finalTranscript.trim() && !recognition) {
      // User stopped intentionally, we have content → process
      processTranscript(finalTranscript.trim());
    } else if (!finalTranscript.trim() && !recognition) {
      // User stopped intentionally, no content → go back
      showState('state-standby');
    }
    // If recognition is still truthy (ended unexpectedly) → do nothing, user can retry
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

// === AI API Calls ===

async function callOpenAIFormat(baseUrl, apiKey, model, systemPrompt, userMessage) {
  const url = baseUrl.replace(/\/+$/, '') + (baseUrl.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions');
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
  const url = baseUrl.replace(/\/+$/, '') + (baseUrl.endsWith('/v1') ? '/messages' : '/v1/messages');
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

// === Transcript Processing ===

let currentTranscript = '';
let retryCount = 0;
const MAX_RETRIES = 3;

async function processTranscript(transcript, isRetry = false) {
  currentTranscript = transcript;
  if (!isRetry) retryCount = 0;

  if (!navigator.onLine) {
    showError(t('errNetwork'));
    showState('state-standby');
    return;
  }

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
    const valid = isFormatValid(result, lang);
    displayResult(result, !valid);
    if (valid) retryCount = 0;
  } catch (err) {
    handleAPIError(err);
  }
}

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

// === New Recording ===

document.getElementById('btn-new-recording').addEventListener('click', () => {
  currentTranscript = '';
  retryCount = 0;
  document.getElementById('result-content').textContent = '';
  document.getElementById('interim-text').textContent = '';
  document.getElementById('copy-feedback').classList.add('hidden');
  showState('state-standby');
});

// === Format Validation ===

function isFormatValid(text, lang) {
  const titles = lang === 'zh'
    ? ['主诉', '现病史', '既往史', '系统回顾', '个人史', '家族史', '药物及过敏史', '月经及生育史']
    : ['Chief Complaint', 'History of Present Illness', 'Past Medical History', 'Review of Systems',
       'Personal History', 'Family History', 'Medication & Allergy History', 'Menstrual & Obstetric History'];
  // Require at least 6 of 8 section titles to be present
  const found = titles.filter(t => text.includes(t)).length;
  return found >= 6;
}

// === Network Detection ===

window.addEventListener('offline', () => {
  showError(t('errNetwork'));
});
