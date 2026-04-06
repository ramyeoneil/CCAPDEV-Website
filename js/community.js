const postsContainer = document.getElementById('posts-container');
const postModal = document.getElementById('community-post-modal');
const postForm = document.getElementById('community-post-form');
const closePostModalBtn = document.getElementById('close-post-modal');
const commentModal = document.getElementById('community-comment-modal');
const commentForm = document.getElementById('community-comment-form');
const closeCommentModalBtn = document.getElementById('close-community-comment-modal');
let allPosts = [];
let activeFilter = 'all';
let expandedCommentsPostId = null;
let commentTargetPostId = null;

function withId(obj) {
    if (!obj) return obj;
    return { ...obj, id: obj.id || obj._id };
}

async function fetchPosts() {
    try {
        const res = await fetch((window.API_BASE || '') + '/api/data');
        if (res.ok) {
            const json = await res.json();
            allPosts = Array.isArray(json.posts) ? json.posts.map(withId) : [];
            return;
        }
    } catch (e) {}
    allPosts = getCommunityPosts();
}

function getCategory(post) {
    const text = `${post.title || ''} ${post.content || ''}`.toLowerCase();
    if (text.includes('build')) return 'builds';
    if (text.includes('?') || text.includes('help') || text.includes('anyone')) return 'questions';
    return 'discussions';
}

