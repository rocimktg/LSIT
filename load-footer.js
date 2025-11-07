(() => {
  const injectFooter = async () => {
    try {
      const container = document.getElementById('footer-placeholder');
      if (!container) return;
      const res = await fetch('footer.html', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load footer: ${res.status}`);
      const html = await res.text();
      container.innerHTML = html;
      // Remove any existing inline footer/tenets/back-to-top to avoid duplicates
      document.querySelectorAll('.tenets-marquee, .site-footer, .back-to-top').forEach((el) => {
        if (!container.contains(el)) {
          el.remove();
        }
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      document.dispatchEvent(new CustomEvent('footer:loaded'));
    } catch (e) {
      // Fail silently
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }
})();
