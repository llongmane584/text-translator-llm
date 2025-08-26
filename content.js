let translatorIcon = null;
let floatingTranslator = null;
let selectedText = '';
let selectionRange = null;

// CSSスタイルをページに注入
function injectStyles() {
  if (document.getElementById('translator-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'translator-styles';
  style.textContent = `
    .translator-icon {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #1a73e8;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .translator-icon:hover {
      background: #1557b0;
      transform: scale(1.1);
    }
    .translator-icon::before {
      content: "翻";
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .floating-translator {
      position: absolute;
      min-width: 300px;
      max-width: 400px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #dadce0;
    }
    .floating-translator-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      border-bottom: 1px solid #dadce0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .floating-translator-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover {
      color: #333;
    }
    .floating-translator-content {
      padding: 16px;
    }
    .text-section {
      margin-bottom: 16px;
    }
    .text-section label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .text-content {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
      color: #333;
      border: 1px solid #e8eaed;
      max-height: 120px;
      overflow-y: auto;
    }
    .translation-content {
      background: #e8f5e8;
      border: 1px solid #c8e6c9;
    }
    .loading {
      color: #666;
      font-style: italic;
    }
    .floating-translator-actions {
      padding: 12px 16px;
      border-top: 1px solid #dadce0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .action-btn {
      padding: 6px 12px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      background: white;
      font-size: 13px;
      cursor: pointer;
      color: #333;
    }
    .action-btn:hover {
      background: #f8f9fa;
    }
    .primary-btn {
      background: #1a73e8;
      color: white;
      border-color: #1a73e8;
    }
    .primary-btn:hover {
      background: #1557b0;
      border-color: #1557b0;
    }
  `;
  document.head.appendChild(style);
}

// ページ読み込み時にスタイルを注入
injectStyles();

// テキスト選択の監視
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection(e) {
  // アイコンクリック時は処理をスキップ
  if (e && e.target && translatorIcon && translatorIcon.contains(e.target)) {
    return;
  }
  
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  // 既存のアイコンを削除
  removeTranslatorIcon();
  
  if (text && text.length > 0) {
    selectedText = text;
    selectionRange = selection.getRangeAt(0).cloneRange();
    showTranslatorIcon(selection);
  }
}

function showTranslatorIcon(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  translatorIcon = document.createElement('div');
  translatorIcon.className = 'translator-icon';
  translatorIcon.style.left = `${rect.right + window.scrollX + 5}px`;
  translatorIcon.style.top = `${rect.top + window.scrollY}px`;
  
  // mousedownで先にテキストと範囲を保存し、デフォルト動作を防ぐ
  translatorIcon.addEventListener('mousedown', (e) => {
    e.preventDefault(); // クリックによる選択解除を防ぐ
    e.stopPropagation();
  });
  
  translatorIcon.addEventListener('click', (e) => {
    console.log('Icon clicked!', selectedText);
    e.preventDefault();
    e.stopPropagation();
    showFloatingTranslator();
  });
  
  document.body.appendChild(translatorIcon);
  
  // 3秒後に自動削除
  setTimeout(() => {
    removeTranslatorIcon();
  }, 3000);
}

function removeTranslatorIcon() {
  if (translatorIcon) {
    translatorIcon.remove();
    translatorIcon = null;
  }
}

function showFloatingTranslator() {
  console.log('showFloatingTranslator called with text:', selectedText);
  removeTranslatorIcon();
  removeFloatingTranslator();
  
  if (!selectedText) {
    console.log('No selected text, returning');
    return;
  }
  
  floatingTranslator = document.createElement('div');
  floatingTranslator.className = 'floating-translator';
  floatingTranslator.innerHTML = `
    <div class="floating-translator-header">
      <span class="floating-translator-title">Text Translator LLM</span>
      <button class="close-btn">&times;</button>
    </div>
    <div class="floating-translator-content">
      <div class="text-section">
        <label>原文:</label>
        <div class="text-content">${selectedText}</div>
      </div>
      <div class="text-section">
        <label>翻訳結果:</label>
        <div class="text-content translation-content loading">翻訳中...</div>
      </div>
    </div>
    <div class="floating-translator-actions">
      <button class="action-btn copy-btn">コピー</button>
      <button class="action-btn primary-btn close-translator-btn">閉じる</button>
    </div>
  `;
  
  // 位置を設定
  if (selectionRange) {
    const rect = selectionRange.getBoundingClientRect();
    floatingTranslator.style.left = `${rect.left + window.scrollX}px`;
    floatingTranslator.style.top = `${rect.bottom + window.scrollY + 10}px`;
  }
  
  document.body.appendChild(floatingTranslator);
  
  // イベントリスナーを追加
  const closeBtn = floatingTranslator.querySelector('.close-btn');
  const copyBtn = floatingTranslator.querySelector('.copy-btn');
  const closeTranslatorBtn = floatingTranslator.querySelector('.close-translator-btn');
  
  if (closeBtn) closeBtn.addEventListener('click', removeFloatingTranslator);
  if (copyBtn) copyBtn.addEventListener('click', copyTranslation);
  if (closeTranslatorBtn) closeTranslatorBtn.addEventListener('click', removeFloatingTranslator);
  
  // 翻訳を実行
  translateText(selectedText);
}

function removeFloatingTranslator() {
  if (floatingTranslator) {
    floatingTranslator.remove();
    floatingTranslator = null;
  }
}

function translateText(text) {
  // 設定された言語を取得
  chrome.storage.sync.get(['targetLanguage'], (result) => {
    const targetLang = result.targetLanguage || 'ja';
    
    // バックグラウンドスクリプトに翻訳リクエストを送信
    chrome.runtime.sendMessage({
      action: 'translate',
      text: text,
      targetLanguage: targetLang
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        updateTranslationResult('拡張機能との接続エラー。ページを再読み込みしてください。');
        return;
      }
      if (response && response.translation) {
        updateTranslationResult(response.translation);
      } else if (response && response.error) {
        updateTranslationResult(`エラー: ${response.error}`);
      } else {
        updateTranslationResult('翻訳に失敗しました。設定を確認してください。');
      }
    });
  });
}

function updateTranslationResult(translation) {
  if (floatingTranslator) {
    const translationElement = floatingTranslator.querySelector('.translation-content');
    translationElement.textContent = translation;
    translationElement.classList.remove('loading');
  }
}

function copyTranslation() {
  if (floatingTranslator) {
    const translationElement = floatingTranslator.querySelector('.translation-content');
    const text = translationElement.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      // コピー成功の表示
      const button = floatingTranslator.querySelector('.action-btn');
      const originalText = button.textContent;
      button.textContent = 'コピー完了!';
      setTimeout(() => {
        if (button) button.textContent = originalText;
      }, 1000);
    });
  }
}


