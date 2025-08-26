# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that provides text translation using multiple LLM providers. Users can select text on any webpage to trigger a translation interface similar to Google Translate.

## Repository Information

- Repository URL: git@llongmane584:llongmane584/text-translator-llm.git
- Main branch: main

## Architecture

### Core Components

1. **Content Script (content.js)**: Handles text selection detection, UI injection, and translation interface
   - Monitors mouseup/keyup events for text selection
   - Creates floating translator icon at selection position
   - Manages floating translation window with original and translated text
   - Handles copy functionality and keyboard shortcuts (ESC to close)

2. **Background Service Worker (background.js)**: Core translation logic and API management
   - Processes translation requests from content script
   - Manages multiple LLM provider integrations (OpenAI, Claude, Gemini, Ollama, LM Studio)
   - Handles context menu integration
   - Stores and retrieves settings from Chrome storage

3. **Popup Interface (popup.html/js/css)**: Extension settings and configuration
   - Language selection (EN, JA, KO, ZH, ES, FR, DE)
   - LLM provider selection and API key management
   - Auto-translate toggle
   - Dynamic provider-specific settings UI

### LLM Provider Integration

The extension supports both cloud and local LLM providers:

**Cloud Providers:**
- OpenAI (gpt-3.5-turbo)
- Anthropic Claude (claude-3-haiku-20240307)  
- Google Gemini (gemini-pro)

**Local Providers:**
- Ollama (default: http://localhost:11434 with gemma2:9b model)
- LM Studio (default: http://localhost:1234 with REST API v0)

Each provider has its own API implementation with standardized error handling and response processing.

## Development Workflow

### Testing the Extension

1. Load unpacked extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select project folder

2. Test text selection functionality:
   - Select text on any webpage
   - Verify translation icon appears
   - Test translation with configured LLM provider

3. Debug using Chrome DevTools:
   - Content script: Inspect page and check console
   - Background script: Extensions page > "Inspect views: background page"
   - Popup: Right-click extension icon > "Inspect popup"

### Configuration

API keys and settings are stored in Chrome's sync storage. Default settings:
- Target language: English (en)
- Auto-translate: enabled
- Default provider: Ollama  
- Ollama URL: http://localhost:11434
- LM Studio URL: http://localhost:1234 (REST API v0)

### File Structure

- `manifest.json`: Extension manifest (v3) with permissions and component declarations
- `content.js`: Text selection handling and UI injection (injected into all URLs)
- `background.js`: Service worker for translation API calls and context menu
- `popup.html/js/css`: Settings interface accessed via extension icon
- `icons/`: Extension icons (16px, 32px, 48px, 128px)

### Code Style

- Pure HTML/CSS/JavaScript (no build process required)
- Japanese comments and UI text
- Chrome Extension Manifest V3 compliance
- Async/await pattern for API calls
- Chrome storage sync for settings persistence

## Testing Local LLM Providers

### Ollama Setup
```bash
ollama pull llama2
ollama serve
```

### LM Studio Setup
1. Download and install LM Studio (requires version 0.3.6 or newer)
2. Load a model in LM Studio
3. Start the REST API server:
   ```bash
   lms server start
   ```
   Or use the GUI to start the server (default: http://localhost:1234)
4. Configure extension:
   - Select "LM Studio" as provider in popup settings
   - Verify URL (default: http://localhost:1234)  
   - Use the "更新" button to load available models dynamically
   - Select a loaded model from the dropdown

## Common Issues

- **CORS errors with local LLMs**: Ensure local servers allow cross-origin requests
- **API key validation**: Check browser console for authentication errors  
- **Translation timeout**: Large text may exceed LLM token limits
- **Content script conflicts**: Other extensions may interfere with text selection events