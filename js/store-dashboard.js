let products = [];
let storeReviews = [];
let storeInfo = {};
let currentEditingProductId = null;
let currentStoreId = null;

function withId(obj) {
    if (!obj) return obj;
    return { ...obj, id: obj.id || obj._id };
}

async function initializeDashboard() {
    const params = new URLSearchParams(window.location.search);
    let storeId = params.get('storeId');
    const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    let stores = [];
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/stores?limit=200');
        if (resp.ok) stores = (await resp.json()).map(withId);
    } catch (e) {
        stores = ((typeof getAllStores === 'function') ? getAllStores() : []).map(withId);
    }
    if (!storeId && currentUser && currentUser.type === 'store' && currentUser.storeName) {
        const match = stores.find(s => (s.name || '').toLowerCase() === (currentUser.storeName || '').toLowerCase());
        if (match) storeId = match.id;
    }
    let storeObj = null;
    if (storeId) storeObj = stores.find(s => String(s.id) === String(storeId));
    if (!storeObj && stores.length) storeObj = stores[0];
    if (!storeObj) return;

    currentStoreId = storeObj.id;
    storeInfo = {
        id: storeObj.id,
        name: storeObj.name || '',
        email: storeObj.email || '',
        phone: storeObj.phone || '',
        website: storeObj.website || '',
        address: storeObj.address || storeObj.location || '',
        city: storeObj.city || storeObj.location || '',
        province: storeObj.province || '',
        openTime: storeObj.openTime || '',
        closeTime: storeObj.closeTime || '',
        days: storeObj.days || 'Mon - Sat'
    };
    updateStoreInfoDisplay();
    await refreshStoreData();
}

async function refreshStoreData() {
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/data');
        if (!resp.ok) throw new Error('api/data not ok');
        const json = await resp.json();
        const allProducts = Array.isArray(json.products) ? json.products.map(withId) : [];
        const allReviews = Array.isArray(json.reviews) ? json.reviews.map(withId) : [];
        products = allProducts.filter(p => String((p.storeId && (p.storeId._id || p.storeId)) || p.storeId) === String(currentStoreId));
        storeReviews = allReviews.filter(r => String((r.storeId && (r.storeId._id || r.storeId)) || r.storeId) === String(currentStoreId));
    } catch (e) {
        products = [];
        storeReviews = [];
    }
    loadProducts();
    loadReviews();
    updateStats();
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.dashboard-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

