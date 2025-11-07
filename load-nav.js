(() => {
  const injectNav = async () => {
    try {
      const container = document.getElementById('nav-placeholder');
      if (!container) return;
      const res = await fetch('nav.html', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load nav: ${res.status}`);
      const html = await res.text();
      container.innerHTML = html;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      document.dispatchEvent(new CustomEvent('nav:loaded'));
    } catch (e) {
      // Fail silently; page remains usable
      // console.error(e);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }
})();
