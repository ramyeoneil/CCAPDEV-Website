const reviewsContainer = document.getElementById('reviews-grid-container');
const sortSelect = document.getElementById('review-sort');
const warrantyWatch = document.getElementById('warranty-watch');
const subtitle = document.getElementById('reviews-subtitle');
const reviewModal = document.getElementById('review-modal');
const createReviewBtn = document.getElementById('create-review-btn');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const reviewForm = document.getElementById('review-form');
const reviewStoreSelect = document.getElementById('review-store');

let stores = [];

function withId(obj) {
    if (!obj) return obj;
    return { ...obj, id: obj.id || obj._id };
}

async function loadStores() {
    try {
        const res = await fetch((window.API_BASE || '') + '/api/stores?limit=200');
        if (res.ok) {
            stores = (await res.json()).map(withId).filter(s => s.status === 'approved' || !s.status);
        }
    } catch (e) {
        stores = [];
    }
    reviewStoreSelect.innerHTML = stores.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

async function renderReviews() {
    let list = [];
    try {
        const res = await fetch((window.API_BASE || '') + '/api/data');
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.reviews)) list = json.reviews.map(withId);
        }
    } catch (e) { /* fallback below */ }
    if (!list.length && typeof getAllReviews === 'function') list = getAllReviews().slice();

    if (warrantyWatch.checked) {
        list = list.filter(r => (r.builderScores && r.builderScores.afterSales <= 3) || /warranty|after-sales|after sales/i.test(r.text || ''));
        subtitle.textContent = `Showing warranty-related reviews (${list.length})`;
    } else {
        subtitle.textContent = `Showing ${list.length} reviews`;
    }

    if (sortSelect.value === 'helpful') list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    else list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    reviewsContainer.innerHTML = '';
    list.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <div class="review-user">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png?20170328184010" alt="User">
                    <div>
                        <h4>${review.username || 'Anonymous'}</h4>
                        <span>${review.date || ''}</span>
                    </div>
                </div>
                <button class="header-btn" data-upvote="${review.id}">▲ ${review.upvotes || 0}</button>
            </div>
            <img src="https://via.placeholder.com/600x200/d9d9d9/00703c?text=Store" class="review-image" alt="Store">
            <div class="review-content">
                <h3>${review.storeName || 'PC Store'}</h3>
                <div class="review-stars">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
                <h4 style="margin:6px 0;">${review.headline || ''}</h4>
                <p>${(review.text || '').slice(0, 200)}${(review.text || '').length > 200 ? '...' : ''}</p>
            </div>
        `;

        card.querySelector('[data-upvote]').addEventListener('click', function(e) {
            e.stopPropagation();
            if (!requireLogin('upvote reviews')) return;
            const uid = getCurrentUser().id;
            upvoteReview(review.id, uid);
            renderReviews();
        });

        card.addEventListener('click', function(ev) {
            if (ev.target.matches('button') || ev.target.closest('button')) return;
            window.location.href = `review-detail.html?id=${review.id}`;
        });

        reviewsContainer.appendChild(card);
    });
}

function openModal() { reviewModal.classList.add('show'); }
function closeModal() { reviewModal.classList.remove('show'); reviewForm.reset(); }

createReviewBtn.addEventListener('click', function() {
    if (!requireLogin('write a review')) return;
    openModal();
});
closeReviewModalBtn.addEventListener('click', closeModal);
reviewModal.addEventListener('click', function(e) {
    if (e.target === reviewModal) closeModal();
});

reviewForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const current = getCurrentUser();
    if (!current) return;
    const storeId = reviewStoreSelect.value;
    const store = stores.find(s => String(s.id) === String(storeId));
    const payload = {
        storeId,
        storeName: store ? store.name : '',
        userId: current.id,
        username: current.username || current.storeName || 'User',
        rating: Number(document.getElementById('review-rating').value),
        headline: document.getElementById('review-headline').value.trim(),
        text: document.getElementById('review-text').value.trim()
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
        closeModal();
        showNotification('Review posted', 'Success', 'success');
        renderReviews();
    } catch (err) {
        showNotification('Could not reach server', 'Error', 'error');
    }
});

sortSelect.addEventListener('change', renderReviews);
warrantyWatch.addEventListener('change', renderReviews);

updateHeader();
makeLogoClickable();
loadStores().then(renderReviews);

