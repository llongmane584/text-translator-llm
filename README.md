# Text Translator LLM - Chrome Extension

テキスト選択時に翻訳アイコンを表示し、複数のLLMプロバイダーを使って翻訳を行うChrome拡張機能です。

## 特徴

- **テキスト選択による翻訳**: ページ上のテキストを選択すると翻訳アイコンが表示
- **複数LLMプロバイダー対応**:
  - **クラウドLLM**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini)
  - **ローカルLLM**: Ollama, LM Studio
- **フローティングUI**: Google Translateのような直感的な操作
- **多言語サポート**: 英語、日本語、韓国語、中国語、スペイン語、フランス語、ドイツ語

## インストール

1. このリポジトリをクローンまたはダウンロード
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのフォルダを選択

## 設定

拡張機能のポップアップ（ツールバーのアイコンをクリック）から各LLMプロバイダーの設定を行います。

### クラウドLLM設定

#### OpenAI
- OpenAI APIキーを取得: https://platform.openai.com/api-keys
- ポップアップでAPIキーを設定

#### Claude
- Anthropic APIキーを取得: https://console.anthropic.com/
- ポップアップでAPIキーを設定

#### Gemini
- Google AI Studio でAPIキーを取得: https://makersuite.google.com/app/apikey
- ポップアップでAPIキーを設定

### ローカルLLM設定

#### Ollama
1. Ollamaをインストール: https://ollama.ai/
2. モデルをダウンロード: `ollama pull llama2`
3. Ollamaを起動: `ollama serve`
4. 拡張機能でURL（http://localhost:11434）とモデル名を設定

#### LM Studio
1. LM Studioをインストール: https://lmstudio.ai/
2. モデルをダウンロード・ロード
3. ローカルサーバーを起動
4. 拡張機能でURL（http://localhost:1234）とモデル名を設定

## 使用方法

1. 任意のWebページでテキストを選択
2. 表示される翻訳アイコンをクリック
3. フローティングウィンドウで翻訳結果を確認
4. 必要に応じて翻訳結果をコピー

## ファイル構成

```
text-translator-llm/
├── manifest.json          # 拡張機能の設定
├── popup.html             # 設定UI
├── popup.css              # 設定UIのスタイル
├── popup.js               # 設定UIの動作
├── content.js             # コンテンツスクリプト
├── background.js          # バックグラウンドスクリプト
├── icons/                 # 拡張機能アイコン
└── README.md             # このファイル
```

## 開発

このプロジェクトは純粋なHTML/CSS/JavaScriptで構築されており、ビルドプロセスは不要です。

### デバッグ

1. Chrome DevToolsでコンソールを確認
2. 拡張機能の管理ページで「エラー」を確認
3. バックグラウンドスクリプトのログ: `chrome://extensions/` > 詳細 > 「バックグラウンド ページを調べる」

## ライセンス

MIT License

## 注意事項

- APIキーは安全に管理してください
- ローカルLLMを使用する場合は適切なモデルを事前にダウンロードしてください
- 翻訳の精度はLLMプロバイダーとモデルに依存します
