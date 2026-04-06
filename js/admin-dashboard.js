// Data containers — populated from backend API
let pendingStores = [];
let users = [];
let reviews = [];
let allStores = [];

function withId(obj) {
    if (!obj) return obj;
    return { ...obj, id: obj.id || obj._id };
}

// Fetch admin data from backend API (/api/data) and populate in-memory arrays
async function fetchAdminData() {
    try {
        const resp = await fetch((window.API_BASE || '') + '/api/data');
        if (!resp.ok) return;
        const json = await resp.json();
        const stores = Array.isArray(json.stores) ? json.stores.map(withId) : [];
        pendingStores = Array.isArray(json.pendingStores)
            ? json.pendingStores.map(withId)
            : stores.filter(s => s.status === 'pending');
        users = Array.isArray(json.users) ? json.users.map(withId) : [];
        reviews = Array.isArray(json.reviews) ? json.reviews.map(withId) : [];
        allStores = stores.filter(s => s.status === 'approved' || !s.status);
    } catch (e) {
        console.warn('Failed to fetch admin data from API', e);
    }
}

// NEW: Update Dashboard Statistics
function updateOverviewStats() {
    document.getElementById('stat-users').innerText = users.length;
    document.getElementById('stat-stores').innerText = allStores.length;
    document.getElementById('stat-pending').innerText = pendingStores.length;
    document.getElementById('stat-reviews').innerText = reviews.length;
}

// NEW: Basic Table Filtering
function filterTable(tableId, query) {
    const tableBody = document.getElementById(tableId);
    const rows = tableBody.getElementsByTagName('tr');
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let rowContainsQuery = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Ignore the last column (Actions)
            if (cells[j].textContent.toLowerCase().includes(lowerQuery)) {
                rowContainsQuery = true;
                break;
            }
        }
        
        rows[i].style.display = rowContainsQuery ? "" : "none";
    }
}

