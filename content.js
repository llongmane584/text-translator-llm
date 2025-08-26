let translatorIcon = null;
let floatingTranslator = null;
let selectedText = '';
let selectionRange = null;

// テキスト選択の監視
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection() {
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
  
  translatorIcon.addEventListener('click', showFloatingTranslator);
  
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
  removeTranslatorIcon();
  removeFloatingTranslator();
  
  if (!selectedText) return;
  
  floatingTranslator = document.createElement('div');
  floatingTranslator.className = 'floating-translator';
  floatingTranslator.innerHTML = `
    <div class="floating-translator-header">
      <span class="floating-translator-title">Text Translator LLM</span>
      <button class="close-btn" onclick="removeFloatingTranslator()">&times;</button>
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
      <button class="action-btn" onclick="copyTranslation()">コピー</button>
      <button class="action-btn primary-btn" onclick="removeFloatingTranslator()">閉じる</button>
    </div>
  `;
  
  // 位置を設定
  if (selectionRange) {
    const rect = selectionRange.getBoundingClientRect();
    floatingTranslator.style.left = `${rect.left + window.scrollX}px`;
    floatingTranslator.style.top = `${rect.bottom + window.scrollY + 10}px`;
  }
  
  document.body.appendChild(floatingTranslator);
  
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
    const targetLang = result.targetLanguage || 'en';
    
    // バックグラウンドスクリプトに翻訳リクエストを送信
    chrome.runtime.sendMessage({
      action: 'translate',
      text: text,
      targetLanguage: targetLang
    }, (response) => {
      if (response && response.translation) {
        updateTranslationResult(response.translation);
      } else {
        updateTranslationResult('翻訳に失敗しました。');
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

// グローバル関数として定義（HTML内のonclickで使用）
window.removeFloatingTranslator = removeFloatingTranslator;
window.copyTranslation = copyTranslation;

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