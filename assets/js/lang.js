/**
 * Internationalization (i18n) Module
 * ===================================
 * 
 * SRS Reference: NFR-009.3 (English and Sesotho language support)
 * 
 * Provides bilingual support for the Bohloko Family Farm website.
 * Supports English (en) and Sesotho (st) languages with runtime
 * switching and persistent language preference.
 * 
 * Architecture:
 *   - Declarative Translation: HTML elements use data-i18n attributes
 *   - JSON Translation Files: Loaded from js/lang/{lang}.json
 *   - Persistent Preference: Language stored in localStorage
 *   - DOM-Based Application: Translations applied by querying data-i18n
 * 
 * NFR-009.3 Requirements Covered:
 *   1. Support for English and Sesotho languages
 *   2. Language toggle button in navigation
 *   3. Persistent language preference across sessions
 * 
 * Coding Principles:
 *   1. Progressive Enhancement
 *      - Page works without JS (shows default text)
 *      - Translations enhance but don't break the page
 * 
 *   2. Separation of Concerns
 *      - Translation logic separate from page content
 *      - JSON files contain only translated strings
 * 
 *   3. Fail-Safe Design
 *      - t() returns the key itself if translation missing
 *      - Console error on failed JSON fetch (no crash)
 * 
 *   4. DRY (Don't Repeat Yourself)
 *      - Same translation key used across multiple pages
 *      - Single loadLanguage() function handles all switching
 * 
 * Usage in HTML:
 *   <span data-i18n="nav.home">Home</span>
 *   <input placeholder="Search..." data-i18n-placeholder="search.placeholder">
 *   <div data-i18n-html="content.welcome">Welcome!</div>
 * 
 * Usage in JS:
 *   const text = t('nav.home');  // Returns translated string
 * 
 * Translation Keys Structure:
 *   {
 *     "nav": { "home": "...", "shop": "...", "about": "..." },
 *     "hero": { "title": "...", "subtitle": "..." },
 *     "footer": { "copyright": "..." }
 *   }
 */

// Current language (defaults to English)
let currentLang = localStorage.getItem('lang') || 'en';

// Translation cache (loaded from JSON)
let translations = {};

/**
 * Load a language file and apply translations.
 * 
 * Process:
 *   1. Fetch JSON from js/lang/{lang}.json
 *   2. Cache translations in memory
 *   3. Update localStorage
 *   4. Apply translations to DOM
 *   5. Update language toggle button
 * 
 * @param {string} lang - Language code ('en' or 'st')
 * @returns {Promise<void>}
 */
async function loadLanguage(lang) {
  try {
    const response = await fetch(`js/lang/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    updateLangButton();
  } catch (e) {
    console.error('Error loading language:', e);
  }
}

/**
 * Translate a dotted key path to the current language.
 * 
 * Principle: Fail-Safe Design
 * Returns the key itself if translation not found, ensuring
 * the UI never shows blank text.
 * 
 * @param {string} key - Dotted key path (e.g., 'nav.home')
 * @returns {string} Translated string or the key itself
 */
function t(key) {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

/**
 * Apply all translations to the DOM.
 * 
 * Principle: Declarative Translation
 * Three attribute types for different use cases:
 *   - data-i18n: Sets textContent (safe, no HTML)
 *   - data-i18n-placeholder: Sets placeholder attribute
 *   - data-i18n-html: Sets innerHTML (use for HTML content)
 */
function applyTranslations() {
  // Text content translations (safe - no HTML parsing)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) el.textContent = translation;
  });

  // Placeholder translations
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation) el.placeholder = translation;
  });

  // HTML content translations (use sparingly - potential XSS)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const translation = t(key);
    if (translation) el.innerHTML = translation;
  });
}

/**
 * Toggle between English and Sesotho.
 * 
 * Principle: Binary Toggle
 * Simple en <-> st switch. No cycle through multiple languages.
 */
function toggleLanguage() {
  const newLang = currentLang === 'en' ? 'st' : 'en';
  loadLanguage(newLang);
}

/**
 * Update the language toggle button label.
 * Shows opposite language name (e.g., "St" when current is English).
 */
function updateLangButton() {
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.textContent = currentLang === 'en' ? 'St' : 'En';
    btn.title = currentLang === 'en' ? 'Switch to Sesotho' : 'Switch to English';
  }
}

// Apply translations on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
});