// Load products
function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const img = product.image ? `<img src="${product.image}" alt="${(product.name || 'Product')}" style="width:100%;height:200px;object-fit:cover;display:block;" onerror="this.onerror=null;this.style.display='none';this.parentElement.textContent='📦';" />` : '📦';
        card.innerHTML = `
            <div class="product-image">${img}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₱${product.price.toLocaleString()}</div>
                <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #666; margin-bottom: 0.8rem;">
                    ${product.category} • Stock: ${product.stock}
                </div>
                <div class="product-actions">
                    <button class="action-btn btn-edit" onclick="editProduct('${product.id}')">EDIT</button>
                    <button class="action-btn btn-delete" onclick="deleteProduct('${product.id}')">DELETE</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    updateStats();
}

// Load reviews
function loadReviews() {
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';
    
    if (storeReviews.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No reviews yet.</p>';
        return;
    }
    
    storeReviews.forEach(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = `
            <div class="review-header">
                <div>
                    <div class="review-user">${review.username || review.user || ''}</div>
                    <div style="font-size: 0.8rem; color: #666; font-family: var(--font-mono);">${review.date}</div>
                </div>
                <div class="review-rating">${stars}</div>
            </div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${review.headline}</div>
            <div class="review-text">${review.text}</div>
        `;
        container.appendChild(item);
    });
}

// Update statistics
function updateStats() {
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('total-reviews').textContent = storeReviews.length;
    
    const avgRating = storeReviews.length > 0 
        ? (storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length).toFixed(1)
        : '0.0';
    document.getElementById('avg-rating').textContent = avgRating;
    
    // Random views for demo
    document.getElementById('views-month').textContent = Math.floor(Math.random() * 500) + 200;
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Add product modal
function openAddProductModal() {
    currentEditingProductId = null;
    document.getElementById('product-modal-title').textContent = 'ADD PRODUCT';
    document.getElementById('product-form').reset();
    openModal('product-modal');
}

// Edit product
function editProduct(id) {
    currentEditingProductId = id;
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('product-modal-title').textContent = 'EDIT PRODUCT';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-stock').value = product.stock;
        const fileInput = document.getElementById('product-image');
        if (fileInput) fileInput.value = '';
        
        openModal('product-modal');
    }
}

// Delete product
async function deleteProduct(id) {
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;
    
    const confirmed = await showConfirmation(`Delete ${product.name}?`, 'Delete Product');
    
    if (confirmed) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/products/' + encodeURIComponent(id), { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showNotification(data.error || 'Could not delete product', 'Error', 'error');
                return;
            }
            await refreshStoreData();
            showNotification('Product deleted successfully!', 'Success', 'success');
        } catch (e) {
            showNotification('Could not reach server', 'Error', 'error');
        }
    }
}

// Product form submission
document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        stock: parseInt(document.getElementById('product-stock').value)
    };

    const imgInput = document.getElementById('product-image');
    if (imgInput && imgInput.files && imgInput.files[0]) {
        try {
            if (typeof fileToDataURL === 'function') {
                productData.image = await fileToDataURL(imgInput.files[0]);
            } else {
                // fallback
                const reader = new FileReader();
                productData.image = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(imgInput.files[0]);
                });
            }
        } catch (e) {
            console.warn('Failed to read image', e);
        }
    }
    
    try {
        if (currentEditingProductId) {
            const res = await fetch((window.API_BASE || '') + '/api/products/' + encodeURIComponent(currentEditingProductId), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showNotification(data.error || 'Could not update product', 'Error', 'error');
                return;
            }
            showNotification('Product updated successfully!', 'Success', 'success');
        } else {
            const res = await fetch((window.API_BASE || '') + '/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productData, storeId: currentStoreId })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showNotification(data.error || 'Could not add product', 'Error', 'error');
                return;
            }
            showNotification('Product added successfully!', 'Success', 'success');
        }
        await refreshStoreData();
        closeModal('product-modal');
    } catch (err) {
        console.error(err);
        showNotification('Could not reach server', 'Error', 'error');
    }
});

// Edit store info modal
function openEditStoreModal() {
    document.getElementById('edit-name').value = storeInfo.name;
    document.getElementById('edit-email').value = storeInfo.email;
    document.getElementById('edit-phone').value = storeInfo.phone;
    document.getElementById('edit-website').value = storeInfo.website;
    document.getElementById('edit-address').value = storeInfo.address;
    document.getElementById('edit-open').value = storeInfo.openTime;
    document.getElementById('edit-close').value = storeInfo.closeTime;
    const daysEl = document.getElementById('edit-days');
    if (daysEl) daysEl.value = storeInfo.days || 'Mon - Sat';
    
    openModal('edit-store-modal');
}

// Store info form submission (persist to backend)
document.getElementById('edit-store-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    storeInfo.name = document.getElementById('edit-name').value;
    storeInfo.email = document.getElementById('edit-email').value;
    storeInfo.phone = document.getElementById('edit-phone').value;
    storeInfo.website = document.getElementById('edit-website').value;
    storeInfo.address = document.getElementById('edit-address').value;
    storeInfo.openTime = document.getElementById('edit-open').value;
    storeInfo.closeTime = document.getElementById('edit-close').value;
    const daysEl = document.getElementById('edit-days');
    storeInfo.days = daysEl ? daysEl.value : (storeInfo.days || 'Mon - Sat');
    
    try {
        const res = await fetch((window.API_BASE || '') + '/api/stores/' + encodeURIComponent(currentStoreId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: storeInfo.name,
                email: storeInfo.email,
                phone: storeInfo.phone,
                website: storeInfo.website,
                address: storeInfo.address,
                location: storeInfo.city || storeInfo.address || '',
                city: storeInfo.city || '',
                province: storeInfo.province || '',
                openTime: storeInfo.openTime || '',
                closeTime: storeInfo.closeTime || '',
                days: storeInfo.days || ''
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showNotification(data.error || 'Could not save store information', 'Error', 'error');
            return;
        }
        updateStoreInfoDisplay();
        closeModal('edit-store-modal');
        await refreshStoreData();
        showNotification('Store information updated successfully!', 'Success', 'success');
    } catch (err) {
        console.error(err);
        showNotification('Could not reach server', 'Error', 'error');
    }
});

// Update store info display
function updateStoreInfoDisplay() {
    document.getElementById('store-name').textContent = storeInfo.name.toUpperCase();
    document.getElementById('info-store-name').textContent = storeInfo.name;
    document.getElementById('info-email').textContent = storeInfo.email;
    document.getElementById('info-phone').textContent = storeInfo.phone;
    document.getElementById('info-website').textContent = storeInfo.website;
    document.getElementById('info-address').textContent = storeInfo.address;
    document.getElementById('info-city').textContent = storeInfo.city;
    document.getElementById('info-province').textContent = storeInfo.province;
    
    function fmtTime(t) {
        if (!t) return '';
        const s = String(t).trim();
        if (/am|pm/i.test(s)) return s;
        if (/^\d{1,2}:\d{2}$/.test(s)) {
            try {
                return new Date(`2000-01-01 ${s}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } catch (e) { return s; }
        }
        return s;
    }

    const openTime = fmtTime(storeInfo.openTime);
    const closeTime = fmtTime(storeInfo.closeTime);
    
    document.getElementById('info-open').textContent = openTime;
    document.getElementById('info-close').textContent = closeTime;
    document.getElementById('info-days').textContent = storeInfo.days;
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    try { initializeDashboard(); } catch(e) { console.error(e); }
    if (typeof updateHeader === 'function') try { updateHeader(); } catch(e){ console.warn(e); }
    if (typeof makeLogoClickable === 'function') try { makeLogoClickable(); } catch(e){ console.warn(e); }
});
