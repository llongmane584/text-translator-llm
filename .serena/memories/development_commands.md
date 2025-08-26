# Development Commands

## Testing the Extension
1. Load unpacked extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select project folder

2. Test functionality:
   - Select text on any webpage
   - Verify translation icon appears
   - Test translation with configured LLM provider

## Debugging
- Content script: Inspect page and check console
- Background script: Extensions page > "Inspect views: background page"  
- Popup: Right-click extension icon > "Inspect popup"

## Local LLM Testing

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

## Git Commands
- Repository URL: git@llongmane584:llongmane584/text-translator-llm.git
- Main branch: main
- Standard git workflow applies

## No Build Process
This is a pure JavaScript Chrome extension with no build process, package.json, or dependency management required.