// ページ外クリックで閉じる
document.addEventListener('click', (e) => {
  if (floatingTranslator && !floatingTranslator.contains(e.target) && !translatorIcon?.contains(e.target)) {
    removeFloatingTranslator();
  }
});

// ESCキーで閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    removeFloatingTranslator();
    removeTranslatorIcon();
  }
});

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'showTranslation') {
    selectedText = request.originalText;
    showFloatingTranslatorWithTranslation(request.originalText, request.translation);
    sendResponse({ success: true });
  }
});

// コンテキストメニューからの翻訳結果を表示
function showFloatingTranslatorWithTranslation(originalText, translation) {
  removeTranslatorIcon();
  removeFloatingTranslator();
  
  floatingTranslator = document.createElement('div');
  floatingTranslator.className = 'floating-translator';
  floatingTranslator.innerHTML = `
    <div class="floating-translator-header">
      <span class="floating-translator-title">Text Translator LLM</span>
      <button class="close-btn">&times;</button>
    </div>
    <div class="floating-translator-content">
      <div class="text-section">
        <label>原文:</label>
        <div class="text-content">${originalText}</div>
      </div>
      <div class="text-section">
        <label>翻訳結果:</label>
        <div class="text-content translation-content">${translation}</div>
      </div>
    </div>
    <div class="floating-translator-actions">
      <button class="action-btn copy-btn">コピー</button>
      <button class="action-btn primary-btn close-translator-btn">閉じる</button>
    </div>
  `;
  
  // 画面中央に配置
  floatingTranslator.style.position = 'fixed';
  floatingTranslator.style.left = '50%';
  floatingTranslator.style.top = '50%';
  floatingTranslator.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(floatingTranslator);
  
  // イベントリスナーを追加
  const closeBtn = floatingTranslator.querySelector('.close-btn');
  const copyBtn = floatingTranslator.querySelector('.copy-btn');
  const closeTranslatorBtn = floatingTranslator.querySelector('.close-translator-btn');
  
  if (closeBtn) closeBtn.addEventListener('click', removeFloatingTranslator);
  if (copyBtn) copyBtn.addEventListener('click', copyTranslation);
  if (closeTranslatorBtn) closeTranslatorBtn.addEventListener('click', removeFloatingTranslator);
}