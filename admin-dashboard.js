// Sample data - In a real application, this would come from a database
let pendingStores = [
    { id: 1, name: "PC Hub Manila", email: "contact@pchubmanila.com", location: "Makati City", dateApplied: "2026-02-10", status: "pending" },
    { id: 2, name: "TechZone Quezon City", email: "info@techzone.com", location: "Quezon City", dateApplied: "2026-02-12", status: "pending" },
    { id: 3, name: "GamersParadise", email: "hello@gamersparadise.ph", location: "Pasig City", dateApplied: "2026-02-14", status: "pending" }
];

let users = [
    { id: 1, username: "johndoe123", email: "john@email.com", address: "Manila", reviewsPosted: 5, dateJoined: "2025-12-01" },
    { id: 2, username: "janedoe456", email: "jane@email.com", address: "Quezon City", reviewsPosted: 12, dateJoined: "2025-11-15" },
    { id: 3, username: "techguru99", email: "guru@email.com", address: "Pasig", reviewsPosted: 8, dateJoined: "2026-01-05" }
];

let reviews = [
    { id: 1, user: "johndoe123", store: "PC Hub Manila", rating: 5, headline: "Excellent service and products!", datePosted: "2026-02-15" },
    { id: 2, user: "janedoe456", store: "TechZone", rating: 4, headline: "Good prices, fast delivery", datePosted: "2026-02-14" },
    { id: 3, user: "techguru99", store: "GamersParadise", rating: 3, headline: "Average experience", datePosted: "2026-02-13" }
];

let allStores = [
    { id: 4, name: "ByteShop", email: "info@byteshop.ph", location: "Taguig", rating: 4.5, reviewCount: 45, status: "approved" },
    { id: 5, name: "Silicon Valley PH", email: "contact@svph.com", location: "BGC", rating: 4.8, reviewCount: 89, status: "approved" },
    { id: 6, name: "Hardware Haven", email: "support@hwhaven.com", location: "Mandaluyong", rating: 4.2, reviewCount: 32, status: "approved" }
];

