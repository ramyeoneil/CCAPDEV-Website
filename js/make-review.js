updateHeader();
makeLogoClickable();

const imagesInput = document.getElementById('review-images');
const previewContainer = document.getElementById('images-preview');
let editingId = null;

(function handleEditPrefill(){
    const params = new URLSearchParams(window.location.search);
    if (!params.has('edit')) return;
    const rid = parseInt(params.get('edit'));
    if (isNaN(rid)) return;
    const reviews = (typeof getAllReviews==='function')?getAllReviews():[];
    const r = reviews.find(x => x.id === rid);
    if (!r) return;
    const current = (typeof getCurrentUser==='function')?getCurrentUser():null;
    if (!current || current.id !== r.userId) {
        showNotification('Not authorized to edit this review', 'Error', 'error');
        setTimeout(()=> window.location.href='reviewtab.html',800);
        return;
    }
    editingId = rid;
    document.getElementById('store-name').value = r.storeName || '';
    document.getElementById('headline').value = r.headline || '';
    document.getElementById('review-text').value = r.text || '';
    document.getElementById('score-pricing').value = (r.builderScores && r.builderScores.pricing) || 5;
    document.getElementById('score-cs').value = (r.builderScores && r.builderScores.customerService) || 5;
    document.getElementById('score-after').value = (r.builderScores && r.builderScores.afterSales) || 5;
    previewContainer.innerHTML = '';
    (r.media || []).forEach(m => { const img = document.createElement('img'); img.src = m; previewContainer.appendChild(img); });
})();

imagesInput.addEventListener('change', async (e) => {
    previewContainer.innerHTML = '';
    const files = Array.from(e.target.files || []).slice(0,6);
    for (const f of files) {
        try { const data = await fileToDataURL(f); const img = document.createElement('img'); img.src = data; previewContainer.appendChild(img); } catch(err) { console.error(err); }
    }
});

document.getElementById('make-review-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!requireLogin('post a review')) return;
    const current = getCurrentUser();
    const storeName = document.getElementById('store-name').value.trim();
    const headline = document.getElementById('headline').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const pricing = parseInt(document.getElementById('score-pricing').value);
    const cs = parseInt(document.getElementById('score-cs').value);
    const after = parseInt(document.getElementById('score-after').value);

    const files = Array.from(document.getElementById('review-images').files || []).slice(0,6);
    const media = [];
    for (const f of files) {
        try { media.push(await fileToDataURL(f)); } catch(e) { console.error(e); }
    }

    if (editingId) {
        const updated = updateReview(editingId, { storeName, headline, text, media, builderScores:{ pricing, customerService: cs, afterSales: after } });
        if (updated) {
            showNotification('Review updated', 'Updated', 'success');
            setTimeout(()=> window.location.href = `review-detail.html?id=${editingId}`, 800);
            return;
        } else { showNotification('Unable to update review', 'Error', 'error'); return; }
    }

    try {
        const payload = { storeId: null, storeName, headline, text, media, builderScores:{ pricing, customerService: cs, afterSales: after }, userId: current.id, username: current.username, rating: Math.round((pricing+cs+after)/3) };
        const resp = await fetch((window.API_BASE || '') + '/api/reviews', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        if (resp.ok) {
            const created = await resp.json();
            showNotification('Review posted', 'Success', 'success');
            setTimeout(()=> window.location.href = `review-detail.html?id=${created._id || created.id}`, 800);
            return;
        }
    } catch(e) { console.warn('API review post failed, falling back to local', e); }

    const newReview = addReview({ storeName, headline, text, media, builderScores:{ pricing, customerService: cs, afterSales: after }, userId: current.id, username: current.username });
    showNotification('Review posted (offline)', 'Success', 'success');
    if (newReview && newReview.id) setTimeout(()=> window.location.href = `review-detail.html?id=${newReview.id}`, 800); else setTimeout(()=> window.location.href = 'reviewtab.html', 800);
});