function renderPosts() {
    let list = allPosts.slice();
    if (activeFilter !== 'all') list = list.filter(p => getCategory(p) === activeFilter);
    postsContainer.innerHTML = '';
    if (!list.length) {
        postsContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to share!</div>';
        return;
    }
    list.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        const initials = (post.username || 'U').substring(0, 2).toUpperCase();
        const commentsArr = Array.isArray(post.comments) ? post.comments : [];
        const commentsCount = commentsArr.length || (typeof post.comments === 'number' ? post.comments : 0);
        const commentsOpen = expandedCommentsPostId && String(expandedCommentsPostId) === String(post.id);
        const commentsHtml = commentsOpen
            ? `<div class="post-comments" style="margin-top:1rem;border-top:1px solid var(--light-gray);padding-top:1rem;">
                    <div style="font-family:var(--font-display);font-weight:700;letter-spacing:1px;color:var(--primary-green);margin-bottom:0.5rem;">COMMENTS</div>
                    ${(commentsArr.length ? commentsArr : []).map(c => `
                        <div style="padding:0.6rem 0;border-top:1px solid #eee;">
                            <div style="display:flex;gap:0.5rem;align-items:baseline;">
                                <strong>${c.username || ''}</strong>
                                <span style="font-family:var(--font-mono);font-size:0.8rem;color:#666;">• ${c.date || ''}</span>
                            </div>
                            <div style="margin-top:6px;font-family:var(--font-mono);">${c.text || ''}</div>
                        </div>
                    `).join('') || '<div style="font-family:var(--font-mono);color:#666;">No comments yet.</div>'}
               </div>`
            : '';
        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${initials}</div>
                <div class="post-user-info">
                    <div class="post-username">${post.username || 'User'}</div>
                    <div class="post-date">${post.date || ''}</div>
                </div>
            </div>
            <h3 class="post-title">${post.title || 'Community Post'}</h3>
            <div class="post-content">${post.content || ''}</div>
            <div class="post-actions">
                <button class="post-action-btn" data-like="${post.id}">
                    <span class="action-icon">LIKE</span>
                    <span id="like-count-${post.id}">${post.likes || 0}</span>
                </button>
                <button class="post-action-btn" data-open-comments="${post.id}">
                    <span class="action-icon">COMMENTS</span>
                    <span>${commentsCount} Comments</span>
                </button>
                <button class="post-action-btn" data-comment="${post.id}">
                    <span class="action-icon">ADD</span>
                    <span>Comment</span>
                </button>
            </div>
            ${commentsHtml}
        `;
        postsContainer.appendChild(card);
    });
    markLikedPosts();
    wireCommentButtons();
}

function openPostModal() {
    postModal.classList.add('show');
}
function closePostModal() {
    postModal.classList.remove('show');
    postForm.reset();
}

async function createPost() {
    if (!requireLogin('create a post')) return;
    openPostModal();
}

function filterPosts(filter, triggerEl) {
    activeFilter = filter;
    document.querySelectorAll('.community-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');
    renderPosts();
}

function toggleLike(postId, event) {
    if (!requireLogin('like this post')) return;
    const button = event.currentTarget;
    const post = allPosts.find(p => String(p.id) === String(postId));
    if (!post) return;
    const likedPosts = JSON.parse(localStorage.getItem('techamuna_liked_posts') || '[]');
    const isLiked = likedPosts.includes(String(postId));
    if (isLiked) {
        post.likes = Math.max(0, (post.likes || 0) - 1);
        button.classList.remove('liked');
        localStorage.setItem('techamuna_liked_posts', JSON.stringify(likedPosts.filter(x => String(x) !== String(postId))));
    } else {
        post.likes = (post.likes || 0) + 1;
        button.classList.add('liked');
        likedPosts.push(String(postId));
        localStorage.setItem('techamuna_liked_posts', JSON.stringify(likedPosts));
    }
    document.getElementById(`like-count-${postId}`).textContent = post.likes;
}

function markLikedPosts() {
    const likedPosts = JSON.parse(localStorage.getItem('techamuna_liked_posts') || '[]');
    document.querySelectorAll('[data-like]').forEach(btn => {
        const id = btn.getAttribute('data-like');
        if (likedPosts.includes(String(id))) btn.classList.add('liked');
        btn.onclick = function(e) { toggleLike(id, e); };
    });
}

function openCommentModal(postId) {
    if (!requireLogin('comment on this post')) return;
    commentTargetPostId = postId;
    document.getElementById('community-comment-text').value = '';
    commentModal.classList.add('show');
}
function closeCommentModal() {
    commentModal.classList.remove('show');
    commentTargetPostId = null;
}

function wireCommentButtons() {
    document.querySelectorAll('[data-comment]').forEach(btn => {
        btn.addEventListener('click', function() {
            openCommentModal(btn.getAttribute('data-comment'));
        });
    });
    document.querySelectorAll('[data-open-comments]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-open-comments');
            expandedCommentsPostId = (expandedCommentsPostId && String(expandedCommentsPostId) === String(id)) ? null : id;
            renderPosts();
        });
    });
}

document.querySelector('.create-post-btn').addEventListener('click', createPost);
closePostModalBtn.addEventListener('click', closePostModal);
postModal.addEventListener('click', function(e) {
    if (e.target === postModal) closePostModal();
});

if (closeCommentModalBtn) closeCommentModalBtn.addEventListener('click', closeCommentModal);
if (commentModal) commentModal.addEventListener('click', function(e) { if (e.target === commentModal) closeCommentModal(); });

document.querySelectorAll('.community-filter-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        filterPosts(btn.getAttribute('data-arg') || 'all', e.currentTarget);
    });
});

postForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const current = getCurrentUser();
    if (!current) return;
    const title = document.getElementById('community-post-title').value.trim();
    const content = document.getElementById('community-post-content').value.trim();
    if (!content) return;
    const payload = {
        userId: current.id,
        username: current.username || current.storeName || 'User',
        title,
        content
    };
    try {
        const res = await fetch((window.API_BASE || '') + '/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showNotification(data.error || 'Could not create post', 'Error', 'error');
            return;
        }
        closePostModal();
        showNotification('Post published', 'Success', 'success');
        await fetchPosts();
        renderPosts();
    } catch (err) {
        showNotification('Could not reach server', 'Error', 'error');
    }
});

commentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!commentTargetPostId) return;
    const current = getCurrentUser();
    if (!current) return;
    const text = document.getElementById('community-comment-text').value.trim();
    if (!text) return;
    try {
        const res = await fetch((window.API_BASE || '') + '/api/posts/' + encodeURIComponent(commentTargetPostId) + '/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: current.id, username: current.username || current.storeName || 'User', text })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showNotification(data.error || 'Could not post comment', 'Error', 'error');
            return;
        }
        closeCommentModal();
        showNotification('Comment posted', 'Success', 'success');
        expandedCommentsPostId = commentTargetPostId;
        await fetchPosts();
        renderPosts();
    } catch (err) {
        showNotification('Could not reach server', 'Error', 'error');
    }
});

updateHeader();
makeLogoClickable();
fetchPosts().then(renderPosts);

