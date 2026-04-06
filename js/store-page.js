// Products and reviews are loaded either from cached localStorage (from API) or local sample fallbacks
let storeProducts = [];
let allReviews = [];
let currentStoreObj = null;

let currentFilter = 'all';

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.store-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

// Load products
function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    if (!storeProducts || !storeProducts.length) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;font-family:var(--font-mono);">No products listed for this store.</p>';
        return;
    }

    storeProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        const imgHtml = product.image ? `<img src="${product.image}" alt="${(product.name || 'Product')}" style="width:100%;height:200px;object-fit:cover;display:block;" onerror="this.onerror=null;this.style.display='none';this.parentElement.textContent='PRODUCT IMAGE';"/>` : 'PRODUCT IMAGE';
        item.innerHTML = '<div class="product-img">' + imgHtml + '</div>' +
            '<div class="product-details">' +
            '<div class="product-title">' + (product.name || '') + '</div>' +
            '<div class="product-category">' + (product.category || '') + '</div>' +
            '<div class="product-price-display">PHP ' + (product.price ? Number(product.price).toLocaleString() : '—') + '</div>' +
            '<div class="product-stock">' + ((product.stock || product.inventory || 0) > 0 ? (product.stock || product.inventory) + ' in stock' : 'Out of stock') + '</div>' +
            '</div>';
        container.appendChild(item);
    });
}

// Load reviews
function loadReviews(filter) {
    if (!filter) filter = 'all';
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';

    let reviewsToShow = filter === 'all'
        ? allReviews
        : allReviews.filter(function(r) { return Number(r.rating) === Number(filter); });

    if (reviewsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666; font-family: var(--font-mono);">No reviews with this rating yet.</p>';
        return;
    }

    reviewsToShow.forEach(function(review) {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = '<div class="review-header">' +
            '<div>' +
            '<div class="review-user">' + (review.username || review.user || '') + '</div>' +
            '<div style="font-size: 0.8rem; color: #666; font-family: var(--font-mono); margin-top: 0.3rem;">' + (review.date || '') + '</div>' +
            '</div>' +
            '<div class="review-rating">' + stars + '</div>' +
            '</div>' +
            '<div style="font-weight: 600; font-size: 1.1rem; margin: 1rem 0 0.5rem 0;">' + (review.headline || '') + '</div>' +
            '<div class="review-text">' + (review.text || '') + '</div>';
        container.appendChild(item);
    });
}

// Filter reviews
function filterReviews(rating) {
    currentFilter = rating;
    
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadReviews(rating);
}

// Toggle favorite
function toggleFavorite() {
    if (!requireLogin('add this store to favorites')) {
        return;
    }
    const storeId = window._currentStoreId || null;
    if (!storeId) return;

    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');
    const index = favorites.indexOf(storeId.toString());

    const icon = document.getElementById('fav-icon');

    if (index > -1) {
        favorites.splice(index, 1);
        icon.textContent = 'ADD TO FAVORITES';
        showNotification('Removed from favorites!', 'Removed', 'warning');
    } else {
        favorites.push(storeId.toString());
        icon.textContent = 'REMOVE FROM FAVORITES';
        showNotification('Added to favorites!', 'Success', 'success');
    }

    localStorage.setItem('techamuna_favorite_stores', JSON.stringify(favorites));
}

// Check if store is already favorited
function checkStoreFavorite() {
    const storeId = window._currentStoreId;
    if (!storeId) return;
    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');

    if (favorites.includes(storeId.toString())) {
        const icon = document.getElementById('fav-icon');
        icon.textContent = 'REMOVE FROM FAVORITES';
    }
}

// Write review
function writeReview() {
    if (!requireLogin('write a review')) {
        return;
    }
    const modal = document.getElementById('store-review-modal');
    if (modal) modal.classList.add('show');
}

// Update rating display
function updateRatingDisplay() {
    const totalReviews = allReviews.length;
    const avgRating = allReviews.reduce(function(sum, r) { return sum + r.rating; }, 0) / totalReviews;
    const roundedRating = Math.round(avgRating * 10) / 10;
    
    document.getElementById('review-count').textContent = totalReviews;
    document.getElementById('avg-rating').textContent = roundedRating.toFixed(1);
    
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    let starsHTML = '★'.repeat(fullStars);
    if (hasHalfStar) starsHTML += '★';
    starsHTML += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
    
    document.getElementById('store-rating').textContent = starsHTML;
}

// Initialize
// Utility: read querystring param
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

