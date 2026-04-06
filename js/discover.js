// Discover page JS (migrated from inline)
updateHeader();

let stores = [];
let currentFilter = 'all';

async function loadStores(filter, storeIds) {
    if (!filter) filter = 'all';
    const grid = document.getElementById('discover-grid');
    grid.innerHTML = '';
    // Try to fetch live stores from API first
    let liveStores = await (typeof fetchStoresFromApi === 'function' ? fetchStoresFromApi('', 50).catch(()=>null) : null);
    if (Array.isArray(liveStores) && liveStores.length) {
        stores = liveStores.map(s => ({ id: s.id || s._id || s._id, name: s.name, location: s.location || s.city || s.address || '', rating: s.rating || 0, reviewCount: s.reviewCount || s.reviews || 0, image: s.image || 'logo-green.svg' }));
    } else if (!stores || !stores.length) {
        stores = (typeof getAllStores === 'function') ? getAllStores() : [];
    }

    // Try to get reviews from API `/api/data` first, fallback to localStorage
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

    let filteredStores = stores.slice();
    if (Array.isArray(storeIds) && storeIds.length) {
        filteredStores = stores.filter(s => storeIds.includes(s.id) || storeIds.includes(String(s.id)));
    } else if (filter !== 'all') {
        filteredStores = stores.filter(function(s) { return (s.location || '').toLowerCase() === String(filter).toLowerCase(); });
    }

    filteredStores = filteredStores.sort(function() { return Math.random() - 0.5; });

    filteredStores.forEach(function(store) {
        const storeReviews = reviews.filter(function(r) { return r.storeName === store.name; }).slice(0, 2);
        const card = document.createElement('div');
        card.className = 'discover-card';
        // use data-href so the global delegator handles navigation
        card.setAttribute('data-href', 'store-page.html?storeId=' + encodeURIComponent(store.id));

        const stars = '★'.repeat(Math.floor(store.rating)) + '☆'.repeat(5 - Math.floor(store.rating));

        let reviewsHTML = '';
        if (storeReviews.length > 0) {
            reviewsHTML = '<div class="discover-reviews-preview"><div class="discover-reviews-header">RECENT REVIEWS</div>';
            storeReviews.forEach(function(review) {
                reviewsHTML += '<div class="discover-review-snippet"><div class="discover-review-user">' + (review.username || '') + ' - ' + '★'.repeat(review.rating || 0) + '</div>' + '<div class="discover-review-text">"' + ((review.text||'').substring(0, 80)) + ((review.text||'').length > 80 ? '...' : '') + '"</div></div>';
            });
            reviewsHTML += '</div>';
        }

        card.innerHTML = '<img src="' + store.image + '" alt="' + store.name + '" class="discover-store-image"><div class="discover-card-content"><div class="discover-store-name">' + store.name + '</div><div class="discover-store-location">LOCATION: ' + store.location + '</div><div class="discover-rating"><span class="discover-stars">' + stars + '</span><span class="discover-rating-text">' + store.rating + ' (' + store.reviewCount + ' reviews)</span></div>' + reviewsHTML + '</div>';

        grid.appendChild(card);
    });
}

function filterByLocation(location, e) {
    console.debug('[discover] filterByLocation called', { location: location, eventTarget: e && e.target, eventCurrentTarget: e && e.currentTarget });
    currentFilter = location;
    document.querySelectorAll('.filter-tag').forEach(function(btn) { btn.classList.remove('active'); });
    // find the button element to mark active. Prefer the event target's closest .filter-tag when available.
    var btn = null;
    if (e) {
        try { btn = (e.target && e.target.closest) ? e.target.closest('.filter-tag') : null; } catch (err) { btn = null; }
        if (!btn && e.currentTarget && e.currentTarget.classList && e.currentTarget.classList.contains('filter-tag')) btn = e.currentTarget;
    }
    if (!btn) {
        btn = document.querySelector('.filter-tag[data-location="' + location + '"]') || document.querySelector('.filter-tag[data-arg="' + location + '"]');
    }
    if (btn) {
        btn.classList.add('active');
        console.debug('[discover] activated filter button', btn, 'classes=', btn.className);
    } else {
        console.debug('[discover] no button found for', location);
    }
    loadStores(location);
}

async function searchProductsAndShowStores(query) {
    if (!query) { loadStores(currentFilter); return; }
    // Try API product list first
    let products = [];
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/data');
        if (resp.ok) {
            const json = await resp.json();
            products = Array.isArray(json.products) ? json.products.map(p => ({ ...p, storeId: (p.storeId && (p.storeId._id || p.storeId)) || p.storeId })) : (typeof getAllProducts === 'function' ? getAllProducts() : []);
        } else {
            products = (typeof getAllProducts === 'function') ? getAllProducts() : [];
        }
    } catch (e) {
        products = (typeof getAllProducts === 'function') ? getAllProducts() : [];
    }

    const matches = products.filter(p => (p.name || '').toLowerCase().includes(query.toLowerCase()));
    const storeIds = Array.from(new Set(matches.map(m => String(m.storeId))));
    if (!storeIds.length) { showNotification && showNotification('No stores found with that product', 'No results', 'warning'); return; }
    loadStores(currentFilter, storeIds);
    const storeNames = stores.filter(s => storeIds.includes(s.id)).map(s => s.name);
    showNotification && showNotification('Found in: ' + storeNames.join(', '), 'Product Availability', 'success');
}

// header search wiring
(function attachHeaderSearch() {
    const headerSearch = document.querySelector('.search-input');
    if (!headerSearch) return;
    headerSearch.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = this.value.trim();
            searchProductsAndShowStores(q);
        }
    });
    headerSearch.addEventListener('input', function() { if (!this.value.trim()) loadStores(currentFilter); });
})();

// initial load
document.addEventListener('DOMContentLoaded', ()=>{
    loadStores();

    // Attach direct listeners to filter buttons as a fallback in case delegation fails
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // prevent double-calls: stop propagation so the global delegator doesn't also invoke the handler
            e.stopPropagation();
            const loc = btn.getAttribute('data-arg') || btn.getAttribute('data-location') || btn.textContent.trim();
            console.debug('[discover] direct filter click', loc, 'target=', e.target);
            // call filter handler (it accepts event as second arg)
            try { filterByLocation(loc, e); } catch (err) { console.error('filterByLocation error', err); }
        });
    });
});
