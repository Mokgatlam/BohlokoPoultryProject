let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

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

function t(key) {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) el.textContent = translation;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation) el.placeholder = translation;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const translation = t(key);
    if (translation) el.innerHTML = translation;
  });
}

function toggleLanguage() {
  const newLang = currentLang === 'en' ? 'st' : 'en';
  loadLanguage(newLang);
}

function updateLangButton() {
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.textContent = currentLang === 'en' ? 'St' : 'En';
    btn.title = currentLang === 'en' ? 'Switch to Sesotho' : 'Switch to English';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
});
