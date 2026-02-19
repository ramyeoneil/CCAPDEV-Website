// Global Data Storage (simulating a database)
// In a real app, this would be stored in a backend database

// Initialize data from localStorage or create new
function initializeData() {
    if (!localStorage.getItem('techamuna_users')) {
        localStorage.setItem('techamuna_users', JSON.stringify([
            {
                id: 1,
                type: 'admin',
                email: 'admin@techamuna.com',
                password: 'admin123',
                username: 'Admin',
                dateJoined: '2025-01-01'
            },
            {
                id: 2,
                type: 'user',
                email: 'user@email.com',
                password: 'user123',
                username: 'johndoe123',
                address: 'Manila',
                city: 'Manila',
                province: 'Metro Manila',
                postalCode: '1000',
                dateJoined: '2025-12-01'
            },
            {
                id: 3,
                type: 'store',
                email: 'pcshub@email.com',
                password: 'store123',
                storeName: 'PC Hub Manila',
                phone: '+63 917 123 4567',
                website: 'www.pchubmanila.com',
                region: 'NCR',
                province: 'Metro Manila',
                city: 'Makati City',
                address: '123 Tech Street, Makati City',
                openTime: '09:00',
                closeTime: '19:00',
                operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                status: 'approved',
                dateJoined: '2025-10-15'
            }
        ]));
    }

    if (!localStorage.getItem('techamuna_currentUser')) {
        localStorage.setItem('techamuna_currentUser', JSON.stringify(null));
    }

    if (!localStorage.getItem('techamuna_stores')) {
        localStorage.setItem('techamuna_stores', JSON.stringify([
            {
                id: 1,
                name: 'PC Hub Manila',
                email: 'pcshub@email.com',
                location: 'Makati City',
                rating: 4.8,
                reviewCount: 127,
                status: 'approved',
                dateApplied: '2025-10-15'
            }
        ]));
    }

    if (!localStorage.getItem('techamuna_products')) {
        localStorage.setItem('techamuna_products', JSON.stringify([
            { id: 1, storeId: 1, name: "RTX 4090 Graphics Card", price: 89999, category: "Graphics Card", description: "Latest NVIDIA flagship GPU", stock: 5 },
            { id: 2, storeId: 1, name: "Intel Core i9-14900K", price: 35999, category: "CPU", description: "High-performance processor", stock: 12 },
            { id: 3, storeId: 1, name: "G.Skill Trident Z5 RGB 32GB", price: 8999, category: "RAM", description: "DDR5 6000MHz memory kit", stock: 20 }
        ]));
    }

    if (!localStorage.getItem('techamuna_reviews')) {
        localStorage.setItem('techamuna_reviews', JSON.stringify([
            { id: 1, storeId: 1, storeName: 'PC Hub Manila', userId: 2, username: 'johndoe123', rating: 5, headline: "Excellent service!", text: "Fast shipping and genuine products. Highly recommended!", date: "2026-02-15" },
            { id: 2, storeId: 1, storeName: 'PC Hub Manila', userId: 2, username: 'janedoe456', rating: 4, headline: "Good prices", text: "Competitive pricing and helpful staff.", date: "2026-02-10" },
            { id: 3, storeId: 1, storeName: 'TechZone QC', userId: 2, username: 'techguru99', rating: 5, headline: "Outstanding customer service", text: "The team helped me build my dream gaming rig. Very patient with all my questions.", date: "2026-02-05" },
            { id: 4, storeId: 1, storeName: 'GamersParadise', userId: 2, username: 'gamer2026', rating: 5, headline: "Best PC store in Manila", text: "Wide selection of components and accessories. Great prices!", date: "2026-02-01" },
            { id: 5, storeId: 1, storeName: 'ByteShop', userId: 2, username: 'builder_ph', rating: 4, headline: "Good experience overall", text: "Staff was knowledgeable. Only minor issue was parking.", date: "2026-01-28" },
            { id: 6, storeId: 1, storeName: 'Silicon Valley PH', userId: 2, username: 'pcmaster', rating: 5, headline: "Genuine products", text: "All products come with proper warranty. Very reliable!", date: "2026-01-25" },
            { id: 7, storeId: 1, storeName: 'Hardware Haven', userId: 2, username: 'reviewer123', rating: 4, headline: "Great customer support", text: "They answered all my questions patiently.", date: "2026-01-20" },
            { id: 8, storeId: 1, storeName: 'PC Hub Manila', userId: 2, username: 'techie2026', rating: 5, headline: "Fast delivery", text: "Ordered on Monday, received on Wednesday. Excellent!", date: "2026-01-15" }
        ]));
    }

    if (!localStorage.getItem('techamuna_community_posts')) {
        localStorage.setItem('techamuna_community_posts', JSON.stringify([
            {
                id: 1,
                userId: 2,
                username: 'johndoe123',
                title: 'Just finished my first custom PC build!',
                content: 'After months of saving and researching, I finally completed my dream build. RTX 4090, i9-14900K, 64GB RAM. Runs like a beast! Special thanks to PC Hub Manila for the great prices and advice.',
                image: 'https://via.placeholder.com/600x400/00703c/ffffff?text=MY+BUILD',
                likes: 127,
                comments: 23,
                date: '2026-02-15'
            },
            {
                id: 2,
                userId: 2,
                username: 'techguru99',
                title: 'PSA: Check your PSU before upgrading GPU',
                content: 'Friendly reminder to everyone upgrading to new high-end GPUs - make sure your power supply can handle it! Just helped a friend troubleshoot crashes that turned out to be PSU related.',
                likes: 89,
                comments: 15,
                date: '2026-02-14'
            },
            {
                id: 3,
                userId: 2,
                username: 'builder_ph',
                title: 'RGB lighting setup showcase',
                content: 'Finally got my RGB setup exactly how I wanted it. Used Corsair iCUE to sync everything. Check out the photos!',
                image: 'https://via.placeholder.com/600x400/00703c/ffffff?text=RGB+SETUP',
                likes: 156,
                comments: 31,
                date: '2026-02-13'
            }
        ]));
    }
}

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

