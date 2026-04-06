// Global Data Storage (simulating a database)
// In a real app, this would be stored in a backend database

// Initialize data from localStorage or create new
function initializeData() {
    // No local seed data — rely on backend API for all canonical data.
    // Keep current user slot present for login flow.
    if (!localStorage.getItem('techamuna_currentUser')) {
        localStorage.setItem('techamuna_currentUser', JSON.stringify(null));
    }
}

// API base: when serving static files from a different port, point to the API server
const API_BASE = (function () {
    try {
        const host = location.hostname;
        const port = location.port;
        if ((host === 'localhost' || host === '127.0.0.1') && port !== '3000') return 'http://localhost:3000';
        return '';
    } catch (e) {
        return 'http://localhost:3000';
    }
})();
window.API_BASE = API_BASE;

// Get current logged in user
function getCurrentUser() {
    const user = localStorage.getItem('techamuna_currentUser');
    return user ? JSON.parse(user) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('techamuna_currentUser', JSON.stringify(user));
}

// Check if user is logged in (for features that require auth)
function isLoggedIn() {
    const user = getCurrentUser();
    return user !== null;
}

// Require login with redirect
function requireLogin(action = 'perform this action') {
    if (!isLoggedIn()) {
        showNotification(`Please log in to ${action}`, 'Login Required', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    return true;
}

// Logout
async function logout() {
    const confirmed = await showConfirmation('Are you sure you want to log out?', 'Confirm Logout');
    
    if (confirmed) {
        localStorage.setItem('techamuna_currentUser', JSON.stringify(null));
        showNotification('You have been logged out successfully', 'Logged Out', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('techamuna_users') || '[]');
}

// Save users
function saveUsers(users) {
    localStorage.setItem('techamuna_users', JSON.stringify(users));
}

// Get all stores
function getAllStores() {
    return JSON.parse(localStorage.getItem('techamuna_stores') || '[]');
}

// Save stores
function saveStores(stores) {
    localStorage.setItem('techamuna_stores', JSON.stringify(stores));
}

// Get all products
function getAllProducts() {
    return JSON.parse(localStorage.getItem('techamuna_products') || '[]');
}

// Save products
function saveProducts(products) {
    localStorage.setItem('techamuna_products', JSON.stringify(products));
}

// Get all reviews
function getAllReviews() {
    return JSON.parse(localStorage.getItem('techamuna_reviews') || '[]');
}

// Save reviews
function saveReviews(reviews) {
    localStorage.setItem('techamuna_reviews', JSON.stringify(reviews));
}

// Utility: next review id
function getNextReviewId() {
    const reviews = getAllReviews();
    return reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
}

// Add a new review
function addReview(review) {
    const reviews = getAllReviews();
    const newReview = {
        id: getNextReviewId(),
        date: new Date().toISOString().split('T')[0],
        upvotes: 0,
        comments: [],
        media: [],
        builderScores: { pricing: review.pricing || 0, customerService: review.customerService || 0, afterSales: review.afterSales || 0 },
        ...review
    };
    // compute aggregate rating if not provided
    if (!newReview.rating) {
        const scores = Object.values(newReview.builderScores || {});
        newReview.rating = Math.round(scores.reduce((a,b)=>a+b,0) / (scores.length || 1));
    }
    reviews.unshift(newReview);
    saveReviews(reviews);
    return newReview;
}

// Update existing review by id (partial update)
function updateReview(id, patch) {
    const reviews = getAllReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reviews[idx] = { ...reviews[idx], ...patch };
    // if builderScores changed, recalc rating
    if (patch.builderScores) {
        const scores = Object.values(reviews[idx].builderScores);
        reviews[idx].rating = Math.round(scores.reduce((a,b)=>a+b,0) / (scores.length || 1));
    }
    saveReviews(reviews);
    return reviews[idx];
}

// Delete review
function deleteReview(id) {
    let reviews = getAllReviews();
    reviews = reviews.filter(r => r.id !== id);
    saveReviews(reviews);
}

// Upvote a review (one upvote per user stored locally)
function upvoteReview(reviewId, userId) {
    const reviews = getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return null;
    // track user upvotes in localStorage map
    const key = 'techamuna_review_upvotes';
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    map[reviewId] = map[reviewId] || [];
    if (map[reviewId].includes(userId)) return reviews[idx]; // already upvoted
    map[reviewId].push(userId);
    localStorage.setItem(key, JSON.stringify(map));
    reviews[idx].upvotes = (reviews[idx].upvotes || 0) + 1;
    saveReviews(reviews);
    return reviews[idx];
}

// Add comment to review
function addCommentToReview(reviewId, comment) {
    const reviews = getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return null;
    const commentObj = {
        id: Date.now(),
        userId: comment.userId,
        username: comment.username,
        text: comment.text,
        date: new Date().toISOString().split('T')[0]
    };
    reviews[idx].comments = reviews[idx].comments || [];
    reviews[idx].comments.push(commentObj);
    saveReviews(reviews);
    return commentObj;
}

// Helper: convert File to dataURL (for small images)
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Expose review helpers globally
window.addReview = addReview;
window.updateReview = updateReview;
window.deleteReview = deleteReview;
window.upvoteReview = upvoteReview;
window.addCommentToReview = addCommentToReview;
window.fileToDataURL = fileToDataURL;

// Get community posts
function getCommunityPosts() {
    return JSON.parse(localStorage.getItem('techamuna_community_posts') || '[]');
}

// Save community posts
function saveCommunityPosts(posts) {
    localStorage.setItem('techamuna_community_posts', JSON.stringify(posts));
}

// Compute builder identity for a single user based on reviews and post likes
function computeBuilderIdentity(user) {
    if (!user || !user.id) return 'Novice';

    const reviews = getAllReviews();
    const posts = getCommunityPosts();

    const reviewsCount = reviews.filter(r => r.userId === user.id).length;
    const totalLikes = posts.filter(p => p.userId === user.id).reduce((s, p) => s + (p.likes || 0), 0);

    // Rules (updated to make progression harder):
    // - Veteran: >=25 reviews OR totalLikes >=500
    // - Enthusiast: >=8 reviews OR totalLikes >=150
    // - Novice: otherwise
    let identity = 'Novice';
    if (reviewsCount >= 25 || totalLikes >= 500) {
        identity = 'Veteran';
    } else if (reviewsCount >= 8 || totalLikes >= 150) {
        identity = 'Enthusiast';
    }

    // Persist change if different
    if (user.builderIdentity !== identity) {
        user.builderIdentity = identity;
        const users = getAllUsers();
        const idx = users.findIndex(u => String(u.id) === String(user.id));
        if (idx !== -1) {
            users[idx] = user;
            saveUsers(users);
            // if currently logged in user, update currentUser
            const current = getCurrentUser();
            if (current && current.id === user.id) setCurrentUser(user);
        }
    }

    return identity;
}

// Compute identities for all users (useful at init)
function computeAllUsersIdentity() {
    const users = getAllUsers();
    let changed = false;
    users.forEach(u => {
        const newId = computeBuilderIdentity(u);
        if (u.builderIdentity !== newId) changed = true;
    });
    if (changed) saveUsers(users);
}

// Register new user (persists to MongoDB via API)
async function registerUser(userData) {
    try {
        const res = await fetch(API_BASE + '/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                username: userData.username,
                address: userData.address,
                city: userData.city,
                province: userData.province,
                postalCode: userData.postalCode
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.error === 'Email already registered' ? 'Email already registered' : (data.error || 'Registration failed');
            return { success: false, message: msg };
        }
        const u = data.user;
        const normalized = { ...u, id: u._id || u.id };
        const users = getAllUsers().filter(x => String(x.id) !== String(normalized.id));
        users.push(normalized);
        saveUsers(users);
        return { success: true, user: normalized };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Could not reach server. Is the API running?' };
    }
}

// Login (verified against API; passwords are hashed on the server)
async function loginUser(email, password) {
    try {
        const res = await fetch(API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            let msg = data.error || 'Invalid email or password';
            if (res.status === 403) msg = 'Your store application is pending approval';
            return { success: false, message: msg };
        }
        const u = data.user;
        const normalized = { ...u, id: u._id || u.id };
        const users = getAllUsers();
        const idx = users.findIndex(x => String(x.id) === String(normalized.id));
        if (idx >= 0) users[idx] = normalized;
        else users.push(normalized);
        saveUsers(users);
        computeBuilderIdentity(normalized);
        const refreshed = getAllUsers().find(x => String(x.id) === String(normalized.id)) || normalized;
        setCurrentUser(refreshed);
        return { success: true, user: refreshed };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Could not reach server. Is the API running?' };
    }
}

// Check if user is logged in and redirect if not
function requireAuth(allowedTypes = []) {
    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(user.type)) {
        alert('Access denied');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Update header based on login status
function updateHeader() {
    const user = getCurrentUser();
    const headerActions = document.querySelector('.header-actions');
    
    if (!headerActions) return;
    
    if (user) {
        let profilelink = 'userpage.html'
        let dashboardLink = 'index.html';
        let dashboardText = user.username || user.storeName || 'ADMIN';
        
        if (user.type === 'admin') {
            dashboardLink = 'admin-dashboard.html';
        } else if (user.type === 'store') {
            dashboardLink = 'store-dashboard.html';
        }
        
        const avatar = (user.profileImage) ? `<img src="${user.profileImage}" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;margin-right:8px;object-fit:cover;">` : '';
        headerActions.innerHTML = `
            <button class="header-btn" data-href="map.html">MAP</button>
            <button class="header-btn" data-href="favorites.html">FAVS</button>
            <button class="header-btn signup" data-href="${profilelink}">${avatar}${dashboardText.toUpperCase()}</button>
            <button class="header-btn" data-action="logout">LOGOUT</button>
        `;
    } else {
        // Not logged in
        headerActions.innerHTML = `
            <button class="header-btn" data-href="map.html">MAP</button>
            <button class="header-btn" data-action="checkLoginForFavorites">FAVS</button>
            <button class="header-btn signup" data-href="signup-user.html">SIGNUP</button>
        `;
    }
}

// Check login before accessing favorites
function checkLoginForFavorites() {
    if (!requireLogin('view your favorites')) {
        return;
    }
    window.location.href = 'favorites.html';
}

// Make logo clickable
function makeLogoClickable() {
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.style.cursor = 'pointer';
        logoContainer.onclick = function() {
            window.location.href = 'index.html';
        };
    }
}

// Initialize on page load
initializeData();

// Attempt to fetch canonical data from backend API and cache into localStorage
(async function fetchAndCacheFromApi() {
    try {
        const res = await fetch(API_BASE + '/api/data');
        if (!res.ok) return;
        const json = await res.json();
        // Map server documents (_id) to frontend-friendly id fields
        if (Array.isArray(json.users) && json.users.length) {
            const users = json.users.map(u => ({ ...u, id: u._id || u.id }));
            saveUsers(users);
            console.log('Cached users from API');
        }
        if (Array.isArray(json.stores) && json.stores.length) {
            const stores = json.stores.map(s => ({ ...s, id: s._id || s.id }));
            saveStores(stores);
            console.log('Cached stores from API');
        }
        if (Array.isArray(json.products) && json.products.length) {
            const products = json.products.map(p => ({ ...p, id: p._id || p.id }));
            saveProducts(products);
            console.log('Cached products from API');
        }
        if (Array.isArray(json.reviews) && json.reviews.length) {
            const reviews = json.reviews.map(r => ({ ...r, id: r._id || r.id }));
            saveReviews(reviews);
            console.log('Cached reviews from API');
        }
        if (Array.isArray(json.posts) && json.posts.length) {
            const posts = json.posts.map(p => ({ ...p, id: p._id || p.id }));
            saveCommunityPosts(posts);
            console.log('Cached posts from API');
        }
    } catch (err) {
        // non-fatal: keep using localStorage seed data
        console.warn('Could not fetch API data, using localStorage defaults', err);
    }
})();

// Global delegator: handle elements with `data-href` to perform navigation without inline onclicks
document.addEventListener('click', function (e) {
    const el = e.target.closest && e.target.closest('[data-href]');
    if (!el) return;
    const href = el.getAttribute('data-href');
    if (!href) return;
    // allow middle-click / modifier behavior to pass through
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.location.href = href;
});

// Fetch stores from API (live). Returns array or null on failure.
async function fetchStoresFromApi(q = '', limit = 12) {
    try {
        const url = API_BASE + '/api/stores' + (q ? '?q=' + encodeURIComponent(q) + '&limit=' + encodeURIComponent(limit) : '?limit=' + encodeURIComponent(limit));
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        // normalize id field
        return Array.isArray(data) ? data.map(s => ({ ...s, id: s._id || s.id })) : [];
    } catch (err) {
        return null;
    }
}

// Fetch single store by id from API
async function fetchStoreById(id) {
    try {
        const res = await fetch(API_BASE + '/api/stores/' + encodeURIComponent(id));
        if (!res.ok) return null;
        const s = await res.json();
        return s ? { ...s, id: s._id || s.id } : null;
    } catch (err) { return null; }
}

// expose API helpers
window.fetchStoresFromApi = fetchStoresFromApi;
window.fetchStoreById = fetchStoreById;

// Create modal HTML and inject into page
function createModalHTML() {
    const modalHTML = `
        <!-- Notification Modal -->
        <div id="notification-modal" class="center-modal">
            <div class="center-modal-content">
                <div class="modal-icon" id="notification-icon">✓</div>
                <h2 id="notification-title">Success</h2>
                <p id="notification-message">Operation completed successfully</p>
                <button class="modal-btn" onclick="closeNotification()">OK</button>
            </div>
        </div>

        <!-- Confirmation Modal -->
        <div id="confirmation-modal" class="center-modal">
            <div class="center-modal-content">
                <div class="modal-icon warning">⚠</div>
                <h2 id="confirmation-title">Confirm Action</h2>
                <p id="confirmation-message">Are you sure you want to proceed?</p>
                <div class="modal-buttons">
                    <button class="modal-btn cancel" onclick="closeConfirmation(false)">CANCEL</button>
                    <button class="modal-btn confirm" onclick="closeConfirmation(true)">CONFIRM</button>
                </div>
            </div>
        </div>

        <style>
            .center-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999;
                align-items: center;
                justify-content: center;
            }

            .center-modal.show {
                display: flex;
                animation: fadeIn 0.3s ease;
            }

            .center-modal-content {
                background: var(--white);
                border: 3px solid var(--primary-green);
                border-radius: 16px;
                padding: 3rem 2.5rem;
                min-width: 400px;
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 112, 60, 0.3);
            }

            .modal-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 1.5rem;
                background: var(--primary-green);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                color: var(--white);
            }

            .modal-icon.warning {
                background: #ffc107;
            }

            .modal-icon.error {
                background: #dc3545;
            }

            .center-modal-content h2 {
                font-size: 1.8rem;
                color: var(--primary-green);
                letter-spacing: 2px;
                margin-bottom: 1rem;
                font-family: var(--font-display);
            }

            .center-modal-content p {
                font-size: 1.1rem;
                color: #444;
                line-height: 1.6;
                margin-bottom: 2rem;
                font-family: var(--font-mono);
            }

            .modal-btn {
                padding: 0.9rem 2.5rem;
                border: none;
                border-radius: 8px;
                font-family: var(--font-display);
                font-weight: 600;
                font-size: 1rem;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .modal-btn.confirm,
            .modal-btn:not(.cancel) {
                background: var(--primary-green);
                color: var(--white);
            }

            .modal-btn.cancel {
                background: var(--light-gray);
                color: var(--black);
                margin-right: 1rem;
            }

            .modal-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { 
                    transform: translateY(50px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Show notification modal
function showNotification(message, title = 'Success', type = 'success') {
    const modal = document.getElementById('notification-modal');
    const icon = document.getElementById('notification-icon');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    
    // Set icon based on type
    if (type === 'success') {
        icon.textContent = '✓';
        icon.className = 'modal-icon';
    } else if (type === 'error') {
        icon.textContent = '✕';
        icon.className = 'modal-icon error';
    } else if (type === 'warning') {
        icon.textContent = '⚠';
        icon.className = 'modal-icon warning';
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('show');
}

// Close notification modal
function closeNotification() {
    document.getElementById('notification-modal').classList.remove('show');
}

// Show confirmation modal
let confirmationCallback = null;

function showConfirmation(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('show');
        
        confirmationCallback = resolve;
    });
}

// Close confirmation modal
function closeConfirmation(result) {
    document.getElementById('confirmation-modal').classList.remove('show');
    if (confirmationCallback) {
        confirmationCallback(result);
        confirmationCallback = null;
    }
}

// Global search suggestions for header search bars (all pages)
function initGlobalSearchSuggestions() {
    const inputs = Array.from(document.querySelectorAll('.search-input'));
    if (!inputs.length) return;

    function ensureSuggestionBox(input) {
        if (input.parentElement && input.parentElement.classList.contains('search-suggestions')) {
            const existing = input.parentElement.querySelector('.suggestions-list');
            return existing || null;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'search-suggestions';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        const list = document.createElement('div');
        list.className = 'suggestions-list';
        list.style.display = 'none';
        wrapper.appendChild(list);
        return list;
    }

    async function pickBestStore(query) {
        let m = null;
        if (typeof fetchStoresFromApi === 'function') {
            const apiRes = await fetchStoresFromApi(query, 1);
            if (Array.isArray(apiRes) && apiRes.length) m = apiRes[0];
        }
        if (!m) {
            const stores = (typeof getAllStores === 'function') ? getAllStores() : [];
            m = stores.find(s => s.name && s.name.toLowerCase().includes(query));
        }
        return m ? { ...m, id: m.id || m._id } : null;
    }

    inputs.forEach(input => {
        const list = ensureSuggestionBox(input);
        if (!list || input.dataset.searchBound === 'true') return;
        input.dataset.searchBound = 'true';
        let debounce = null;

        async function showMatches(q) {
            if (!q) {
                list.style.display = 'none';
                list.innerHTML = '';
                return;
            }
            let matches = [];
            if (typeof fetchStoresFromApi === 'function') {
                const apiRes = await fetchStoresFromApi(q, 6);
                if (Array.isArray(apiRes) && apiRes.length) matches = apiRes;
            }
            if (!matches.length) {
                const stores = (typeof getAllStores === 'function') ? getAllStores() : [];
                matches = stores.filter(s => s.name && s.name.toLowerCase().includes(q)).slice(0, 6);
            }
            if (!matches.length) {
                list.style.display = 'none';
                list.innerHTML = '';
                return;
            }
            list.innerHTML = '';
            matches.forEach(s => {
                const normalized = { ...s, id: s.id || s._id };
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = (normalized.name || 'Store') + (normalized.location ? (' - ' + normalized.location) : '');
                item.addEventListener('click', () => {
                    try { localStorage.setItem('techamuna_lastSelectedStore', JSON.stringify(normalized)); } catch (e) {}
                    window.location.href = 'store-page.html?storeId=' + encodeURIComponent(normalized.id);
                });
                list.appendChild(item);
            });
            list.style.display = 'block';
        }

        input.addEventListener('input', e => {
            const q = e.target.value.trim().toLowerCase();
            clearTimeout(debounce);
            debounce = setTimeout(() => showMatches(q), 180);
        });

        input.addEventListener('keydown', async e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const q = input.value.trim().toLowerCase();
            if (!q) return;
            const m = await pickBestStore(q);
            if (!m) return;
            try { localStorage.setItem('techamuna_lastSelectedStore', JSON.stringify(m)); } catch (err) {}
            window.location.href = 'store-page.html?storeId=' + encodeURIComponent(m.id);
        });

        document.addEventListener('click', ev => {
            if (!input.parentNode.contains(ev.target)) list.style.display = 'none';
        });
    });
}

// Initialize modals when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createModalHTML();
        makeLogoClickable();
        initGlobalSearchSuggestions();
    });
} else {
    createModalHTML();
    makeLogoClickable();
    initGlobalSearchSuggestions();
}

// Add functions to window for global access
window.logout = logout;
window.showNotification = showNotification;
window.showConfirmation = showConfirmation;
window.closeNotification = closeNotification;
window.closeConfirmation = closeConfirmation;
window.requireLogin = requireLogin;
window.isLoggedIn = isLoggedIn;
window.checkLoginForFavorites = checkLoginForFavorites;

// Provide a simple history back helper for delegation
function historyBack() { window.history.back(); }
window.historyBack = historyBack;

// Toggle favorite state for a review (used on review-detail page)
function toggleReviewFavorite() {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('id');
    if (!reviewId) return;
    const key = 'techamuna_favorite_reviews';
    const favs = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = favs.indexOf(reviewId);
    if (idx === -1) favs.push(reviewId); else favs.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(favs));
    const icon = document.getElementById('fav-icon');
    if (icon) icon.textContent = (idx === -1) ? '♥' : '♡';
    showNotification((idx === -1) ? 'Added to favorites' : 'Removed from favorites', 'Favorites', 'success');
}
window.toggleReviewFavorite = toggleReviewFavorite;

// Global delegator: handle elements with `data-action` to call whitelisted functions
document.addEventListener('click', function (e) {
    const el = e.target.closest && e.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    if (!action) return;
    // parse args: prefer data-args (JSON) then data-arg (single string)
    let args = [];
    if (el.hasAttribute('data-args')) {
        try { args = JSON.parse(el.getAttribute('data-args')); } catch (e) { args = [el.getAttribute('data-args')]; }
    } else if (el.hasAttribute('data-arg')) {
        args = [el.getAttribute('data-arg')];
    }

    // Allow modifier/middle-clicks to pass through for navigation actions only
    if (e.button !== 0 && typeof e.button !== 'undefined') return;

    // If the target function exists on window and is callable, call it with args and event
    const fn = window[action];
    if (typeof fn === 'function') {
        try {
            // pass event as last argument for handlers that need it
            fn.apply(null, args.concat([e]));
        } catch (err) {
            console.error('Error calling action', action, err);
        }
    } else {
        console.warn('No action handler for', action);
    }
});