async function initializeStorePage() {
    // Determine target store id
    let storeId = getQueryParam('storeId');
    let storeObj = null;

    // If we have a last selected store in localStorage and no query param, use it
    if (!storeId) {
        try {
            const last = JSON.parse(localStorage.getItem('techamuna_lastSelectedStore') || 'null');
            if (last && (last.id || last._id)) storeId = last.id || last._id;
        } catch (e) {}
    }

    // Try API lookup first
    if (storeId && typeof fetchStoreById === 'function') {
        storeObj = await fetchStoreById(storeId);
    }

    // Fallback: search cached stores
    if (!storeObj) {
        const stores = getAllStores();
        storeObj = stores.find(s => (s.id && s.id.toString() === (storeId || '').toString()) || (s._id && s._id.toString() === (storeId || '').toString()));
        if (!storeObj && stores.length) storeObj = stores[0];
    }

    if (!storeObj) return;
    currentStoreObj = storeObj;

    // Set global current store id for other helpers
    window._currentStoreId = storeObj.id || storeObj._id || null;

    // Update header values
    document.getElementById('store-name').textContent = (storeObj.name || 'Store').toUpperCase();
    document.getElementById('avg-rating').textContent = (storeObj.rating || 0).toFixed(1);
    document.getElementById('review-count').textContent = storeObj.reviewCount || 0;
    const meta = document.querySelector('.store-meta');
    if (meta) meta.children[0].textContent = storeObj.location || storeObj.city || '';

    // Populate ABOUT tab fields
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '';
    };
    setText('contact-email', storeObj.email || '');
    setText('contact-phone', storeObj.phone || '');
    setText('contact-website', storeObj.website || '');
    setText('contact-address', storeObj.address || storeObj.location || '');
    setText('contact-landmarks', storeObj.landmarks || '');

    const hours = (storeObj.openTime && storeObj.closeTime)
        ? `${storeObj.openTime} - ${storeObj.closeTime}${storeObj.days ? ' (' + storeObj.days + ')' : ''}`
        : '';
    setText('store-hours', hours);
    setText('store-location', storeObj.location || storeObj.city || '');
    setText('store-ranking', '');
    const aboutEl = document.getElementById('store-about');
    if (aboutEl) aboutEl.textContent = storeObj.about || 'Welcome! This store is part of Tech-A-Muna.';

    // Load products from cached products (filter by storeId)
    // Try fetching products and reviews from backend API first
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/data');
        if (resp.ok) {
            const json = await resp.json();
            const productsList = Array.isArray(json.products) ? json.products : getAllProducts();
            const reviewsList = Array.isArray(json.reviews) ? json.reviews : getAllReviews();

            storeProducts = productsList.filter(p => {
                const pid = (p.storeId && (p.storeId._id || p.storeId)) || p.storeId;
                const sid = (p.storeId && p.storeId.store) || p.storeId;
                return (pid && String(pid) === String(window._currentStoreId)) || (sid && String(sid) === String(window._currentStoreId));
            }).map(p => ({ ...p, id: p._id || p.id }));

            allReviews = reviewsList.filter(r => {
                const rs = (r.storeId && (r.storeId._id || r.storeId)) || r.storeId;
                return rs && String(rs) === String(window._currentStoreId);
            }).map(r => ({ ...r, id: r._id || r.id }));
        } else {
            throw new Error('api/data not ok');
        }
    } catch (e) {
        // Fallback to cached localStorage helpers
        const products = getAllProducts();
        storeProducts = products.filter(p => {
            const pid = (p.storeId && (p.storeId._id || p.storeId)) || p.storeId;
            return pid && pid.toString() === (window._currentStoreId || '').toString();
        });

        // Load reviews for this store from local cache
        const reviews = getAllReviews();
        allReviews = reviews.filter(r => (r.storeId && r.storeId.toString()) === (window._currentStoreId || '').toString());
    }

    loadProducts();
    loadReviews();
    updateRatingDisplay();
    checkStoreFavorite();
}

document.addEventListener('DOMContentLoaded', initializeStorePage);

function closeStoreReviewModal() {
    const modal = document.getElementById('store-review-modal');
    if (modal) modal.classList.remove('show');
    const form = document.getElementById('store-review-form');
    if (form) form.reset();
}

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('close-store-review-modal');
    const modal = document.getElementById('store-review-modal');
    const form = document.getElementById('store-review-form');

    if (closeBtn) closeBtn.addEventListener('click', closeStoreReviewModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeStoreReviewModal();
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!requireLogin('write a review')) return;
            if (!window._currentStoreId || !currentStoreObj) return;

            const user = getCurrentUser();
            const payload = {
                storeId: window._currentStoreId,
                storeName: currentStoreObj.name || '',
                userId: user.id,
                username: user.username || user.storeName || 'User',
                rating: Number(document.getElementById('store-review-rating').value),
                headline: document.getElementById('store-review-headline').value.trim(),
                text: document.getElementById('store-review-text').value.trim()
            };

            try {
                const res = await fetch((window.API_BASE || '') + '/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    showNotification(data.error || 'Could not post review', 'Error', 'error');
                    return;
                }
                closeStoreReviewModal();
                showNotification('Review posted successfully!', 'Success', 'success');
                await initializeStorePage();
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                const reviewsTab = document.getElementById('reviews-tab');
                if (reviewsTab) reviewsTab.classList.add('active');
                document.querySelectorAll('.store-tab').forEach(btn => {
                    btn.classList.toggle('active', (btn.getAttribute('data-arg') === 'reviews'));
                });
            } catch (err) {
                console.error(err);
                showNotification('Could not reach server', 'Error', 'error');
            }
        });
    }
});
