(() => {
  const autoPlayHero = () => {
    const video = document.querySelector('.hero__video');
    if (!video) return;

    const ensureInline = () => {
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.removeAttribute('controls');
    };

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          video.setAttribute('data-paused', 'true');
        });
      }
    };

    ensureInline();
    tryPlay();

    video.addEventListener('loadeddata', tryPlay);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        ensureInline();
        tryPlay();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoPlayHero);
  } else {
    autoPlayHero();
  }
})();