// Tab switching function
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Load pending stores
function loadPendingStores() {
    const tbody = document.getElementById('pending-stores-table');
    tbody.innerHTML = '';
    
    pendingStores.forEach(store => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${store.name}</td>
            <td>${store.email}</td>
            <td>${store.location}</td>
            <td>${store.dateApplied}</td>
            <td><span class="status-badge status-${store.status}">${store.status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn btn-approve" onclick="approveStore(${store.id})">APPROVE</button>
                <button class="action-btn btn-reject" onclick="rejectStore(${store.id})">REJECT</button>
                <button class="action-btn btn-edit" onclick="editStore(${store.id}, 'pending')">EDIT</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load users
function loadUsers() {
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.address}</td>
            <td>${user.reviewsPosted}</td>
            <td>${user.dateJoined}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editUser(${user.id})">EDIT</button>
                <button class="action-btn btn-delete" onclick="deleteUser(${user.id})">DELETE</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load reviews
function loadReviews() {
    const tbody = document.getElementById('reviews-table');
    tbody.innerHTML = '';
    
    reviews.forEach(review => {
        const row = document.createElement('tr');
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        row.innerHTML = `
            <td>${review.user}</td>
            <td>${review.store}</td>
            <td style="color: var(--primary-green);">${stars}</td>
            <td>${review.headline}</td>
            <td>${review.datePosted}</td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteReview(${review.id})">DELETE</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load all stores
function loadAllStores() {
    const tbody = document.getElementById('all-stores-table');
    tbody.innerHTML = '';
    
    allStores.forEach(store => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${store.name}</td>
            <td>${store.email}</td>
            <td>${store.location}</td>
            <td>${store.rating} ★</td>
            <td>${store.reviewCount}</td>
            <td><span class="status-badge status-${store.status}">${store.status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editStore(${store.id}, 'all')">EDIT</button>
                <button class="action-btn btn-delete" onclick="deleteStore(${store.id})">DELETE</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Approve store
async function approveStore(id) {
    const store = pendingStores.find(s => s.id === id);
    if (!store) return;
    
    const confirmed = await showConfirmation(`Approve ${store.name}?`, 'Approve Store');
    
    if (confirmed) {
        store.status = 'approved';
        // Move to all stores
        allStores.push({...store, rating: 0, reviewCount: 0});
        pendingStores = pendingStores.filter(s => s.id !== id);
        loadPendingStores();
        loadAllStores();
        showNotification(`${store.name} has been approved!`, 'Store Approved', 'success');
    }
}

// Reject store
async function rejectStore(id) {
    const store = pendingStores.find(s => s.id === id);
    if (!store) return;
    
    const confirmed = await showConfirmation(`Reject ${store.name}?`, 'Reject Store');
    
    if (confirmed) {
        store.status = 'rejected';
        loadPendingStores();
        showNotification(`${store.name} has been rejected.`, 'Store Rejected', 'warning');
    }
}

// Edit store
let currentEditingStoreId = null;
let currentEditingStoreType = null;

function editStore(id, type) {
    currentEditingStoreId = id;
    currentEditingStoreType = type;
    
    let store;
    if (type === 'pending') {
        store = pendingStores.find(s => s.id === id);
    } else {
        store = allStores.find(s => s.id === id);
    }
    
    if (store) {
        document.getElementById('edit-store-name').value = store.name;
        document.getElementById('edit-store-email').value = store.email;
        document.getElementById('edit-store-phone').value = store.phone || '';
        document.getElementById('edit-store-address').value = store.location;
        document.getElementById('edit-store-status').value = store.status;
        
        openModal('edit-store-modal');
    }
}

// Delete store
async function deleteStore(id) {
    const store = allStores.find(s => s.id === id);
    if (!store) return;
    
    const confirmed = await showConfirmation(`Delete ${store.name}? This action cannot be undone.`, 'Delete Store');
    
    if (confirmed) {
        allStores = allStores.filter(s => s.id !== id);
        loadAllStores();
        showNotification(`${store.name} has been deleted.`, 'Store Deleted', 'success');
    }
}

// Edit user
let currentEditingUserId = null;

function editUser(id) {
    currentEditingUserId = id;
    const user = users.find(u => u.id === id);
    
    if (user) {
        document.getElementById('edit-user-name').value = user.username;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-address').value = user.address;
        
        openModal('edit-user-modal');
    }
}

// Delete user
async function deleteUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const confirmed = await showConfirmation(`Delete user ${user.username}? This action cannot be undone.`, 'Delete User');
    
    if (confirmed) {
        users = users.filter(u => u.id !== id);
        loadUsers();
        showNotification(`User ${user.username} has been deleted.`, 'User Deleted', 'success');
    }
}

// Delete review
async function deleteReview(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    
    const confirmed = await showConfirmation('Delete this review? This action cannot be undone.', 'Delete Review');
    
    if (confirmed) {
        reviews = reviews.filter(r => r.id !== id);
        loadReviews();
        showNotification('Review has been deleted.', 'Review Deleted', 'success');
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Form submissions
document.getElementById('edit-store-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const updatedData = {
        name: document.getElementById('edit-store-name').value,
        email: document.getElementById('edit-store-email').value,
        phone: document.getElementById('edit-store-phone').value,
        location: document.getElementById('edit-store-address').value,
        status: document.getElementById('edit-store-status').value
    };
    
    if (currentEditingStoreType === 'pending') {
        const store = pendingStores.find(s => s.id === currentEditingStoreId);
        Object.assign(store, updatedData);
        loadPendingStores();
    } else {
        const store = allStores.find(s => s.id === currentEditingStoreId);
        Object.assign(store, updatedData);
        loadAllStores();
    }
    
    closeModal('edit-store-modal');
    showNotification('Store information updated successfully!', 'Success', 'success');
});

document.getElementById('edit-user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = users.find(u => u.id === currentEditingUserId);
    user.username = document.getElementById('edit-user-name').value;
    user.email = document.getElementById('edit-user-email').value;
    user.address = document.getElementById('edit-user-address').value;
    
    loadUsers();
    closeModal('edit-user-modal');
    showNotification('User information updated successfully!', 'Success', 'success');
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPendingStores();
    loadUsers();
    loadReviews();
    loadAllStores();
});
