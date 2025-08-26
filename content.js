let translatorIcon = null;
let floatingTranslator = null;
let selectedText = '';
let selectionRange = null;
let isResizing = false;
let resizeStartTime = 0;
let lastResizeEndTime = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dialogStartX = 0;
let dialogStartY = 0;

// サイズ制限チェック関数
function checkSizeLimits(element) {
  if (!element) return;

  const computedStyle = window.getComputedStyle(element);
  const currentWidth = parseFloat(computedStyle.width);
  const currentHeight = parseFloat(computedStyle.height);
  const maxWidth = parseFloat(computedStyle.maxWidth);
  const maxHeight = parseFloat(computedStyle.maxHeight);

  const atMaxWidth = currentWidth >= maxWidth - 5; // 5px の余裕を持たせる
  const atMaxHeight = currentHeight >= maxHeight - 5;

  if (atMaxWidth || atMaxHeight) {
    element.classList.add('at-max-size');
  } else {
    element.classList.remove('at-max-size');
  }
}

// テキスト量に基づいてダイアログの適切な高さを計算
function calculateDialogHeight(text) {
  if (!text) return 300; // デフォルト高さ

  // 1行あたりの文字数を推定（日本語・英語混在を考慮）
  const averageCharsPerLine = 50;
  const textLines = text.split('\n');
  let estimatedLines = 0;

  textLines.forEach(line => {
    const lineLength = line.length;
    estimatedLines += Math.max(1, Math.ceil(lineLength / averageCharsPerLine));
  });

  // 1行あたりの高さ（フォントサイズ14px + line-height 1.4）
  const lineHeight = 14 * 1.4; // 約19.6px
  const textContentHeight = estimatedLines * lineHeight;

  // 固定要素の高さを計算
  const headerHeight = 49; // ヘッダー部分
  const labelHeight = 18; // ラベル（12px + margin 6px）
  const paddingHeight = 20; // text-content padding (10px × 2)
  const sectionGap = 16; // section間のgap
  const contentPadding = 32; // content padding (16px × 2)
  const actionsHeight = 45; // アクションボタン部分
  const borderHeight = 2; // 上下のborder

  // 各セクション（原文・翻訳結果）の必要高さ
  const sectionHeight = labelHeight + paddingHeight + Math.max(60, textContentHeight); // 最小60px

  // 合計高さを計算
  const totalHeight = headerHeight + contentPadding + (sectionHeight * 2) + sectionGap + actionsHeight + borderHeight;

  // 最小200px、最大500pxで制限
  return Math.min(Math.max(totalHeight, 200), 500);
}

