(() => {
  const MOBILE_MEDIA = '(max-width: 768px)';
  const LOOP_DURATION_MS = 60000; // match desktop CSS animation speed
  const RESUME_DELAY_MS = 400;
  const controllers = new Set();
  const canMatchMedia = typeof window.matchMedia === 'function';
  const prefersReducedMotion = canMatchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const addMediaListener = (mq, handler) => {
    if (!mq || typeof handler !== 'function') return;
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
  };

  class TenetsMarqueeScroller {
    constructor(root) {
      this.root = root;
      this.viewport = root.querySelector('.tenets-marquee__viewport');
      this.track = root.querySelector('.tenets-marquee__track');
      if (!this.viewport || !this.track) {
        this.initialized = false;
        return;
      }

      this.initialized = true;
      this.enabled = false;
      this.isPointerActive = false;
      this.resumeTimer = null;
      this.rafId = null;
      this.lastTimestamp = null;
      this.loopWidth = 0;
      this.pxPerMs = 0;
      this.isAutoScrolling = false;

      this.step = this.step.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handleScroll = this.handleScroll.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.handleMediaChange = this.handleMediaChange.bind(this);

      this.mobileQuery = canMatchMedia ? window.matchMedia(MOBILE_MEDIA) : null;

      this.viewport.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
      this.viewport.addEventListener('pointerup', this.handlePointerUp, { passive: true });
      this.viewport.addEventListener('pointercancel', this.handlePointerUp, { passive: true });
      this.viewport.addEventListener('pointerleave', this.handlePointerUp, { passive: true });
      this.viewport.addEventListener('scroll', this.handleScroll, { passive: true });

      addMediaListener(this.mobileQuery, this.handleMediaChange);

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.updateMetrics());
        this.resizeObserver.observe(this.track);
      } else {
        window.addEventListener('resize', this.handleResize);
      }

      this.updateMetrics();
      this.handleMediaChange();
    }

    refresh() {
      this.updateMetrics();
      this.handleMediaChange();
    }

    handleMotionPreferenceChange() {
      this.handleMediaChange();
    }

    handleMediaChange() {
      const isMobile = this.mobileQuery ? this.mobileQuery.matches : window.innerWidth <= 768;
      const shouldEnable = isMobile && !prefersReducedMotion.matches;
      if (shouldEnable) {
        this.enable();
      } else {
        this.disable();
      }
    }

    handleResize() {
      this.updateMetrics();
      if (!this.mobileQuery) {
        this.handleMediaChange();
      } else if (this.enabled) {
        this.normalizeScroll();
        this.startLoop();
      }
    }

    updateMetrics() {
      const trackWidth = this.track.scrollWidth;
      const candidate = trackWidth / 2;
      this.loopWidth = candidate > 0 ? candidate : trackWidth;
      if (!this.loopWidth || this.loopWidth <= this.viewport.clientWidth) {
        this.pxPerMs = 0;
        return;
      }
      this.pxPerMs = this.loopWidth / LOOP_DURATION_MS;
    }

    enable() {
      if (this.enabled) return;
      this.enabled = true;
      this.updateMetrics();
      this.normalizeScroll();
      this.startLoop();
    }

    disable() {
      if (!this.enabled) return;
      this.enabled = false;
      this.stopLoop();
      this.clearResumeTimer();
      this.isPointerActive = false;
      this.viewport.scrollLeft = 0;
    }

    startLoop() {
      if (!this.enabled || this.isPointerActive || !this.pxPerMs) return;
      if (this.rafId !== null) return;
      this.lastTimestamp = null;
      this.rafId = requestAnimationFrame(this.step);
    }

    stopLoop() {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.lastTimestamp = null;
    }

    step(timestamp) {
      if (!this.enabled || this.isPointerActive || !this.pxPerMs || prefersReducedMotion.matches || !this.mobileQuery.matches) {
        this.stopLoop();
        return;
      }

      if (this.lastTimestamp === null) {
        this.lastTimestamp = timestamp;
      }

      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      this.isAutoScrolling = true;
      this.viewport.scrollLeft += delta * this.pxPerMs;
      this.normalizeScroll();
      this.isAutoScrolling = false;

      this.rafId = requestAnimationFrame(this.step);
    }

    handlePointerDown() {
      this.isPointerActive = true;
      this.stopLoop();
      this.clearResumeTimer();
    }

    handlePointerUp() {
      if (!this.isPointerActive) return;
      this.isPointerActive = false;
      this.scheduleResume();
    }

    handleScroll() {
      if (!this.enabled || this.isAutoScrolling) return;
      this.stopLoop();
      this.scheduleResume();
    }

    scheduleResume() {
      if (!this.enabled) return;
      this.clearResumeTimer();
      this.resumeTimer = window.setTimeout(() => {
        if (!this.enabled || this.isPointerActive) return;
        this.normalizeScroll();
        this.startLoop();
      }, RESUME_DELAY_MS);
    }

    clearResumeTimer() {
      if (this.resumeTimer) {
        clearTimeout(this.resumeTimer);
        this.resumeTimer = null;
      }
    }

    normalizeScroll() {
      if (!this.loopWidth) return;
      const max = this.loopWidth;
      const current = this.viewport.scrollLeft;
      if (current >= max || current < 0) {
        const normalized = ((current % max) + max) % max;
        this.viewport.scrollLeft = normalized;
      }
    }
  }

  const initTenetsMarquees = () => {
    document.querySelectorAll('.tenets-marquee').forEach((root) => {
      if (root.__tenetsMarquee) {
        root.__tenetsMarquee.refresh();
        return;
      }
      const controller = new TenetsMarqueeScroller(root);
      if (controller.initialized) {
        controllers.add(controller);
        root.__tenetsMarquee = controller;
      }
    });
  };

  const handleMotionChange = () => {
    controllers.forEach((controller) => controller.handleMotionPreferenceChange());
  };

  addMediaListener(prefersReducedMotion, handleMotionChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTenetsMarquees);
  } else {
    initTenetsMarquees();
  }

  document.addEventListener('footer:loaded', initTenetsMarquees);
})();