// Get community posts
function getCommunityPosts() {
    return JSON.parse(localStorage.getItem('techamuna_community_posts') || '[]');
}

// Save community posts
function saveCommunityPosts(posts) {
    localStorage.setItem('techamuna_community_posts', JSON.stringify(posts));
}

// Register new user
function registerUser(userData) {
    const users = getAllUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        ...userData,
        dateJoined: new Date().toISOString().split('T')[0]
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, user: newUser };
}

// Login
function loginUser(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // For store owners, check if approved
        if (user.type === 'store' && user.status !== 'approved') {
            return { success: false, message: 'Your store application is pending approval' };
        }
        
        setCurrentUser(user);
        return { success: true, user: user };
    }
    
    return { success: false, message: 'Invalid email or password' };
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
        
        headerActions.innerHTML = `
            <button class="header-btn" onclick="window.location.href='map.html'">MAP</button>
            <button class="header-btn" onclick="window.location.href='favorites.html'">FAVS</button>
            <button class="header-btn signup" onclick="window.location.href='${profilelink}'">${dashboardText.toUpperCase()}</button>
            <button class="header-btn" onclick="logout()">LOGOUT</button>
        `;
    } else {
        // Not logged in
        headerActions.innerHTML = `
            <button class="header-btn" onclick="window.location.href='map.html'">MAP</button>
            <button class="header-btn" onclick="checkLoginForFavorites()">FAVS</button>
            <button class="header-btn signup" onclick="window.location.href='signup-user.html'">SIGNUP</button>
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

// Initialize modals when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createModalHTML();
        makeLogoClickable();
    });
} else {
    createModalHTML();
    makeLogoClickable();
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