// ダイアログサイズを調整
function adjustDialogSize(element, text) {
  if (!element || !text) return;

  const newHeight = calculateDialogHeight(text);
  element.style.height = `${newHeight}px`;
}

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
      position: fixed;
      min-width: 300px;
      max-width: 70vw;
      min-height: 200px;
      max-height: 70vh;
      width: min(400px, 50vw);
      height: min(300px, 40vh);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #dadce0;
      resize: both;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
    .floating-translator-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      border-bottom: 1px solid #dadce0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
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
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: hidden;
    }
    .text-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
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
      flex: 1;
      overflow-y: auto;
      min-height: 60px;
      font-weight: 500;
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
      padding: 2px 6px 6px 8px;
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
    .floating-translator::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, transparent 50%, #dadce0 50%);
      cursor: nw-resize;
      pointer-events: none;
    }
    .floating-translator.resizing {
      box-shadow: 0 4px 24px rgba(26, 115, 232, 0.3);
      border-color: #1a73e8;
    }
    .floating-translator.at-max-size {
      box-shadow: 0 4px 16px rgba(234, 67, 53, 0.2);
      border-color: #ea4335;
    }
    .floating-translator.at-max-size::after {
      background: linear-gradient(135deg, transparent 50%, #ea4335 50%);
    }
  `;
  document.head.appendChild(style);
}

// ページ読み込み時にスタイルを注入
injectStyles();

// テキスト選択の監視
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

// 改行を保持してテキストを安全にHTMLに変換する関数
function formatTextWithLineBreaks(text) {
  if (!text) return '';
  // HTMLエスケープしてから改行を<br>タグに変換
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\n/g, '<br>');
}

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
        <div class="text-content">${formatTextWithLineBreaks(selectedText)}</div>
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

  // 位置を設定（fixedなのでスクロール位置は不要）
  if (selectionRange) {
    const rect = selectionRange.getBoundingClientRect();
    floatingTranslator.style.left = `${rect.left}px`;
    floatingTranslator.style.top = `${rect.bottom + 10}px`;
  }

  document.body.appendChild(floatingTranslator);

  // ダイアログサイズを調整
  adjustDialogSize(floatingTranslator, selectedText);

  // イベントリスナーを追加
  const closeBtn = floatingTranslator.querySelector('.close-btn');
  const copyBtn = floatingTranslator.querySelector('.copy-btn');
  const closeTranslatorBtn = floatingTranslator.querySelector('.close-translator-btn');

  if (closeBtn) closeBtn.addEventListener('click', removeFloatingTranslator);
  if (copyBtn) copyBtn.addEventListener('click', copyTranslation);
  if (closeTranslatorBtn) closeTranslatorBtn.addEventListener('click', removeFloatingTranslator);

  // ドラッグとリサイズ操作の検知
  floatingTranslator.addEventListener('mousedown', (e) => {
    // 閉じるボタンをクリックした場合はドラッグしない
    if (e.target.classList.contains('close-btn')) {
      return;
    }

    // CSSのresizeカーソルをチェック
    const computedStyle = window.getComputedStyle(e.target);
    const cursor = computedStyle.cursor;

    const rect = floatingTranslator.getBoundingClientRect();
    const isNearRightEdge = e.clientX > rect.right - 20;
    const isNearBottomEdge = e.clientY > rect.bottom - 20;

    // リサイズハンドル領域またはresizeカーソルが検出された場合
    if ((isNearRightEdge && isNearBottomEdge) ||
      cursor.includes('resize') || cursor.includes('nw-resize') || cursor.includes('se-resize')) {
      isResizing = true;
      resizeStartTime = Date.now();
      floatingTranslator.classList.add('resizing');
      checkSizeLimits(floatingTranslator);
      console.log('Resize started at', resizeStartTime);
    }
    // ヘッダー部分でのドラッグ開始
    else if (e.target.closest('.floating-translator-header')) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      // 現在のダイアログ位置を取得
      const style = window.getComputedStyle(floatingTranslator);
      dialogStartX = parseInt(style.left) || 0;
      dialogStartY = parseInt(style.top) || 0;

      e.preventDefault();
      console.log('Drag started');
    }
  });

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
    translationElement.innerHTML = formatTextWithLineBreaks(translation);
    translationElement.classList.remove('loading');
  }
}

function copyTranslation() {
  if (floatingTranslator) {
    const translationElement = floatingTranslator.querySelector('.translation-content');
    // HTMLから<br>タグを改行に変換してテキストとしてコピー
    const text = translationElement.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');

    navigator.clipboard.writeText(text).then(() => {
      // コピー成功の表示
      const button = floatingTranslator.querySelector('.copy-btn');
      const originalText = button.textContent;
      button.textContent = 'コピー完了!';
      setTimeout(() => {
        if (button) button.textContent = originalText;
      }, 1000);
    });
  }
}


// ページ外クリックで閉じる（リサイズ中およびリサイズ直後は除く）
document.addEventListener('click', (e) => {
  const now = Date.now();
  const timeSinceLastResize = now - lastResizeEndTime;
  const recentlyResized = timeSinceLastResize < 200; // 200ms以内はリサイズ直後とみなす

  if (floatingTranslator &&
    !floatingTranslator.contains(e.target) &&
    !translatorIcon?.contains(e.target) &&
    !isResizing &&
    !isDragging &&
    !recentlyResized) {
    console.log('Closing translator via outside click');
    removeFloatingTranslator();
  } else if (recentlyResized) {
    console.log('Skipping close due to recent resize, time since resize:', timeSinceLastResize + 'ms');
  }
});

// ドラッグとリサイズ中の処理
document.addEventListener('mousemove', (e) => {
  if (isResizing && floatingTranslator) {
    checkSizeLimits(floatingTranslator);
  }

  if (isDragging && floatingTranslator) {
    // ドラッグ中の位置計算
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    let newX = dialogStartX + deltaX;
    let newY = dialogStartY + deltaY;

    // 画面境界チェック（fixed positionなので viewport 基準）
    const rect = floatingTranslator.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 左端制限（最低50px表示）
    newX = Math.max(-rect.width + 50, newX);
    // 右端制限
    newX = Math.min(viewportWidth - 50, newX);
    // 上端制限（最低30px表示）
    newY = Math.max(-rect.height + 30, newY);
    // 下端制限（ダイアログ下端が画面下端を超えないように）
    newY = Math.min(viewportHeight - rect.height + 30, newY);

    floatingTranslator.style.left = `${newX}px`;
    floatingTranslator.style.top = `${newY}px`;
  }
});

// ドラッグとリサイズ終了の検知
document.addEventListener('mouseup', (e) => {
  if (isResizing) {
    isResizing = false;
    lastResizeEndTime = Date.now();
    const resizeDuration = lastResizeEndTime - resizeStartTime;

    if (floatingTranslator) {
      floatingTranslator.classList.remove('resizing');
      // 最終的なサイズ制限チェック
      setTimeout(() => {
        checkSizeLimits(floatingTranslator);
      }, 50); // わずかな遅延で最終的なサイズを取得
    }

    console.log('Resize ended at', lastResizeEndTime, 'duration:', resizeDuration + 'ms');
  }

  if (isDragging) {
    isDragging = false;
    console.log('Drag ended');
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
        <div class="text-content">${formatTextWithLineBreaks(originalText)}</div>
      </div>
      <div class="text-section">
        <label>翻訳結果:</label>
        <div class="text-content translation-content">${formatTextWithLineBreaks(translation)}</div>
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

  // ダイアログサイズを調整
  adjustDialogSize(floatingTranslator, originalText);

  // イベントリスナーを追加
  const closeBtn = floatingTranslator.querySelector('.close-btn');
  const copyBtn = floatingTranslator.querySelector('.copy-btn');
  const closeTranslatorBtn = floatingTranslator.querySelector('.close-translator-btn');

  if (closeBtn) closeBtn.addEventListener('click', removeFloatingTranslator);
  if (copyBtn) copyBtn.addEventListener('click', copyTranslation);
  if (closeTranslatorBtn) closeTranslatorBtn.addEventListener('click', removeFloatingTranslator);

  // ドラッグとリサイズ操作の検知
  floatingTranslator.addEventListener('mousedown', (e) => {
    // 閉じるボタンをクリックした場合はドラッグしない
    if (e.target.classList.contains('close-btn')) {
      return;
    }

    // CSSのresizeカーソルをチェック
    const computedStyle = window.getComputedStyle(e.target);
    const cursor = computedStyle.cursor;

    const rect = floatingTranslator.getBoundingClientRect();
    const isNearRightEdge = e.clientX > rect.right - 20;
    const isNearBottomEdge = e.clientY > rect.bottom - 20;

    // リサイズハンドル領域またはresizeカーソルが検出された場合
    if ((isNearRightEdge && isNearBottomEdge) ||
      cursor.includes('resize') || cursor.includes('nw-resize') || cursor.includes('se-resize')) {
      isResizing = true;
      resizeStartTime = Date.now();
      floatingTranslator.classList.add('resizing');
      checkSizeLimits(floatingTranslator);
      console.log('Resize started at', resizeStartTime);
    }
    // ヘッダー部分でのドラッグ開始
    else if (e.target.closest('.floating-translator-header')) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      // 現在のダイアログ位置を取得
      const style = window.getComputedStyle(floatingTranslator);
      dialogStartX = parseInt(style.left) || 0;
      dialogStartY = parseInt(style.top) || 0;

      e.preventDefault();
      console.log('Drag started');
    }
  });
}
