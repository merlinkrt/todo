// ======================
// MAIN INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    initTodoList();
    initSpotify();
});

// ======================
// SPOTIFY INTEGRATION
// ======================

// Global SDK ready handler (required by Spotify)
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify Web Playback SDK ready!");
    const token = getValidToken();
    if (token) createPlayer(token);
};

function initSpotify() {
    const token = getValidToken();
    const loginBtn = document.getElementById('spotify-login');
    const logoutBtn = document.getElementById('spotify-logout');
    
    if (!loginBtn || !logoutBtn) {
        console.error("Spotify auth buttons not found");
        return;
    }

    if (token) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        updateTrackDisplay('Connecting to Spotify...');
        
        if (window.Spotify) {
            createPlayer(token);
        } else {
            console.warn("Spotify SDK not loaded yet - waiting for onSpotifyWebPlaybackSDKReady");
        }
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        updateTrackDisplay('Please log in to Spotify');
    }
}

function getValidToken() {
    // Check URL hash first (after redirect)
    const hash = window.location.hash.substring(1);
    if (hash) {
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        if (token) {
            localStorage.setItem('spotify_token', token);
            window.history.replaceState(null, null, ' '); // Clean URL
            return token;
        }
    }
    // Fallback to localStorage
    return localStorage.getItem('spotify_token');
}

function createPlayer(token) {
    console.log("Creating Spotify player...");
    
    // Configure DRM
    if (window.spotifyConfig) {
        window.spotifyConfig.setConfig({
            encryption: { robustness: 'SW_SECURE_CRYPTO' }
        });
    }

    const player = new Spotify.Player({
        name: 'To-Do List Player',
        getOAuthToken: cb => cb(token),
        volume: 0.5
    });

    // Connection timeout (15 seconds)
    const connectionTimeout = setTimeout(() => {
        updateTrackDisplay('⚠️ Connect timeout: Open Spotify on another device');
    }, 15000);

    // Event listeners
    player.addListener('ready', ({ device_id }) => {
        clearTimeout(connectionTimeout);
        console.log("Connected to Spotify as device:", device_id);
        updateTrackDisplay('✅ Connected - play from any Spotify app');
        checkCurrentPlayback(token);
    });

    player.addListener('player_state_changed', state => {
        if (!state) return;
        const track = state.track_window.current_track;
        if (track) {
            updateTrackDisplay(
                `🎵 ${track.name} by ${track.artists[0].name}`,
                track.album.images[0]?.url
            );
        }
    });

    player.addListener('authentication_error', ({ message }) => {
        clearTimeout(connectionTimeout);
        console.error("Auth error:", message);
        if (message.includes('PREMIUM_REQUIRED')) {
            updateTrackDisplay('🔒 Premium account required');
        } else {
            updateTrackDisplay('🔒 Login expired - reconnect');
        }
        logoutFromSpotify();
    });

    player.connect().then(success => {
        if (!success) {
            updateTrackDisplay('❌ Connection failed - refresh page');
        }
    });
}

function checkCurrentPlayback(token) {
    fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data?.is_playing && data?.item) {
            updateTrackDisplay(
                `▶️ ${data.item.name} by ${data.item.artists[0].name}`,
                data.item.album.images[0]?.url
            );
        }
    })
    .catch(console.error);
}

function logoutFromSpotify() {
    localStorage.removeItem('spotify_token');
    document.getElementById('spotify-login').style.display = 'block';
    document.getElementById('spotify-logout').style.display = 'none';
    updateTrackDisplay('Logged out from Spotify');
}

// ======================
// TO-DO LIST FUNCTIONALITY
// ======================

function initTodoList() {
    const addBtn = document.getElementById('add-task');
    const input = document.getElementById('new-task');
    
    if (!addBtn || !input) {
        console.error("To-Do list elements missing");
        return;
    }

    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim();
    if (!taskText) return;

    const li = document.createElement('li');
    li.textContent = taskText;
    
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
    });
    
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        li.remove();
    });

    document.getElementById('task-list').appendChild(li);
    input.value = '';
}

// ======================
// UTILITY FUNCTIONS
// ======================

function updateTrackDisplay(text, imageUrl) {
    const element = document.getElementById('current-track');
    if (!element) return;
    
    element.innerHTML = '';
    const textNode = document.createElement('div');
    textNode.textContent = text;
    element.appendChild(textNode);
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Album art';
        img.style.maxWidth = '100px';
        img.style.marginTop = '10px';
        img.style.borderRadius = '4px';
        element.appendChild(img);
    }
}