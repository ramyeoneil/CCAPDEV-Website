// Sample products data
const storeProducts = [
    { id: 1, name: "NVIDIA RTX 4090 24GB", price: 89999, category: "Graphics Card", stock: 5 },
    { id: 2, name: "Intel Core i9-14900K", price: 35999, category: "CPU", stock: 12 },
    { id: 3, name: "G.Skill Trident Z5 32GB DDR5", price: 8999, category: "RAM", stock: 20 },
    { id: 4, name: "Samsung 990 PRO 2TB NVMe", price: 12499, category: "Storage", stock: 15 },
    { id: 5, name: "ASUS ROG Strix Z790-E", price: 28999, category: "Motherboard", stock: 8 },
    { id: 6, name: "Corsair RM1000x 1000W PSU", price: 11999, category: "Power Supply", stock: 10 },
    { id: 7, name: "NZXT H7 Flow RGB", price: 7999, category: "Case", stock: 6 },
    { id: 8, name: "Arctic Liquid Freezer II 360", price: 6999, category: "Cooling", stock: 14 }
];

// Sample reviews data
let allReviews = [
    {
        id: 1,
        user: "johndoe123",
        rating: 5,
        headline: "Excellent service and genuine products!",
        text: "I've been buying from PC Hub for 2 years now. Their staff is knowledgeable and prices are competitive. Highly recommend for anyone building a PC!",
        date: "2026-02-15"
    },
    {
        id: 2,
        user: "janedoe456",
        rating: 4,
        headline: "Great selection, fast delivery",
        text: "Wide range of products and quick shipping. Only 4 stars because parking is a bit tight.",
        date: "2026-02-10"
    },
    {
        id: 3,
        user: "techguru99",
        rating: 5,
        headline: "Best PC store in Makati!",
        text: "The team helped me build my dream gaming rig. Very patient with all my questions. Will definitely come back!",
        date: "2026-02-05"
    },
    {
        id: 4,
        user: "gamer2026",
        rating: 5,
        headline: "Professional and reliable",
        text: "Ordered a RTX 4090 and it arrived perfectly packaged. Genuine product with warranty. Thank you PC Hub!",
        date: "2026-02-01"
    },
    {
        id: 5,
        user: "builder_ph",
        rating: 4,
        headline: "Good prices, helpful staff",
        text: "They price-matched a competitor and threw in a free mouse pad. Customer service is top-notch.",
        date: "2026-01-28"
    }
];

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
    event.target.classList.add('active');
}

// Load products
function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    storeProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = '<div class="product-img">PRODUCT IMAGE</div>' +
            '<div class="product-details">' +
            '<div class="product-title">' + product.name + '</div>' +
            '<div class="product-category">' + product.category + '</div>' +
            '<div class="product-price-display">PHP ' + product.price.toLocaleString() + '</div>' +
            '<div class="product-stock">' + (product.stock > 0 ? product.stock + ' in stock' : 'Out of stock') + '</div>' +
            '</div>';
        container.appendChild(item);
    });
}

// Load reviews
function loadReviews(filter) {
    if (!filter) filter = 'all';
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';
    
    let reviewsToShow = filter === 'all' ? allReviews : allReviews.filter(function(r) { return r.rating === filter; });
    
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
            '<div class="review-user">' + review.user + '</div>' +
            '<div style="font-size: 0.8rem; color: #666; font-family: var(--font-mono); margin-top: 0.3rem;">' + review.date + '</div>' +
            '</div>' +
            '<div class="review-rating">' + stars + '</div>' +
            '</div>' +
            '<div style="font-weight: 600; font-size: 1.1rem; margin: 1rem 0 0.5rem 0;">' + review.headline + '</div>' +
            '<div class="review-text">' + review.text + '</div>';
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
    
    const storeId = 1;
    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');
    const index = favorites.indexOf(storeId);
    
    const icon = document.getElementById('fav-icon');
    
    if (index > -1) {
        favorites.splice(index, 1);
        icon.textContent = 'ADD TO FAVORITES';
        showNotification('Removed from favorites!', 'Removed', 'warning');
    } else {
        favorites.push(storeId);
        icon.textContent = 'REMOVE FROM FAVORITES';
        showNotification('Added to favorites!', 'Success', 'success');
    }
    
    localStorage.setItem('techamuna_favorite_stores', JSON.stringify(favorites));
}

// Check if store is already favorited
function checkStoreFavorite() {
    const storeId = 1;
    const favorites = JSON.parse(localStorage.getItem('techamuna_favorite_stores') || '[]');
    
    if (favorites.includes(storeId)) {
        const icon = document.getElementById('fav-icon');
        icon.textContent = 'REMOVE FROM FAVORITES';
    }
}

// Write review
function writeReview() {
    if (!requireLogin('write a review')) {
        return;
    }
    showNotification('Review form coming soon!', 'Info', 'success');
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
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadReviews();
    updateRatingDisplay();
    checkStoreFavorite();
});
