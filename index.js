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
});
