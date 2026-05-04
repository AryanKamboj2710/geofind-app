// Global State
let map;
let markers = [];
let items = [];
let currentUser = null;
let token = localStorage.getItem('token');
let tempMarker = null;
let currentChatInterval = null;
let activeChatUserId = null;
let activeChatItemId = null;
let lastMessageCount = 0;
let currentFilter = 'all';
let searchQuery = '';
let notifBadge, toastContainer;

// DOM Elements
let authSection, feedContainer, reportBtn, inboxBtn;
let authModal, reportModal, chatModal, inboxModal;
let authForm, authTitle, authSubmitBtn, nameGroup, authToggleText;
let chatMessages, chatForm, chatInput, chatTitle;
let inboxContent;

let isLoginMode = true;

// Initialize Map
function initMap() {
    map = L.map('map', {
        minZoom: 2,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
    }).setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        noWrap: true,
        bounds: [[-90, -180], [90, 180]],
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
        });
    }

    map.on('click', function (e) {
        if (!currentUser) return alert("Please log in to report an item.");
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = L.marker(e.latlng).addTo(map);
        document.getElementById('itemLat').value = e.latlng.lat.toFixed(6);
        document.getElementById('itemLng').value = e.latlng.lng.toFixed(6);
        reportModal.classList.add('active');
    });

    loadItems();
}

async function loadItems() {
    try {
        const response = await fetch('/api/items');
        items = await response.json();
        renderFeed();
        renderMarkers();
    } catch (error) {
        console.error("Failed to load items", error);
    }
}

