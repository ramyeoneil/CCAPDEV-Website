// Sample product data
let products = [
    { id: 1, name: "RTX 4090 Graphics Card", price: 89999, category: "Graphics Card", description: "Latest NVIDIA flagship GPU", stock: 5 },
    { id: 2, name: "Intel Core i9-14900K", price: 35999, category: "CPU", description: "High-performance processor", stock: 12 },
    { id: 3, name: "G.Skill Trident Z5 RGB 32GB", price: 8999, category: "RAM", description: "DDR5 6000MHz memory kit", stock: 20 }
];

// Sample reviews data
let storeReviews = [
    { id: 1, user: "johndoe123", rating: 5, headline: "Excellent service!", text: "Fast shipping and genuine products. Highly recommended!", date: "2026-02-15" },
    { id: 2, user: "janedoe456", rating: 4, headline: "Good prices", text: "Competitive pricing and helpful staff.", date: "2026-02-10" },
    { id: 3, user: "techguru99", rating: 5, headline: "Best PC store", text: "Wide selection and knowledgeable team. Will buy again!", date: "2026-02-05" }
];

// Store info
let storeInfo = {
    name: "PC Hub Manila",
    email: "contact@pchubmanila.com",
    phone: "+63 917 123 4567",
    website: "www.pchubmanila.com",
    address: "123 Tech Street, Makati City",
    city: "Makati City",
    province: "Metro Manila",
    openTime: "09:00",
    closeTime: "19:00",
    days: "Mon - Sat"
};

let currentEditingProductId = null;

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.dashboard-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Load products
function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">📦</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₱${product.price.toLocaleString()}</div>
                <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #666; margin-bottom: 0.8rem;">
                    ${product.category} • Stock: ${product.stock}
                </div>
                <div class="product-actions">
                    <button class="action-btn btn-edit" onclick="editProduct(${product.id})">EDIT</button>
                    <button class="action-btn btn-delete" onclick="deleteProduct(${product.id})">DELETE</button>
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
                    <div class="review-user">${review.user}</div>
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
        
        openModal('product-modal');
    }
}

// Delete product
async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const confirmed = await showConfirmation(`Delete ${product.name}?`, 'Delete Product');
    
    if (confirmed) {
        products = products.filter(p => p.id !== id);
        loadProducts();
        showNotification('Product deleted successfully!', 'Success', 'success');
    }
}

// Product form submission
document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        stock: parseInt(document.getElementById('product-stock').value)
    };
    
    if (currentEditingProductId) {
        // Edit existing product
        const product = products.find(p => p.id === currentEditingProductId);
        Object.assign(product, productData);
        showNotification('Product updated successfully!', 'Success', 'success');
    } else {
        // Add new product
        const newProduct = {
            id: Math.max(...products.map(p => p.id), 0) + 1,
            ...productData
        };
        products.push(newProduct);
        showNotification('Product added successfully!', 'Success', 'success');
    }
    
    loadProducts();
    closeModal('product-modal');
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
    
    openModal('edit-store-modal');
}

// Store info form submission
document.getElementById('edit-store-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    storeInfo.name = document.getElementById('edit-name').value;
    storeInfo.email = document.getElementById('edit-email').value;
    storeInfo.phone = document.getElementById('edit-phone').value;
    storeInfo.website = document.getElementById('edit-website').value;
    storeInfo.address = document.getElementById('edit-address').value;
    storeInfo.openTime = document.getElementById('edit-open').value;
    storeInfo.closeTime = document.getElementById('edit-close').value;
    
    updateStoreInfoDisplay();
    closeModal('edit-store-modal');
    showNotification('Store information updated successfully!', 'Success', 'success');
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
    
    // Format time display
    const openTime = new Date(`2000-01-01 ${storeInfo.openTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const closeTime = new Date(`2000-01-01 ${storeInfo.closeTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
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
    loadProducts();
    loadReviews();
    updateStoreInfoDisplay();
});
