# Text Translator LLM - Project Overview

## Purpose
This is a Chrome extension that provides text translation using multiple LLM providers. Users can select text on any webpage to trigger a translation interface similar to Google Translate.

## Tech Stack
- Pure HTML/CSS/JavaScript (no build process required)
- Chrome Extension Manifest V3
- Multiple LLM provider integrations:
  - Cloud: OpenAI, Claude, Gemini
  - Local: Ollama, LM Studio

## Architecture
- **Content Script (content.js)**: Text selection detection and UI injection
- **Background Service Worker (background.js)**: Translation logic and API management  
- **Popup Interface (popup.html/js/css)**: Settings and configuration
- **Icons**: Extension icons in multiple sizes (16px, 32px, 48px, 128px)

## Key Features
- Text selection-based translation
- Multiple LLM provider support
- Chrome storage sync for settings
- Auto-translate toggle
- Multi-language support (EN, JA, KO, ZH, ES, FR, DE)
- Context menu integration