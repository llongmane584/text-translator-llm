document.addEventListener('DOMContentLoaded', function () {
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
      targetLanguageSelect.value = result.targetLanguage || 'ja';
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
        { key: 'lmStudioModel', label: 'モデル名', type: 'select', placeholder: 'local-model', loadModels: true }
      ]
    };

    const config = providerConfigs[provider];
    if (config) {
      config.forEach(setting => {
        const div = document.createElement('div');
        div.className = 'setting-item';

        const label = document.createElement('label');
        label.textContent = setting.label;

        let input;
        if (setting.type === 'select' && setting.loadModels) {
          input = document.createElement('select');
          input.id = setting.key;

          // デフォルトオプション
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = '-- モデルを選択 --';
          input.appendChild(defaultOption);

          // 現在の値があれば追加
          if (currentValues[setting.key]) {
            const currentOption = document.createElement('option');
            currentOption.value = currentValues[setting.key];
            currentOption.textContent = currentValues[setting.key];
            currentOption.selected = true;
            input.appendChild(currentOption);
          }

          // モデルリロードボタン
          const reloadBtn = document.createElement('button');
          reloadBtn.type = 'button';
          reloadBtn.textContent = '更新';
          reloadBtn.className = 'model-reload-btn';
          reloadBtn.addEventListener('click', () => {
            // リアルタイムでURL値を取得
            const urlInput = document.getElementById('lmStudioUrl');
            const currentUrl = urlInput ? urlInput.value : (currentValues.lmStudioUrl || 'http://localhost:1234');
            loadLMStudioModels(input, currentUrl);
          });

          // コンテナ要素を作成してFlexレイアウト適用
          const selectorContainer = document.createElement('div');
          selectorContainer.className = 'model-selector-container';
          selectorContainer.appendChild(input);
          selectorContainer.appendChild(reloadBtn);

          div.appendChild(label);
          div.appendChild(selectorContainer);

          // 初回読み込み
          loadLMStudioModels(input, currentValues.lmStudioUrl);
        } else {
          input = document.createElement('input');
          input.type = setting.type;
          input.id = setting.key;
          input.placeholder = setting.placeholder;
          input.value = currentValues[setting.key] || '';

          div.appendChild(label);
          div.appendChild(input);
        }

        input.addEventListener('change', saveSettings);
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

    // プロバイダー固有の設定を収集（inputとselectの両方）
    const providerInputs = providerSettingsDiv.querySelectorAll('input, select');
    providerInputs.forEach(input => {
      settings[input.id] = input.value;
    });

    chrome.storage.sync.set(settings, () => {
      updateStatus();

      // 設定更新をcontent scriptに通知（エラーハンドリング付き）
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
      } catch {
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

  // LM Studio モデル一覧を読み込み
  function loadLMStudioModels(selectElement, url) {
    const baseUrl = url || 'http://localhost:1234';

    // 現在選択中の値を保存
    const currentSelectedValue = selectElement.value;

    // Chrome storageから保存済み設定値を取得してから処理を続行
    chrome.storage.sync.get(['lmStudioModel'], (result) => {
      const savedModelValue = result.lmStudioModel;

      // 読み込み中表示
      selectElement.innerHTML = '';
      const loadingOption = document.createElement('option');
      loadingOption.textContent = '読み込み中...';
      selectElement.appendChild(loadingOption);

      chrome.runtime.sendMessage({
        action: 'getLMStudioModels',
        url: baseUrl
      }, (response) => {
        selectElement.innerHTML = '';

        // デフォルトオプション
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- モデルを選択 --';
        selectElement.appendChild(defaultOption);

        if (response && response.models) {
          response.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.id} ${model.loaded ? '(ロード済み)' : ''}`;
            selectElement.appendChild(option);
          });

          // 選択状態を復元（優先順位: 現在選択値 > 保存済み設定値）
          let valueToRestore = '';
          if (currentSelectedValue && currentSelectedValue !== '') {
            valueToRestore = currentSelectedValue;
          } else if (savedModelValue && savedModelValue !== '') {
            valueToRestore = savedModelValue;
          }

          // 復元する値が実際にオプションに存在するか確認
          const optionExists = Array.from(selectElement.options).some(option => option.value === valueToRestore);
          if (optionExists) {
            selectElement.value = valueToRestore;
          }

        } else if (response && response.error) {
          const errorOption = document.createElement('option');
          errorOption.textContent = `エラー: ${response.error}`;
          selectElement.appendChild(errorOption);
        } else {
          const noModelsOption = document.createElement('option');
          noModelsOption.textContent = 'モデルが見つかりません';
          selectElement.appendChild(noModelsOption);
        }
      });
    });
  }
});
