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

    const provider = settings.llmProvider || 'openai';
    const translation = await callTranslationAPI(text, targetLanguage, provider, settings);
    return translation;
  } catch (error) {
    throw new Error(`翻訳に失敗しました: ${error.message}`);
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
  const modelName = model || 'llama2';
  
  const systemPrompt = `You are a professional translator. Translate text to ${targetLanguage} accurately. Return ONLY the translation.`;
  const userPrompt = `${systemPrompt}\n\nTranslate: ${text}`;
  
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      prompt: userPrompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 500
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama エラー: ${response.status}`);
  }

  const data = await response.json();
  return data.response.trim();
}

// LM Studio
async function callLMStudio(text, targetLanguage, url, model) {
  const baseUrl = url || 'http://localhost:1234';
  const modelName = model || 'local-model';
  
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
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
    throw new Error(`LM Studio エラー: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener(() => {
  // 初期設定
  chrome.storage.sync.set({
    targetLanguage: 'en',
    autoTranslate: true,
    llmProvider: 'openai',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama2',
    lmStudioUrl: 'http://localhost:1234',
    lmStudioModel: 'local-model'
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
      const targetLang = result.targetLanguage || 'en';
      
      translateText(info.selectionText, targetLang)
        .then(translation => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'showTranslation',
            originalText: info.selectionText,
            translation: translation
          });
        })
        .catch(error => {
          console.error('Context menu translation error:', error);
        });
    });
  }
});