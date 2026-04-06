window.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    loadReviews();

    // Image upload listener
    const imageUpload = document.getElementById("imageUpload");
    imageUpload.addEventListener("change", handleImageUpload);

    // Save button listener
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", saveProfile);
    // Header home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    // Edit profile button (moved from inline onclick)
    const editBtn = document.getElementById('editBtn');
    if (editBtn) editBtn.addEventListener('click', toggleEdit);
});

// Load profile from current user record
function loadProfile() {
    if (!requireLogin('view profile')) return;

    const user = getCurrentUser();
    if (!user) return;

    const name = user.username || user.storeName || 'John Doe';
    const bio = user.bio || 'PC enthusiast and reviewer.';
    const image = user.profileImage || 'https://via.placeholder.com/150';
    const identity = user.builderIdentity || 'Novice';

    document.getElementById('displayName').innerText = name;
    document.getElementById('displayBio').innerText = bio;
    document.getElementById('profileImage').src = image;
    const identityEl = document.getElementById('displayIdentity');
    if (identityEl) identityEl.innerText = identity;

    document.getElementById('editName').value = name;
    document.getElementById('editBio').value = bio;
}

// Toggle edit form visibility
function toggleEdit() {
    const form = document.getElementById("editForm");
    form.style.display = form.style.display === "block" ? "none" : "block";
}

// Save profile to localStorage
function saveProfile() {
    if (!requireLogin('edit your profile')) return;

    const name = document.getElementById('editName').value;
    const bio = document.getElementById('editBio').value;
    const user = getCurrentUser();
    if (!user) return;

    // Update user object - do NOT allow manual identity changes
    user.username = name;
    user.bio = bio;

    // Persist to users list (local fallback)
    const users = (typeof getAllUsers === 'function') ? getAllUsers() : [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        users[idx] = user;
        if (typeof saveUsers === 'function') saveUsers(users);
        if (typeof setCurrentUser === 'function') setCurrentUser(user);
    }

    // Try to persist to backend API if available (non-blocking)
    (async function() {
        try {
            if (window.API_BASE) {
                await fetch((window.API_BASE || '') + '/api/users/' + encodeURIComponent(user.id), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username, bio: user.bio })
                });
            }
        } catch (e) {
            // ignore - localStorage remains source of truth when API not available
            console.warn('Could not persist profile to API', e);
        }
    })();

    showNotification('Profile updated!', 'Saved', 'success');
    loadProfile();
    toggleEdit();
    updateHeader();
}

// Handle image upload
function handleImageUpload(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const dataUrl = reader.result;
        document.getElementById('profileImage').src = dataUrl;

        // Save to current user and users array
        const user = getCurrentUser();
        if (user) {
            user.profileImage = dataUrl;
            const users = (typeof getAllUsers === 'function') ? getAllUsers() : [];
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx] = user;
                if (typeof saveUsers === 'function') saveUsers(users);
                if (typeof setCurrentUser === 'function') setCurrentUser(user);
                updateHeader();
            }

            // Try to push change to API (non-blocking)
            (async function() {
                try {
                    if (window.API_BASE) {
                        await fetch((window.API_BASE || '') + '/api/users/' + encodeURIComponent(user.id), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profileImage: dataUrl })
                        });
                    }
                } catch (e) {
                    console.warn('Could not upload profile image to API', e);
                }
            })();
        } else {
            localStorage.setItem('profileImage', dataUrl);
        }
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Load review history for logged-in user (API-first)
async function loadReviews() {
    const reviewGrid = document.getElementById("reviewGrid");
    reviewGrid.innerHTML = "";
    if (!requireLogin('view your review history')) return;
    const user = getCurrentUser();
    if (!user) return;

    let reviews = [];
    try {
        const res = await fetch((window.API_BASE || '') + '/api/data');
        if (res.ok) {
            const json = await res.json();
            reviews = Array.isArray(json.reviews) ? json.reviews.map(r => ({ ...r, id: r._id || r.id })) : [];
        }
    } catch (e) {}
    if (!reviews.length && typeof getAllReviews === 'function') reviews = getAllReviews();

    const my = reviews.filter(r => String(r.userId) === String(user.id));
    if (!my.length) {
        reviewGrid.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No reviews yet.</p>';
        return;
    }

    my.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    my.forEach(review => {
        const card = document.createElement("div");
        card.classList.add("review-card");
        const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
        card.innerHTML = `
            <h4>${review.storeName || 'Store'}</h4>
            <p style="font-weight:600;margin:0.5rem 0;">${review.headline || ''}</p>
            <p>${review.text || ''}</p>
            <div class="rating">${stars}</div>
            <div style="font-family:var(--font-mono);font-size:0.8rem;color:#666;margin-top:0.5rem;">${review.date || ''}</div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `review-detail.html?id=${review.id}`;
        });
        reviewGrid.appendChild(card);
    });
}