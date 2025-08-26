document.addEventListener('DOMContentLoaded', function() {
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const llmProviderSelect = document.getElementById('llmProvider');
  const autoTranslateCheckbox = document.getElementById('autoTranslate');
  const statusMessage = document.getElementById('statusMessage');
  const providerSettingsDiv = document.getElementById('providerSettings');
  
  // 設定を読み込み
  loadSettings();
  
  // 設定変更イベント
  targetLanguageSelect.addEventListener('change', saveSettings);
  llmProviderSelect.addEventListener('change', onProviderChange);
  autoTranslateCheckbox.addEventListener('change', saveSettings);
  
  function loadSettings() {
    chrome.storage.sync.get([
      'targetLanguage', 
      'autoTranslate', 
      'llmProvider',
      'openaiApiKey',
      'claudeApiKey',
      'geminiApiKey',
      'ollamaUrl',
      'ollamaModel',
      'lmStudioUrl',
      'lmStudioModel'
    ], (result) => {
      targetLanguageSelect.value = result.targetLanguage || 'en';
      llmProviderSelect.value = result.llmProvider || 'ollama';
      autoTranslateCheckbox.checked = result.autoTranslate !== false;
      
      createProviderSettings(result.llmProvider || 'ollama', result);
      updateStatus();
    });
  }
  
  function onProviderChange() {
    const provider = llmProviderSelect.value;
    chrome.storage.sync.get([
      'openaiApiKey', 'claudeApiKey', 'geminiApiKey',
      'ollamaUrl', 'ollamaModel', 'lmStudioUrl', 'lmStudioModel'
    ], (result) => {
      createProviderSettings(provider, result);
      saveSettings();
    });
  }
  
  function createProviderSettings(provider, currentValues = {}) {
    providerSettingsDiv.innerHTML = '';
    
    const providerConfigs = {
      openai: [
        { key: 'openaiApiKey', label: 'OpenAI APIキー', type: 'password', placeholder: 'sk-...' }
      ],
      claude: [
        { key: 'claudeApiKey', label: 'Claude APIキー', type: 'password', placeholder: 'sk-ant-...' }
      ],
      gemini: [
        { key: 'geminiApiKey', label: 'Gemini APIキー', type: 'password', placeholder: 'AIza...' }
      ],
      ollama: [
        { key: 'ollamaUrl', label: 'Ollama URL', type: 'text', placeholder: 'http://localhost:11434' },
        { key: 'ollamaModel', label: 'モデル名', type: 'text', placeholder: 'gemma2:9b' }
      ],
      lmstudio: [
        { key: 'lmStudioUrl', label: 'LM Studio URL', type: 'text', placeholder: 'http://localhost:1234' },
        { key: 'lmStudioModel', label: 'モデル名', type: 'text', placeholder: 'gemma2:9b' }
      ]
    };
    
    const config = providerConfigs[provider];
    if (config) {
      config.forEach(setting => {
        const div = document.createElement('div');
        div.className = 'setting-item';
        
        const label = document.createElement('label');
        label.textContent = setting.label;
        
        const input = document.createElement('input');
        input.type = setting.type;
        input.id = setting.key;
        input.placeholder = setting.placeholder;
        input.value = currentValues[setting.key] || '';
        input.addEventListener('input', saveSettings);
        
        div.appendChild(label);
        div.appendChild(input);
        providerSettingsDiv.appendChild(div);
      });
    }
  }
  
  function saveSettings() {
    const settings = {
      targetLanguage: targetLanguageSelect.value,
      llmProvider: llmProviderSelect.value,
      autoTranslate: autoTranslateCheckbox.checked
    };
    
    // プロバイダー固有の設定を収集
    const providerInputs = providerSettingsDiv.querySelectorAll('input');
    providerInputs.forEach(input => {
      settings[input.id] = input.value;
    });
    
    chrome.storage.sync.set(settings, () => {
      updateStatus();
      
      // 設定更新をcontent scriptに通知（エラーハンドリング付き）
      try {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'settingsUpdated',
              settings: settings
            }).catch((error) => {
              // content scriptが読み込まれていない場合などのエラーを無視
              // このエラーは正常で、拡張機能の動作には影響しません
            });
          }
        });
      } catch (error) {
        // tabs APIのエラーも無視（拡張機能設定ページなどでは正常）
      }
    });
  }
  
  function updateStatus() {
    const language = getLanguageName(targetLanguageSelect.value);
    const provider = getProviderName(llmProviderSelect.value);
    const isEnabled = autoTranslateCheckbox.checked;
    
    if (isEnabled) {
      statusMessage.textContent = `${provider}で${language}への翻訳が有効です`;
      statusMessage.style.color = '#137333';
    } else {
      statusMessage.textContent = '自動翻訳が無効です';
      statusMessage.style.color = '#ea4335';
    }
  }
  
  function getProviderName(code) {
    const providers = {
      'openai': 'OpenAI',
      'claude': 'Claude',
      'gemini': 'Gemini',
      'ollama': 'Ollama',
      'lmstudio': 'LM Studio'
    };
    return providers[code] || code;
  }
  
  function getLanguageName(code) {
    const languages = {
      'en': '英語',
      'ja': '日本語',
      'ko': '韓国語',
      'zh': '中国語',
      'es': 'スペイン語',
      'fr': 'フランス語',
      'de': 'ドイツ語'
    };
    return languages[code] || code;
  }
});