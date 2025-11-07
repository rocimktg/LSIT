const initMobileNav = () => {
    const trigger = document.querySelector('.mobile-nav .hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!trigger || !mobileMenu || mobileMenu.dataset.init === 'true') {
        return;
    }
    const setState = (open) => {
        trigger.classList.toggle('is-active', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.classList.toggle('is-open', open);

        if (open) {
            mobileMenu.removeAttribute('hidden');
        } else {
            mobileMenu.setAttribute('hidden', '');
        }
    };

    const closeMenu = () => setState(false);

    trigger.addEventListener('click', () => {
        const isOpen = trigger.classList.contains('is-active');
        setState(!isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('is-open')) {
            return;
        }

        if (mobileMenu.contains(event.target) || trigger.contains(event.target)) {
            return;
        }

        closeMenu();
    });

    const mq = window.matchMedia('(min-width: 1025px)');
    const handleViewportChange = (event) => {
        if (event.matches) {
            closeMenu();
        }
    };

    if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handleViewportChange);
    } else if (typeof mq.addListener === 'function') {
        mq.addListener(handleViewportChange);
    }

    setState(false);
    mobileMenu.dataset.init = 'true';

    initBackToTop();
};

document.addEventListener('DOMContentLoaded', initMobileNav);
document.addEventListener('nav:loaded', initMobileNav);
document.addEventListener('footer:loaded', () => {
    initBackToTop();
});

function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;

    if (backToTop.dataset.init !== 'true') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const toggleBackToTop = () => {
            const offset = window.scrollY || document.documentElement.scrollTop;
            backToTop.classList.toggle('is-visible', offset > 400);
        };

        toggleBackToTop();
        window.addEventListener('scroll', toggleBackToTop, { passive: true });

        backToTop.addEventListener('click', () => {
            if (prefersReducedMotion.matches) {
                window.scrollTo(0, 0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            backToTop.blur();
        });
        backToTop.dataset.init = 'true';
    }

    if (backToTop.dataset.footerGuard === 'true') {
        return;
    }

    const footerBottom = document.querySelector('.site-footer__bottom');
    if (footerBottom && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                backToTop.classList.toggle('is-clipped', entry.isIntersecting);
            });
        }, { rootMargin: '0px 0px -24px 0px' });
        observer.observe(footerBottom);
        backToTop.dataset.footerGuard = 'true';
    }
}
