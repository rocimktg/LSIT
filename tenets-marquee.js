(() => {
  const LOOP_DURATION_MS = 60000;
  const pointerFineQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: fine)') : null;
  const pointerCoarseQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: () => {} };

  const addMediaListener = (mq, handler) => {
    if (!mq || typeof handler !== 'function') return;
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
  };

  const prefersFinePointer = () => {
    if (pointerFineQuery) return pointerFineQuery.matches;
    if (pointerCoarseQuery) return !pointerCoarseQuery.matches;
    return window.innerWidth >= 1024;
  };

  class DesktopMarquee {
    constructor(viewport) {
      this.viewport = viewport;
      this.track = viewport ? viewport.querySelector('.tenets-marquee__track') : null;
      if (!this.viewport || !this.track) {
        this.initialized = false;
        return;
      }

      this.initialized = true;
      this.loopWidth = 0;
      this.pxPerMs = 0;
      this.rafId = null;
      this.lastTimestamp = null;

      this.step = this.step.bind(this);
      this.handleMediaChange = this.handleMediaChange.bind(this);
      this.handleResize = this.handleResize.bind(this);

      addMediaListener(pointerFineQuery, this.handleMediaChange);
      addMediaListener(pointerCoarseQuery, this.handleMediaChange);
      addMediaListener(prefersReducedMotion, this.handleMediaChange);

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.updateMetrics());
        this.resizeObserver.observe(this.track);
      } else {
        window.addEventListener('resize', this.handleResize);
      }

      this.updateMetrics();
      this.handleMediaChange();
    }

    shouldRun() {
      return prefersFinePointer() && !prefersReducedMotion.matches;
    }

    handleResize() {
      this.updateMetrics();
      if (this.shouldRun()) {
        this.start();
      } else {
        this.stop();
      }
    }

    handleMediaChange() {
      if (this.shouldRun()) {
        this.start();
      } else {
        this.stop();
      }
    }

    updateMetrics() {
      if (!this.track) return;
      const totalWidth = this.track.scrollWidth;
      this.loopWidth = totalWidth / 2 || totalWidth;
      this.pxPerMs = this.loopWidth ? this.loopWidth / LOOP_DURATION_MS : 0;
    }

    start() {
      if (this.rafId !== null || !this.pxPerMs) return;
      this.lastTimestamp = null;
      this.rafId = requestAnimationFrame(this.step);
    }

    stop() {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.lastTimestamp = null;
    }

    step(timestamp) {
      if (!this.shouldRun() || !this.pxPerMs) {
        this.stop();
        return;
      }

      if (this.lastTimestamp === null) {
        this.lastTimestamp = timestamp;
      }

      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      this.viewport.scrollLeft += delta * this.pxPerMs;
      if (this.loopWidth) {
        this.viewport.scrollLeft %= this.loopWidth;
      }
      this.rafId = requestAnimationFrame(this.step);
    }
  }

  class TenetsCarousel {
    constructor(root) {
      this.root = root;
      this.viewport = root.querySelector('.tenets-carousel__viewport');
      this.slides = this.viewport ? Array.from(this.viewport.querySelectorAll('.tenet')) : [];
      if (!this.viewport || this.slides.length === 0) {
        this.initialized = false;
        return;
      }

      this.dotsContainer = root.querySelector('.tenets-carousel__dots');
      this.dots = [];
      this.activeIndex = 0;
      this.scrollRaf = null;
      this.isProgrammatic = false;

      this.handleScroll = this.handleScroll.bind(this);
      this.handleResize = this.handleResize.bind(this);

      this.buildDots();
      this.updateActive(0);

      this.viewport.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('resize', this.handleResize);

      this.initialized = true;
    }

    buildDots() {
      if (!this.dotsContainer) return;
      this.dotsContainer.innerHTML = '';
      this.dots = this.slides.map((slide, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tenets-carousel__dot';
        const label = slide.getAttribute('aria-label') || slide.querySelector('.tenet__title')?.textContent || `Tenet ${index + 1}`;
        button.setAttribute('aria-label', `Show ${label}`);
        button.addEventListener('click', () => this.goToSlide(index));
        this.dotsContainer.appendChild(button);
        return button;
      });
    }

    handleResize() {
      this.updateActive(this.activeIndex);
    }

    handleScroll() {
      if (this.isProgrammatic) return;
      if (this.scrollRaf) return;
      this.scrollRaf = requestAnimationFrame(() => {
        this.scrollRaf = null;
        this.updateFromScroll();
      });
    }

    updateFromScroll() {
      const midpoint = this.viewport.scrollLeft + this.viewport.clientWidth / 2;
      let closestIndex = 0;
      let minDelta = Number.POSITIVE_INFINITY;
      this.slides.forEach((slide, index) => {
        const slideMid = slide.offsetLeft + slide.clientWidth / 2;
        const delta = Math.abs(slideMid - midpoint);
        if (delta < minDelta) {
          minDelta = delta;
          closestIndex = index;
        }
      });
      this.updateActive(closestIndex);
    }

    goToSlide(index) {
      if (!this.slides[index]) return;
      this.isProgrammatic = true;
      const left = this.slides[index].offsetLeft;
      this.viewport.scrollTo({ left, behavior: 'smooth' });
      this.updateActive(index);
      setTimeout(() => {
        this.isProgrammatic = false;
      }, 500);
    }

    updateActive(index) {
      this.activeIndex = index;
      this.dots.forEach((dot, idx) => {
        dot.setAttribute('aria-current', idx === index ? 'true' : 'false');
      });
    }
  }

  const initDesktopMarquees = () => {
    document.querySelectorAll('.tenets-marquee__viewport--desktop').forEach((viewport) => {
      if (viewport.__tenetsMarquee) {
        viewport.__tenetsMarquee.handleResize();
        return;
      }
      const controller = new DesktopMarquee(viewport);
      if (controller.initialized) {
        viewport.__tenetsMarquee = controller;
      }
    });
  };

  const initCarousels = () => {
    document.querySelectorAll('.tenets-carousel').forEach((root) => {
      if (root.__tenetsCarousel) {
        root.__tenetsCarousel.handleResize();
        return;
      }
      const carousel = new TenetsCarousel(root);
      if (carousel.initialized) {
        root.__tenetsCarousel = carousel;
      }
    });
  };

  const initTenets = () => {
    initDesktopMarquees();
    initCarousels();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTenets);
  } else {
    initTenets();
  }

  document.addEventListener('footer:loaded', initTenets);
})();