// Tab switching function
function switchTab(tabName, el) {
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
    if (el) el.classList.add('active');
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
            <td>${store.dateApplied || 'N/A'}</td>
            <td><span class="status-badge status-${store.status}">${store.status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn btn-approve" onclick="approveStore('${store.id}')">APPROVE</button>
                <button class="action-btn btn-reject" onclick="rejectStore('${store.id}')">REJECT</button>
                <button class="action-btn btn-edit" onclick="editStore('${store.id}', 'pending')">EDIT</button>
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
            <td>${user.address || 'N/A'}</td>
            <td>${user.reviewsPosted || 0}</td>
            <td>${user.dateJoined || 'N/A'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editUser('${user.id}')">EDIT</button>
                <button class="action-btn btn-delete" onclick="deleteUser('${user.id}')">DELETE</button>
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
        const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
        row.innerHTML = `
            <td>${review.username || review.user || 'N/A'}</td>
            <td>${review.storeName || review.store || 'N/A'}</td>
            <td style="color: var(--primary-green, #28a745);">${stars}</td>
            <td>${review.headline || 'N/A'}</td>
            <td>${review.datePosted || review.date || 'N/A'}</td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteReview('${review.id}')">DELETE</button>
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
            <td>${store.rating || 0} ★</td>
            <td>${store.reviewCount || 0}</td>
            <td><span class="status-badge status-${store.status || 'approved'}">${(store.status || 'APPROVED').toUpperCase()}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editStore('${store.id}', 'all')">EDIT</button>
                <button class="action-btn btn-delete" onclick="deleteStore('${store.id}')">DELETE</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Approve store
async function approveStore(id) {
    const store = pendingStores.find(s => String(s.id) === String(id));
    if (!store) return;
    
    if (confirm(`Approve ${store.name}?`)) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/stores/' + encodeURIComponent(store.id) + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error || 'Failed to approve store.');
                return;
            }
            await fetchAdminData();
            loadPendingStores();
            loadAllStores();
            updateOverviewStats();
            alert(`${store.name} has been approved!`);
        } catch (e) {
            console.error(e);
            alert('Could not reach server. Is the API running?');
        }
    }
}

// Reject store
async function rejectStore(id) {
    const store = pendingStores.find(s => String(s.id) === String(id));
    if (!store) return;
    
    if (confirm(`Reject ${store.name}?`)) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/stores/' + encodeURIComponent(store.id) + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data.error || 'Failed to reject store.');
            await fetchAdminData();
            loadPendingStores();
            loadAllStores();
            updateOverviewStats();
            alert(`${store.name} has been rejected.`);
        } catch (e) {
            console.error(e);
            alert('Could not reach server. Is the API running?');
        }
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
        store = pendingStores.find(s => String(s.id) === String(id));
    } else {
        store = allStores.find(s => String(s.id) === String(id));
    }
    
    if (store) {
        document.getElementById('edit-store-name').value = store.name;
        document.getElementById('edit-store-email').value = store.email;
        document.getElementById('edit-store-phone').value = store.phone || '';
        document.getElementById('edit-store-address').value = store.location;
        document.getElementById('edit-store-status').value = store.status || 'approved';
        
        openModal('edit-store-modal');
    }
}

// Delete store
async function deleteStore(id) {
    const store = allStores.find(s => String(s.id) === String(id));
    if (!store) return;
    
    if (confirm(`Delete ${store.name}? This action cannot be undone.`)) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/stores/' + encodeURIComponent(id), { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data.error || 'Failed to delete store.');
            await fetchAdminData();
            loadPendingStores();
            loadAllStores();
            updateOverviewStats();
            alert(`${store.name} has been deleted.`);
        } catch (e) {
            console.error(e);
            alert('Could not reach server. Is the API running?');
        }
    }
}

// Edit user
let currentEditingUserId = null;

function editUser(id) {
    currentEditingUserId = id;
    const user = users.find(u => String(u.id) === String(id));
    
    if (user) {
        document.getElementById('edit-user-name').value = user.username;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-address').value = user.address || '';
        
        openModal('edit-user-modal');
    }
}

// Delete user
async function deleteUser(id) {
    const user = users.find(u => String(u.id) === String(id));
    if (!user) return;
    
    if (confirm(`Delete user ${user.username}? This action cannot be undone.`)) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/users/' + encodeURIComponent(id), { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data.error || 'Failed to delete user.');
            await fetchAdminData();
            loadUsers();
            updateOverviewStats();
            alert(`User ${user.username} has been deleted.`);
        } catch (e) {
            console.error(e);
            alert('Could not reach server. Is the API running?');
        }
    }
}

// Delete review
async function deleteReview(id) {
    const review = reviews.find(r => String(r.id) === String(id));
    if (!review) return;
    
    if (confirm('Delete this review? This action cannot be undone.')) {
        try {
            const res = await fetch((window.API_BASE || '') + '/api/reviews/' + encodeURIComponent(id), { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data.error || 'Failed to delete review.');
            await fetchAdminData();
            loadReviews();
            updateOverviewStats();
            alert('Review has been deleted.');
        } catch (e) {
            console.error(e);
            alert('Could not reach server. Is the API running?');
        }
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
document.getElementById('edit-store-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const updatedData = {
        name: document.getElementById('edit-store-name').value,
        email: document.getElementById('edit-store-email').value,
        phone: document.getElementById('edit-store-phone').value,
        location: document.getElementById('edit-store-address').value,
        status: document.getElementById('edit-store-status').value
    };
    
    try {
        const res = await fetch((window.API_BASE || '') + '/api/stores/' + encodeURIComponent(currentEditingStoreId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return alert(data.error || 'Failed to update store.');
        await fetchAdminData();
        loadPendingStores();
        loadAllStores();
        updateOverviewStats();
        closeModal('edit-store-modal');
        alert('Store information updated successfully!');
    } catch (err) {
        console.error(err);
        alert('Could not reach server. Is the API running?');
    }
});

document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const res = await fetch((window.API_BASE || '') + '/api/users/' + encodeURIComponent(currentEditingUserId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('edit-user-name').value,
                email: document.getElementById('edit-user-email').value,
                address: document.getElementById('edit-user-address').value
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return alert(data.error || 'Failed to update user.');
        await fetchAdminData();
        loadUsers();
        updateOverviewStats();
        closeModal('edit-user-modal');
        alert('User information updated successfully!');
    } catch (err) {
        console.error(err);
        alert('Could not reach server. Is the API running?');
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await fetchAdminData();
    updateOverviewStats(); // Trigger the stats calculation
    loadPendingStores();
    loadUsers();
    loadReviews();
    loadAllStores();
});