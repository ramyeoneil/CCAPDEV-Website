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

    // Build featured slides dynamically: choose top 3 stores by rating
    async function buildFeaturedSlides() {
        // ensure data initialized
        if (typeof initializeData === 'function') initializeData();

        // attempt API first
        let storeList = [];
        try {
            if (typeof fetchStoresFromApi === 'function') {
                const apiRes = await fetchStoresFromApi('', 200).catch(()=>null);
                if (Array.isArray(apiRes) && apiRes.length) storeList = apiRes.map(s => ({ id: s.id || s._id || s._id, name: s.name, location: s.location || s.city || s.address || '', rating: Number(s.rating || 0), reviewCount: Number(s.reviewCount || s.reviews || 0), image: s.image || 'logo-green.svg' }));
            }
        } catch (e) { storeList = []; }

        if (!storeList.length) {
            storeList = (typeof getAllStores === 'function') ? getAllStores() : [];
        }

        // normalize
        storeList = storeList.map(s => ({ id: s.id || s._id || s._id, name: s.name, location: s.location || s.city || s.address || '', rating: Number(s.rating || 0), reviewCount: Number(s.reviewCount || s.reviews || 0), image: s.image || 'logo-green.svg' }));

        if (!storeList.length) return;

        // sort by rating desc, then reviewCount desc
        storeList.sort((a,b) => { if (b.rating !== a.rating) return b.rating - a.rating; return (b.reviewCount || 0) - (a.reviewCount || 0); });

        const top = storeList.slice(0,3);

        // fetch reviews once
        let reviews = [];
        try {
            const resp = await fetch((window.API_BASE || '') + '/api/data');
            if (resp.ok) {
                const json = await resp.json();
                reviews = Array.isArray(json.reviews) ? json.reviews.map(r => ({ ...r, id: r._id || r.id })) : (typeof getAllReviews === 'function' ? getAllReviews() : []);
            } else {
                reviews = (typeof getAllReviews === 'function') ? getAllReviews() : [];
            }
        } catch (e) {
            reviews = (typeof getAllReviews === 'function') ? getAllReviews() : [];
        }

        const track = document.querySelector('.carousel-track');
        if (!track) return;

        // build slides HTML
        let slidesHTML = '';
        top.forEach(function(store) {
            // choose top 3 reviews by upvotes for this store
            const storeReviews = (reviews || []).filter(r => (r.storeId && String(r.storeId) === String(store.id)) || (r.storeName && r.storeName === store.name))
                .sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0,3);
            const stars = '★'.repeat(Math.max(0, Math.floor(store.rating))) + '☆'.repeat(Math.max(0, 5 - Math.floor(store.rating)));

            let reviewsHTML = '';
            if (storeReviews.length) {
                reviewsHTML = '<div class="reviews-list">';
                storeReviews.forEach(function(review) {
                    const revText = review.text ? (review.text.length > 100 ? (review.text.substring(0,97) + '...') : review.text) : '';
                    const revRating = Number(review.rating || 0);
                    const revStars = '★'.repeat(Math.max(0, Math.floor(revRating))) + '☆'.repeat(Math.max(0, 5 - Math.floor(revRating)));
                    reviewsHTML += '<div class="review-headline" data-href="store-page.html?storeId=' + encodeURIComponent(store.id) + '">'
                        + '<div class="review-meta"><span class="review-user">' + (review.username || '') + '</span> <span class="review-stars">' + revStars + '</span> </div>'
                        + '<div class="review-text">' + revText + '</div>'
                        + '<div class="review-cta">CLICK FOR THE WHOLE REVIEW</div>'
                        + '</div>';
                });
                reviewsHTML += '</div>';
            } else {
                reviewsHTML = '<div class="reviews-list"><div class="review-headline" data-href="store-page.html?storeId=' + encodeURIComponent(store.id) + '"><span class="review-text">No recent reviews yet</span><span class="review-cta">VIEW STORE</span></div></div>';
            }

            // ensure image path is safe (encode spaces) and provide an onerror fallback
            const imgSrc = (store.image && !/^https?:\/\//i.test(store.image)) ? encodeURI(store.image) : (store.image || 'logo-green.svg');
            slidesHTML += '<div class="carousel-slide">\n                        <div class="slide-content">\n                            <div class="store-featured">\n                                <div class="store-image">\n                                    <img src="' + imgSrc + '" alt="' + (store.name || '') + ' Store" onerror="this.onerror=null;this.src=\'logo-green.svg\'"/>\n                                </div>\n                                <div class="store-rating">\n                                    <div class="stars">' + stars + '</div>\n                                </div>\n                            </div>\n                            ' + reviewsHTML + '\n                        </div>\n                    </div>';
        });

        track.innerHTML = slidesHTML;
    }

    // build featured slides now
    buildFeaturedSlides().catch(err => console.error('buildFeaturedSlides error', err));

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

    // Typewriter effect for hero motto
    const mottoEl = document.querySelector('.hero-motto');
    if (mottoEl) {
        const fullText = mottoEl.dataset.text ? mottoEl.dataset.text.trim() : mottoEl.textContent.trim();
        if (fullText) {
            mottoEl.textContent = '';
            mottoEl.classList.remove('typed');
            let i = 0;
            mottoEl.classList.add('typing');
            const speed = 50; // ms per character
            const typer = setInterval(() => {
                mottoEl.textContent += fullText.charAt(i);
                i++;
                if (i >= fullText.length) {
                    clearInterval(typer);
                    mottoEl.classList.remove('typing');
                    mottoEl.classList.add('typed');
                }
            }, speed);
        }
    }
    
    // --- Lightweight search suggestions for header/hero inputs ---
    function initSearchSuggestions() {
        // ensure sample data exists
        if (typeof initializeData === 'function') initializeData();

        const inputs = Array.from(document.querySelectorAll('.search-input'));
        if (!inputs.length) return;

        function createSuggestionBox(input) {
            const wrapper = document.createElement('div');
            wrapper.className = 'search-suggestions';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            const list = document.createElement('div');
            list.className = 'suggestions-list';
            list.style.display = 'none';
            wrapper.appendChild(list);
            return { wrapper, list };
        }
        inputs.forEach(input => {
            const { list } = createSuggestionBox(input);
            let debounceTimer = null;

            async function showMatches(q) {
                if (!q) { list.style.display = 'none'; list.innerHTML = ''; return; }

                // Try live API first
                let matches = [];
                if (typeof fetchStoresFromApi === 'function') {
                    const apiRes = await fetchStoresFromApi(q, 6);
                    if (Array.isArray(apiRes) && apiRes.length) matches = apiRes;
                }

                // Fallback to localStorage
                if (!matches.length) {
                    const stores = (typeof getAllStores === 'function') ? getAllStores() : [];
                    matches = stores.filter(s => s.name && s.name.toLowerCase().includes(q)).slice(0,6);
                }

                if (!matches.length) { list.style.display = 'none'; list.innerHTML = ''; return; }

                list.innerHTML = '';
                matches.forEach(s => {
                    const it = document.createElement('div');
                    it.className = 'suggestion-item';
                    it.textContent = s.name + (s.location ? (' — ' + s.location) : '');
                    it.addEventListener('click', () => {
                        try { localStorage.setItem('techamuna_lastSelectedStore', JSON.stringify(s)); } catch(e){}
                        window.location.href = 'store-page.html?storeId=' + encodeURIComponent(s.id);
                    });
                    list.appendChild(it);
                });
                list.style.display = 'block';
            }

            input.addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => showMatches(q), 180);
            });

            // Enter key navigates to first match (try API then fallback)
            input.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const q = input.value.trim().toLowerCase();
                    let m = null;
                    if (typeof fetchStoresFromApi === 'function') {
                        const apiRes = await fetchStoresFromApi(q, 1);
                        if (Array.isArray(apiRes) && apiRes.length) m = apiRes[0];
                    }
                    if (!m) {
                        const stores = (typeof getAllStores === 'function') ? getAllStores() : [];
                        m = stores.find(s => s.name && s.name.toLowerCase().includes(q));
                    }
                    if (m) {
                        try { localStorage.setItem('techamuna_lastSelectedStore', JSON.stringify(m)); } catch(e){}
                        window.location.href = 'store-page.html?storeId=' + encodeURIComponent(m.id);
                    }
                }
            });

            // click outside closes
            document.addEventListener('click', (ev) => {
                if (!input.parentNode.contains(ev.target)) {
                    list.style.display = 'none';
                }
            });
        });
    }

    // initialize search box behavior
    initSearchSuggestions();
});
