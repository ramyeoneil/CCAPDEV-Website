// Favorites page behavior (depends on js/app.js helpers)
// Check login and initialize favorites
if (!isLoggedIn()) {
    showNotification('Please log in to view your favorites', 'Login Required', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
}

updateHeader();
makeLogoClickable();

async function loadFavoriteStores() {
    const favoriteStoreIds = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');
    const storesGrid = document.getElementById('favorite-stores-grid');
    const noStores = document.getElementById('no-favorite-stores');

    if (favoriteStoreIds.length === 0) {
        noStores.classList.add('show');
        return;
    }

    noStores.classList.remove('show');
    storesGrid.innerHTML = '';
    for (const storeId of favoriteStoreIds) {
        let store = null;
        try { if (typeof fetchStoreById === 'function') store = await fetchStoreById(storeId); } catch(e){store=null}
        if (!store) {
            const stores = (typeof getAllStores === 'function') ? getAllStores() : [];
            store = stores.find(s => String(s.id || s._id) === String(storeId)) || null;
        }

        const card = document.createElement('div');
        card.className = 'store-card';
        card.onclick = () => window.location.href = 'store-page.html?storeId=' + encodeURIComponent(store ? (store.id||store._id) : storeId);

        const image = (store && (store.image || store.logo)) ? (store.image || store.logo) : ('https://via.placeholder.com/200x150/d9d9d9/00703c?text=STORE+' + encodeURIComponent(storeId));
        const name = store ? (store.name || store.storeName || 'Store') : ('Store ' + storeId);

        card.innerHTML = `
            <img src="${image}" alt="${name}">
            <div class="fav-remove-wrap"><button class="fav-remove" data-id="${storeId}">♥</button></div>
            <div class="fav-name">${name}</div>
        `;

        // wire remove button
        card.querySelectorAll('.fav-remove').forEach(btn => btn.addEventListener('click', (e)=>{
            e.stopPropagation(); removeFavoriteStore(btn.getAttribute('data-id'));
        }));

        storesGrid.appendChild(card);
    }
}

async function loadFavoriteReviews() {
    const favoriteReviewIds = JSON.parse(localStorage.getItem('techamuna_favorite_reviews') || '[]');
    const reviewsGrid = document.getElementById('favorite-reviews-grid');
    const noReviews = document.getElementById('no-favorite-reviews');

    if (favoriteReviewIds.length === 0) { noReviews.classList.add('show'); return; }

    let allReviews = [];
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/data');
        if (resp.ok) {
            const json = await resp.json();
            allReviews = Array.isArray(json.reviews) ? json.reviews.map(r=>({...r, id: r._id||r.id})) : (typeof getAllReviews==='function'?getAllReviews():[]);
        } else allReviews = (typeof getAllReviews==='function'?getAllReviews():[]);
    } catch(e){ allReviews = (typeof getAllReviews==='function'?getAllReviews():[]); }

    reviewsGrid.innerHTML = '';
    favoriteReviewIds.forEach(reviewId => {
        const review = allReviews.find(r => String(r.id)===String(reviewId) || String(r._id)===String(reviewId));
        if (!review) return;
        const card = document.createElement('div');
        card.className = 'review-card';
        card.onclick = () => window.location.href = `review-detail.html?id=${encodeURIComponent(review.id)}`;
        card.innerHTML = `
            <div class="review-header">
                <div class="review-user"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png" alt="User"><div><h4>${review.username||''}</h4><span>${review.date||''}</span></div></div>
                <button class="fav-remove" data-id="${reviewId}">♥</button>
            </div>
            <img src="https://via.placeholder.com/600x400/d9d9d9/00703c?text=PC+STORE" class="review-image">
            <div class="review-content"><h3>${review.storeName||'PC Store'}</h3><div class="review-stars">${'★'.repeat(review.rating||0)}${'☆'.repeat(5-(review.rating||0))}</div><p>${review.text||''}</p></div>
        `;
        card.querySelectorAll('.fav-remove').forEach(b=>b.addEventListener('click', e=>{e.stopPropagation(); removeFavoriteReview(b.getAttribute('data-id'));}));
        reviewsGrid.appendChild(card);
    });
}

function removeFavoriteStore(storeId) {
    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');
    const newFavorites = favorites.filter(id => String(id) !== String(storeId));
    localStorage.setItem('techamuna_favorite_stores', JSON.stringify(newFavorites));
    showNotification('Removed from favorites', 'Removed', 'warning');
    loadFavoriteStores();
}

function removeFavoriteReview(reviewId) {
    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_reviews') || '[]');
    const newFavorites = favorites.filter(id => String(id) !== String(reviewId));
    localStorage.setItem('techamuna_favorite_reviews', JSON.stringify(newFavorites));
    showNotification('Removed from favorites', 'Removed', 'warning');
    loadFavoriteReviews();
}

// init
document.addEventListener('DOMContentLoaded', ()=>{ loadFavoriteStores(); loadFavoriteReviews(); });
