document.addEventListener('DOMContentLoaded', function () {
    // Duplicate verified track contents to ensure an exact seamless loop
    var track = document.querySelector('.verified-track');
    if (track) {
        track.innerHTML = track.innerHTML + track.innerHTML;
    }

    // Call updateHeader if defined (from app.js)
    if (typeof updateHeader === 'function') {
        updateHeader();
    }

    // Auto-rotating carousel (radio-based)
    let currentSlide = 1;
    const totalSlides = 3;

    function rotateCarousel() {
        currentSlide++;
        if (currentSlide > totalSlides) {
            currentSlide = 1;
        }
        const el = document.getElementById('slide' + currentSlide);
        if (el) el.checked = true;
    }

    let intervalId = setInterval(rotateCarousel, 5000);

    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(intervalId);
        });

        carouselContainer.addEventListener('mouseleave', () => {
            intervalId = setInterval(rotateCarousel, 5000);
        });
    }

    // Scroll reveal: use IntersectionObserver to apply different reveal variants
    const revealSelectors = [
        '.section-title',
        '.review-headline',
        '.store-card',
        '.trending-card',
        '.verified-card'
    ];

    const items = Array.from(document.querySelectorAll(revealSelectors.join(',')));

    // initialize with base class and a variant
    items.forEach((el, i) => {
        el.classList.add('reveal');

        if (el.matches('.section-title')) el.classList.add('slide-left');
        else if (el.matches('.store-card')) el.classList.add('slide-right');
        else if (el.matches('.review-headline')) el.classList.add('fade'); // fade uses base reveal
        else if (el.matches('.trending-card')) el.classList.add('slide-left');
        else if (el.matches('.verified-card')) el.classList.add('zoom');

        // stagger via inline style for precise control
        const delay = (i % 5) * 80; // 0,80,160,240,320ms
        el.style.transitionDelay = delay + 'ms';
    });

    if ('IntersectionObserver' in window) {
        const obsOptions = { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 };
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    // mark as fully revealed (class affects styles)
                    entry.target.classList.add('reveal', 'in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, obsOptions);

        items.forEach(el => observer.observe(el));
    } else {
        // fallback: reveal all
        items.forEach(el => {
            el.classList.add('in-view');
        });
    }
});
