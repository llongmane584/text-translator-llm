# Code Style and Conventions

## Language and Comments
- Japanese comments and UI text throughout the codebase
- Pure HTML/CSS/JavaScript (no frameworks)
- No build process required

## JavaScript Style
- Async/await pattern for API calls
- Chrome Extension Manifest V3 compliance
- Chrome storage sync for settings persistence
- Modular provider-specific API implementations

## File Structure
- `manifest.json`: Extension manifest with permissions
- `content.js`: Text selection handling (injected into all URLs)
- `background.js`: Service worker for API calls
- `popup.html/js/css`: Settings interface
- `icons/`: Extension icons in multiple sizes

## CSS Style
- Standard CSS (no preprocessors)
- Component-based class naming
- Responsive design for popup interface

## Code Quality
- Error handling for all API calls
- CORS considerations for local LLM providers
- Token limit awareness for large text
- Cross-browser extension compatibility