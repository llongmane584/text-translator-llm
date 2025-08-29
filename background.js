// バックグラウンドスクリプト
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text, request.targetLanguage)
      .then(translation => {
        sendResponse({ translation: translation });
      })
      .catch(error => {
        console.error('Translation error:', error);
        sendResponse({ error: error.message });
      });

    // 非同期レスポンスを返すためにtrueを返す
    return true;
  }

  if (request.action === 'getLMStudioModels') {
    getLMStudioModels(request.url)
      .then(models => {
        sendResponse({ models: models });
      })
      .catch(error => {
        console.error('Get models error:', error);
        sendResponse({ error: error.message });
      });

    // 非同期レスポンスを返すためにtrueを返す
    return true;
  }
});

async function translateText(text, targetLanguage) {
  try {
    // 設定からプロバイダー情報を取得
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get([
        'llmProvider',
        'openaiApiKey',
        'claudeApiKey',
        'geminiApiKey',
        'ollamaUrl',
        'ollamaModel',
        'lmStudioUrl',
        'lmStudioModel'
      ], resolve);
    });

    const provider = settings.llmProvider || 'ollama';
    const translation = await callTranslationAPI(text, targetLanguage, provider, settings);
    return translation;
  } catch (error) {
    throw new Error(`翻訳に失敗しました: ${error.message}`);
  }
}

