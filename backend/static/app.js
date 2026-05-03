// Global State
let map;
let markers = [];
let items = [];
let currentUser = null;
let token = localStorage.getItem('token');
let tempMarker = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const feedContainer = document.getElementById('feedContainer');
const reportBtn = document.getElementById('reportBtn');

// Modals
const authModal = document.getElementById('authModal');
const reportModal = document.getElementById('reportModal');
const themeToggle = document.getElementById('themeToggle');

// Auth Form Elements
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
const nameGroup = document.getElementById('nameGroup');
const authToggleText = document.getElementById('authToggleText');

let isLoginMode = true;

// Initialize Map
function initMap() {
    // Default to a central location with a minimum zoom to fill the container
    map = L.map('map', {
        minZoom: 2,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
    }).setView([51.505, -0.09], 13);
 
    // Satellite view tiles with noWrap to prevent repeating
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        noWrap: true,
        bounds: [[-90, -180], [90, 180]],
        attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
        });
    }

    // Map click event for reporting
    map.on('click', function(e) {
        if (!currentUser) return; // Only logged in users can report
        
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        
        tempMarker = L.marker(e.latlng).addTo(map);
        
        // Open report modal and pre-fill coordinates
        document.getElementById('itemLat').value = e.latlng.lat.toFixed(6);
        document.getElementById('itemLng').value = e.latlng.lng.toFixed(6);
        reportModal.classList.add('active');
    });

    loadItems();
}

// Fetch and display items
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        items = await response.json();
        renderFeed();
        renderMarkers();
    } catch (error) {
        console.error("Failed to load items", error);
        feedContainer.innerHTML = '<p style="color: red;">Failed to load items.</p>';
    }
}

// Render sidebar feed
function renderFeed() {
    if (items.length === 0) {
        feedContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No items reported yet.</p>';
        return;
    }

    // Sort by newest first
    const sortedItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    feedContainer.innerHTML = sortedItems.map(item => `
        <div class="item-card" onclick="focusOnMap(${item.latitude}, ${item.longitude})">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="item-status status-${item.status}">${item.status.toUpperCase()}</span>
                ${currentUser && currentUser.id === item.owner_id ? 
                    `<button class="delete-btn" onclick="event.stopPropagation(); handleDelete(${item.id})">×</button>` : ''}
            </div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${item.title}</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">${item.description}</p>
            <div style="font-size: 0.875rem; margin-bottom: 0.5rem; color: var(--primary-color);">
                <strong>Contact:</strong> ${item.contact_number}
            </div>
            <small style="color: var(--text-muted); opacity: 0.7;">${new Date(item.created_at).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Render map markers
function renderMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    items.forEach(item => {
        const color = item.status === 'lost' ? '#ef4444' : '#10b981';
        
        const markerHtmlStyles = `
            background-color: ${color};
            width: 1.5rem;
            height: 1.5rem;
            display: block;
            left: -0.75rem;
            top: -0.75rem;
            position: relative;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 10px ${color};
        `;
        
        const icon = L.divIcon({
            className: "custom-pin",
            iconAnchor: [0, 0],
            labelAnchor: [-6, 0],
            popupAnchor: [0, -15],
            html: `<span style="${markerHtmlStyles}" />`
        });

        const popupContent = `
            <div style="padding: 5px; min-width: 150px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <span class="item-status status-${item.status}">${item.status.toUpperCase()}</span>
                    ${currentUser && currentUser.id === item.owner_id ? 
                        `<button class="delete-btn" onclick="handleDelete(${item.id})" title="Delete item">×</button>` : ''}
                </div>
                <h4 style="margin: 5px 0;">${item.title}</h4>
                <p style="margin: 0; font-size: 0.85rem;">${item.description}</p>
                <div style="margin-top: 8px; font-size: 0.85rem; color: var(--primary-color);">
                    <strong>Call:</strong> ${item.contact_number}
                </div>
            </div>
        `;

        const marker = L.marker([item.latitude, item.longitude], { icon })
            .bindPopup(popupContent)
            .addTo(map);
            
        markers.push(marker);
    });
}

function focusOnMap(lat, lng) {
    map.setView([lat, lng], 16, { animate: true });
}

// Auth State Management
async function checkAuth() {
    if (!token) return updateAuthUI(false);

    try {
        const response = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI(true);
        } else {
            handleLogout();
        }
    } catch (e) {
        handleLogout();
    }
}

function updateAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        authSection.innerHTML = `
            <span style="margin-right: 1rem;">Hi, ${currentUser.name || currentUser.email}</span>
            <button onclick="handleLogout()" style="border-color: var(--lost-color); color: var(--lost-color);">Log Out</button>
        `;
        reportBtn.style.display = 'block';
    } else {
        authSection.innerHTML = `
            <button id="loginBtn">Log In</button>
            <button id="signupBtn" style="background: var(--primary-color); border-color: var(--primary-color);">Sign Up</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => openAuthModal(true));
        document.getElementById('signupBtn').addEventListener('click', () => openAuthModal(false));
        reportBtn.style.display = 'none';
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateAuthUI(false);
}