function renderFeed() {
    // Sort and Filter items
    const filteredItems = items.filter(item => {
        const matchesFilter = currentFilter === 'all' || item.status === currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    const sortedItems = [...filteredItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (sortedItems.length === 0) {
        feedContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No items match this filter.</p>';
        return;
    }

    feedContainer.innerHTML = sortedItems.map(item => `
        <div class="item-card" onclick="focusOnMap(${item.latitude}, ${item.longitude})">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="item-status status-${item.status}">${item.status.toUpperCase()}</span>
                ${currentUser && currentUser.id === item.owner_id ?
            `<button class="delete-btn" onclick="event.stopPropagation(); handleDelete(${item.id})">×</button>` : ''}
            </div>
            <h3 style="margin: 0.5rem 0;">${item.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${item.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="date-chip">${new Date(item.created_at).toLocaleDateString()}</span>
                ${currentUser && currentUser.id !== item.owner_id ? 
                    `<button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="event.stopPropagation(); openChat(${item.owner_id}, ${item.id}, '${item.title.replace(/'/g, "\\'")}')">Message</button>` : ''}
            </div>
        </div>
    `).join('');
}

function renderMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    const filteredItems = items.filter(item => {
        const matchesFilter = currentFilter === 'all' || item.status === currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    filteredItems.forEach(item => {
        const color = item.status === 'lost' ? '#FF0055' : '#00FF44';
        const icon = L.divIcon({
            className: "custom-pin",
            html: `<span style="background-color: ${color}; width: 1.2rem; height: 1.2rem; display: block; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${color}, 0 0 5px white;"></span>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const popupContent = `
            <div style="padding: 5px; min-width: 150px;">
                <h4 style="margin: 0 0 5px 0;">${item.title}</h4>
                ${currentUser && currentUser.id !== item.owner_id ? 
                    `<button class="btn-primary" style="width: 100%; padding: 4px; font-size: 0.8rem;" onclick="openChat(${item.owner_id}, ${item.id}, '${item.title.replace(/'/g, "\\'")}')">Message Owner</button>` : 
                    `<small style="color: var(--primary-color);">Your Item</small>`}
            </div>
        `;

        const marker = L.marker([item.latitude, item.longitude], { icon }).bindPopup(popupContent).addTo(map);
        markers.push(marker);
    });
}

function focusOnMap(lat, lng) {
    map.setView([lat, lng], 16, { animate: true });
}

// Auth Logic
async function checkAuth() {
    if (!token) return updateAuthUI(false);
    try {
        const response = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI(true);
            startNotificationPolling();
        } else handleLogout();
    } catch (e) { handleLogout(); }
}

function updateAuthUI(isLoggedIn) {
    const sidebarFooter = document.getElementById('sidebarFooter');
    if (isLoggedIn) {
        authSection.innerHTML = `
            <span class="desktop-only">Welcome back!</span>
            <button onclick="handleLogout()" class="btn-secondary" style="margin-left: 1rem; padding: 0.4rem 0.8rem; font-size: 0.8rem;">Log Out</button>
        `;
        reportBtn.style.display = 'block';
        inboxBtn.style.display = 'block';
        
        // Sidebar Profile
        sidebarFooter.style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = currentUser.name || currentUser.email;
        document.getElementById('userAvatar').textContent = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
    } else {
        authSection.innerHTML = `<button onclick="openAuthModal(true)">Log In</button><button class="btn-primary" onclick="openAuthModal(false)" style="margin-left: 10px;">Sign Up</button>`;
        reportBtn.style.display = 'none';
        inboxBtn.style.display = 'none';
        sidebarFooter.style.display = 'none';
    }
    renderFeed();
    renderMarkers();
}

function handleLogout() {
    token = null; currentUser = null;
    localStorage.removeItem('token');
    updateAuthUI(false);
}

function openAuthModal(login = true) {
    isLoginMode = login;
    authTitle.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    authSubmitBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    nameGroup.style.display = isLoginMode ? 'none' : 'block';
    authToggleText.innerHTML = isLoginMode ? `Don't have an account? <a href="#" onclick="openAuthModal(false)">Sign Up</a>` : `Already have an account? <a href="#" onclick="openAuthModal(true)">Log In</a>`;
    authModal.classList.add('active');
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    try {
        if (isLoginMode) {
            const formData = new URLSearchParams();
            formData.append('username', email); formData.append('password', password);
            const res = await fetch('/api/login', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Invalid credentials");
            const data = await res.json();
            token = data.access_token;
        } else {
            const name = document.getElementById('regName').value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            if (!res.ok) throw new Error("Registration failed");
            const formData = new URLSearchParams();
            formData.append('username', email); formData.append('password', password);
            const loginRes = await fetch('/api/login', { method: 'POST', body: formData });
            const data = await loginRes.json();
            token = data.access_token;
        }
        localStorage.setItem('token', token);
        authModal.classList.remove('active');
        checkAuth();
    } catch (err) { alert(err.message); }
}

async function handleReportSubmit(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('itemTitle').value,
        description: document.getElementById('itemDescription').value,
        status: document.getElementById('itemStatus').value,
        latitude: parseFloat(document.getElementById('itemLat').value),
        longitude: parseFloat(document.getElementById('itemLng').value),
        contact_number: document.getElementById('itemContact').value
    };

    const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        reportModal.classList.remove('active');
        document.getElementById('reportForm').reset();
        loadItems();
    }
}

async function handleDelete(itemId) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${itemId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadItems();
}

// Chat Logic
async function openChat(otherUserId, itemId, itemTitle) {
    inboxModal.classList.remove('active'); // Automatically hide inbox when opening a chat
    activeChatUserId = otherUserId;
    activeChatItemId = itemId;
    chatTitle.textContent = `Chat: ${itemTitle}`;
    chatModal.classList.add('active');
    fetchMessages();
    if (currentChatInterval) clearInterval(currentChatInterval);
    currentChatInterval = setInterval(fetchMessages, 3000);
}

async function fetchMessages() {
    if (!activeChatUserId || !activeChatItemId) return;
    try {
        const res = await fetch(`/api/messages/chat/${activeChatUserId}/${activeChatItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const msgs = await res.json();
        chatMessages.innerHTML = msgs.map(m => `
            <div class="msg ${m.sender_id === currentUser.id ? 'msg-sent' : 'msg-received'}">
                ${m.content}
                <div style="font-size: 0.6rem; opacity: 0.7; margin-top: 2px;">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (e) { console.error("Chat fetch failed", e); }
}

async function handleChatSubmit(e) {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (!content) return;
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content, receiver_id: activeChatUserId, item_id: activeChatItemId })
        });
        if (res.ok) {
            chatInput.value = '';
            fetchMessages();
        }
    } catch (e) { console.error("Send failed", e); }
}

