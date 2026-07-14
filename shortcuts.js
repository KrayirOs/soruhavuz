// Kısayollar sistemi
export class ShortcutsManager {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.setupListeners();
  }

  getDefaultShortcuts() {
    return {
      'ctrl+k': { name: 'Arama Aç', action: 'openSearch', description: 'Global arama' },
      'ctrl+n': { name: 'Yeni Soru', action: 'newQuestion', description: 'Yeni soru ekle' },
      'ctrl+,': { name: 'Ayarlar', action: 'openSettings', description: 'Ayarlar sayfası' },
      'shift+?': { name: 'Yardım', action: 'showHelp', description: 'Kısayolları göster' },
      'j': { name: 'Sonraki', action: 'nextQuestion', description: 'Tekrar modunda sonraki' },
      'k': { name: 'Önceki', action: 'prevQuestion', description: 'Tekrar modunda önceki' },
      'y': { name: 'Doğru', action: 'answerCorrect', description: 'Soruya doğru cevap ver' },
      'n': { name: 'Yanlış', action: 'answerWrong', description: 'Soruya yanlış cevap ver' },
      'h': { name: 'Cevabı Göster', action: 'toggleAnswer', description: 'Cevabı göster/gizle' }
    };
  }

  setupListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(event) {
    // Eğer input alanına yazıyorsa kısayolları yoksay
    if (event.target.matches('input, textarea, [contenteditable]')) {
      // Ctrl+K haricinde
      if (!(event.ctrlKey && event.key === 'k')) return;
    }

    const key = this.getKeyCombo(event);
    const shortcut = this.shortcuts[key];

    if (shortcut) {
      event.preventDefault();
      this.executeShortcut(shortcut.action);
    }
  }

  getKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  executeShortcut(action) {
    // CustomEvent ile işlemi triggerle
    window.dispatchEvent(new CustomEvent('shortcut', { detail: { action } }));
  }

  getShortcutsList() {
    return Object.entries(this.shortcuts).map(([key, shortcut]) => ({
      key,
      ...shortcut
    }));
  }
}

export const shortcutsManager = new ShortcutsManager();