// LM Studio モデル一覧を取得
async function getLMStudioModels(url) {
  const baseUrl = url || 'http://localhost:1234';
  const requestUrl = `${baseUrl}/api/v0/models`;

  try {
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(`LM Studio models API エラー: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('LM Studioサーバーに接続できません');
    }
    throw error;
  }
}

async function callTranslationAPI(text, targetLanguage, provider, settings) {
  const languageNames = {
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German'
  };

  const targetLangName = languageNames[targetLanguage] || targetLanguage;

  switch (provider) {
    case 'openai':
      return await callOpenAI(text, targetLangName, settings.openaiApiKey);

    case 'claude':
      return await callClaude(text, targetLangName, settings.claudeApiKey);

    case 'gemini':
      return await callGemini(text, targetLangName, settings.geminiApiKey);

    case 'ollama':
      return await callOllama(text, targetLangName, settings.ollamaUrl, settings.ollamaModel);

    case 'lmstudio':
      return await callLMStudio(text, targetLangName, settings.lmStudioUrl, settings.lmStudioModel);

    default:
      throw new Error('未対応のプロバイダーです');
  }
}

// OpenAI API
async function callOpenAI(text, targetLanguage, apiKey) {
  if (!apiKey) throw new Error('OpenAI APIキーが設定されていません');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text to ${targetLanguage} accurately and naturally. Return ONLY the translation without any explanations, comments, or additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API エラー: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Claude API
async function callClaude(text, targetLanguage, apiKey) {
  if (!apiKey) throw new Error('Claude APIキーが設定されていません');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: `You are a professional translator. Translate the given text to ${targetLanguage} accurately and naturally. Respond with ONLY the translation, no explanations or additional text.`,
      messages: [{ role: 'user', content: text }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API エラー: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

// Gemini API
async function callGemini(text, targetLanguage, apiKey) {
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Translate the following text to ${targetLanguage}. Return ONLY the translation:\n\n${text}` }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API エラー: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// Ollama
async function callOllama(text, targetLanguage, url, model) {
  const baseUrl = url || 'http://localhost:11434';
  const modelName = model || 'gemma2:9b';

  if (!modelName) {
    throw new Error('Ollamaモデル名が設定されていません');
  }

  const prompt = `You are a professional translator. Translate the following text to ${targetLanguage} accurately and naturally. Return ONLY the translation without any explanations, comments, or additional text.\n\nText to translate: ${text}`;

  const requestUrl = `${baseUrl}/api/generate`;
  const requestBody = {
    model: modelName,
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 500
    }
  };

  console.log('=== Ollama API Debug ===');
  console.log('Request URL:', requestUrl);
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('Model:', modelName);
  console.log('Base URL:', baseUrl);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response Body:', errorText);

      if (response.status === 404) {
        throw new Error(`Ollamaモデル '${modelName}' が見つかりません。モデルをダウンロードするか、設定を確認してください。`);
      }
      if (response.status === 403) {
        throw new Error(`Ollama API アクセス拒否 (403): OLLAMA_ORIGINS=* を設定してOllamaを起動してください。`);
      }
      throw new Error(`Ollama API エラー: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response Data:', data);

    if (!data.response) {
      console.log('Invalid response - missing response field');
      throw new Error('Ollamaからの応答が無効です');
    }

    console.log('Translation Result:', data.response);
    return data.response.trim();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Ollamaサーバーに接続できません。http://localhost:11434 で実行されていることを確認してください。');
    }
    throw error;
  }
}

// LM Studio
async function callLMStudio(text, targetLanguage, url, model) {
  const baseUrl = url || 'http://localhost:1234';
  const modelName = model || 'local-model';

  if (!modelName) {
    throw new Error('LM Studioモデル名が設定されていません');
  }

  const prompt = `You are a professional translator. Translate the given text to ${targetLanguage} accurately and naturally. Return ONLY the translation without any explanations, comments, or additional text.`;

  const requestUrl = `${baseUrl}/api/v0/chat/completions`;
  const requestBody = {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: text
      }
    ],
    max_tokens: 500,
    temperature: 0.1,
    stream: false
  };

  console.log('=== LM Studio API Debug ===');
  console.log('Request URL:', requestUrl);
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('Model:', modelName);
  console.log('Base URL:', baseUrl);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response Body:', errorText);

      if (response.status === 404) {
        throw new Error(`LM Studioモデル '${modelName}' が見つかりません。モデルをロードするか、設定を確認してください。`);
      }
      if (response.status === 400) {
        throw new Error(`LM Studio API リクエストエラー (400): ${errorText}`);
      }
      if (response.status === 500) {
        throw new Error(`LM Studio サーバーエラー (500): ${errorText}`);
      }
      throw new Error(`LM Studio API エラー: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response Data:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.log('Invalid response - missing choices or message field');
      throw new Error('LM Studioからの応答が無効です');
    }

    console.log('Translation Result:', data.choices[0].message.content);
    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('LM Studioサーバーに接続できません。サーバーが起動していることを確認してください。');
    }
    throw error;
  }
}

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener(() => {
  // 初期設定
  chrome.storage.sync.set({
    targetLanguage: 'ja',
    autoTranslate: false,
    llmProvider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'gemma2:9b',
    lmStudioUrl: 'http://localhost:1234',
    lmStudioModel: 'gemma2:9b'
  });

  // コンテキストメニューの追加
  chrome.contextMenus.create({
    id: 'translateSelected',
    title: 'このテキストを翻訳',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translateSelected' && info.selectionText) {
    chrome.storage.sync.get(['targetLanguage'], (result) => {
      const targetLang = result.targetLanguage || 'ja';

      translateText(info.selectionText, targetLang)
        .then(translation => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'showTranslation',
            originalText: info.selectionText,
            translation: translation
          }).catch(error => {
            console.error('Failed to send message to tab:', error);
            // Content scriptが読み込まれていない場合は、content scriptを注入してから再試行
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }).then(() => {
              // content scriptの注入後、少し待ってから再送信
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'showTranslation',
                  originalText: info.selectionText,
                  translation: translation
                }).catch(err => {
                  console.error('Failed to send message after injection:', err);
                });
              }, 100);
            }).catch(err => {
              console.error('Failed to inject content script:', err);
            });
          });
        })
        .catch(error => {
          console.error('Context menu translation error:', error);
          chrome.tabs.sendMessage(tab.id, {
            action: 'showTranslation',
            originalText: info.selectionText,
            translation: `翻訳エラー: ${error.message}`
          }).catch(err => {
            console.error('Failed to send error message to tab:', err);
          });
        });
    });
  }
});