// Modal Event Listeners
function openAuthModal(login = true) {
    isLoginMode = login;
    authTitle.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    authSubmitBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    nameGroup.style.display = isLoginMode ? 'none' : 'block';
    if(!isLoginMode) document.getElementById('name').setAttribute('required', 'true');
    else document.getElementById('name').removeAttribute('required');
    
    authToggleText.innerHTML = isLoginMode 
        ? 'Don\'t have an account? <span id="toggleAuthMode">Sign Up</span>'
        : 'Already have an account? <span id="toggleAuthMode">Log In</span>';
        
    document.getElementById('toggleAuthMode').addEventListener('click', () => openAuthModal(!isLoginMode));
    authModal.classList.add('active');
}

document.getElementById('closeAuthModal').addEventListener('click', () => authModal.classList.remove('active'));
document.getElementById('closeReportModal').addEventListener('click', () => {
    reportModal.classList.remove('active');
    if (tempMarker) map.removeLayer(tempMarker);
});

reportBtn.addEventListener('click', () => {
    alert("Click anywhere on the map to drop a pin and report an item.");
});

// Form Submissions
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        if (isLoginMode) {
            // Login uses OAuth2PasswordRequestForm which requires URL encoded form data
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            
            if (!res.ok) throw new Error("Login failed");
            const data = await res.json();
            token = data.access_token;
            localStorage.setItem('token', token);
        } else {
            // Registration uses JSON
            const name = document.getElementById('name').value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            
            if (!res.ok) throw new Error("Registration failed");
            
            // Auto login after register
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await loginRes.json();
            token = data.access_token;
            localStorage.setItem('token', token);
        }
        
        authModal.classList.remove('active');
        authForm.reset();
        await checkAuth();
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) return alert("Please log in first");

    const payload = {
        title: document.getElementById('itemTitle').value,
        description: document.getElementById('itemDescription').value,
        status: document.getElementById('itemStatus').value,
        latitude: parseFloat(document.getElementById('itemLat').value),
        longitude: parseFloat(document.getElementById('itemLng').value),
        contact_number: document.getElementById('itemContact').value
    };

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to report item");
        
        reportModal.classList.remove('active');
        document.getElementById('reportForm').reset();
        tempMarker = null; // Keep the real marker that gets fetched
        await loadItems();
    } catch (err) {
        alert(err.message);
    }
});

// Theme Management
function setTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    // Save to localStorage
    localStorage.setItem('themePreference', isLight ? 'light' : 'dark');
    
    // Update toggle state
    if (themeToggle) themeToggle.checked = isLight;
}

async function handleDelete(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
        const res = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to delete item");
        
        await loadItems();
    } catch (err) {
        alert(err.message);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first to avoid flash
    const savedTheme = localStorage.getItem('themePreference') || 'dark';
    setTheme(savedTheme === 'light');

    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            setTheme(e.target.checked);
        });
    }

    initMap();
    checkAuth();
});