async function openInbox() {
    inboxModal.classList.add('active');
    notifBadge.classList.remove('active');
    try {
        const res = await fetch('/api/messages/inbox', { headers: { 'Authorization': `Bearer ${token}` } });
        const msgs = await res.json();
        
        // Group by conversation
        const convos = {};
        msgs.forEach(m => {
            const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
            const key = `${otherId}-${m.item_id}`;
            if (!convos[key]) convos[key] = m;
        });

        inboxContent.innerHTML = Object.values(convos).map(m => {
            const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
            const item = items.find(i => i.id === m.item_id);
            const itemTitle = item ? item.title : `Item #${m.item_id}`;
            
            return `
                <div class="inbox-item" onclick="openChat(${otherId}, ${m.item_id}, '${itemTitle.replace(/'/g, "\\'")}')">
                    <div style="font-weight: 600; margin-bottom: 4px;">${itemTitle}</div>
                    <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.content}</div>
                    <small style="opacity: 0.5;">${new Date(m.timestamp).toLocaleString()}</small>
                </div>
            `;
        }).join('');
    } catch (e) { console.error("Inbox failed", e); }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--primary-color);">💬</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

async function startNotificationPolling() {
    // Background check for new messages every 10 seconds
    setInterval(async () => {
        if (!token || !currentUser) return;
        try {
            const res = await fetch('/api/messages/inbox', { headers: { 'Authorization': `Bearer ${token}` } });
            const msgs = await res.json();
            
            if (msgs.length > lastMessageCount) {
                // We have new messages!
                if (lastMessageCount > 0) { // Don't notify on first load
                    showToast("You have a new message!");
                    notifBadge.classList.add('active');
                    // Refresh chat if open
                    if (chatModal.classList.contains('active')) fetchMessages();
                }
                lastMessageCount = msgs.length;
            }
        } catch (e) { console.error("Polling failed", e); }
    }, 10000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    authSection = document.getElementById('authSection');
    feedContainer = document.getElementById('feedContainer');
    reportBtn = document.getElementById('reportBtn');
    inboxBtn = document.getElementById('inboxBtn');
    authModal = document.getElementById('authModal');
    reportModal = document.getElementById('reportModal');
    chatModal = document.getElementById('chatModal');
    inboxModal = document.getElementById('inboxModal');
    authForm = document.getElementById('authForm');
    authTitle = document.getElementById('authTitle');
    authSubmitBtn = document.getElementById('authSubmitBtn');
    nameGroup = document.getElementById('nameGroup');
    authToggleText = document.getElementById('authToggleText');
    chatMessages = document.getElementById('chatMessages');
    chatForm = document.getElementById('chatForm');
    chatInput = document.getElementById('chatInput');
    chatTitle = document.getElementById('chatTitle');
    inboxContent = document.getElementById('inboxContent');
    notifBadge = document.getElementById('notifBadge');
    toastContainer = document.getElementById('toastContainer');

    document.getElementById('closeAuth').onclick = () => authModal.classList.remove('active');
    document.getElementById('closeReport').onclick = () => reportModal.classList.remove('active');
    document.getElementById('closeChat').onclick = () => {
        chatModal.classList.remove('active');
        if (currentChatInterval) clearInterval(currentChatInterval);
    };
    document.getElementById('closeInbox').onclick = () => inboxModal.classList.remove('active');
    
    inboxBtn.onclick = () => {
        openInbox();
        notifBadge.classList.remove('active');
    };
    authForm.onsubmit = handleAuthSubmit;
    document.getElementById('reportForm').onsubmit = handleReportSubmit;
    chatForm.onsubmit = handleChatSubmit;

    // Filter Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderFeed();
            renderMarkers();
        });
    });

    // Search Listener
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderFeed();
        renderMarkers();
    });

    initMap();
    checkAuth();
});
