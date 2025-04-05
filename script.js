document.addEventListener('DOMContentLoaded', function() {
    // To-Do List functionality
    document.getElementById('add-task').addEventListener('click', addTask);
    document.getElementById('new-task').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Spotify Integration
    checkForSpotifyToken();

    // Logout functionality
    document.getElementById('spotify-logout').addEventListener('click', logoutFromSpotify);
});

// Constants
const SPOTIFY_CONNECTION_TIMEOUT = 10000; // 10 seconds
let connectionTimer;

/* ====================== */
/* SPOTIFY AUTHENTICATION */
/* ====================== */

function checkForSpotifyToken() {
    // Try to get token from URL first (after redirect)
    let token = getAccessTokenFromURL();
    
    // If not in URL, check localStorage
    if (!token) token = localStorage.getItem('spotify_token');
    
    if (token && !isTokenExpired()) {
        handleSuccessfulLogin(token);
    } else {
        if (isTokenExpired()) {
            updateTrackDisplay('Session expired - please log in again');
            logoutFromSpotify();
        } else {
            updateTrackDisplay('Please log in to Spotify');
        }
    }
}

function getAccessTokenFromURL() {
    const hash = window.location.hash.substr(1);
    if (!hash) return null;
    
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const expiresIn = parseInt(params.get('expires_in')) || 3600;

    if (token) {
        // Store token and expiration
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('spotify_token_expires', Date.now() + expiresIn * 1000);
        
        // Clean URL
        if (window.history.replaceState) {
            window.history.replaceState(null, null, window.location.pathname);
        }
        return token;
    }
    return null;
}

function isTokenExpired() {
    const expiresAt = localStorage.getItem('spotify_token_expires');
    return !expiresAt || Date.now() > parseInt(expiresAt);
}

function handleSuccessfulLogin(token) {
    document.getElementById('spotify-login').style.display = 'none';
    document.getElementById('spotify-logout').style.display = 'block';
    updateTrackDisplay('Connecting to Spotify...');

    // Initialize player when SDK is ready
    if (window.Spotify) {
        createPlayer(token);
    } else {
        window.onSpotifyWebPlaybackSDKReady = () => createPlayer(token);
        setTimeout(checkSDKLoad, 5000);
    }
}

function checkSDKLoad() {
    if (!window.Spotify) {
        updateTrackDisplay('Error: Spotify SDK failed to load. Refresh page.');
    }
}

/* ================== */
/* SPOTIFY PLAYER API */
/* ================== */

function createPlayer(token) {
    // Start connection timeout
    connectionTimer = setTimeout(() => {
        updateTrackDisplay('Timeout: Make sure Spotify is open on another device');
    }, SPOTIFY_CONNECTION_TIMEOUT);

    // Configure DRM
    configureDRM();

    const player = new Spotify.Player({
        name: 'To-Do List Player',
        getOAuthToken: cb => {
            if (isTokenExpired()) {
                updateTrackDisplay('Session expired - please log in again');
                logoutFromSpotify();
            } else {
                cb(token);
            }
        },
        volume: 0.5,
        enableMediaSession: true
    });

    // Error Handlers
    player.addListener('initialization_error', ({ message }) => {
        clearTimeout(connectionTimer);
        console.error('Initialization Error:', message);
        updateTrackDisplay('Player error - try refreshing');
    });
    
    player.addListener('authentication_error', ({ message }) => {
        clearTimeout(connectionTimer);
        console.error('Authentication Error:', message);
        handleAuthError(message);
    });

    player.addListener('account_error', ({ message }) => {
        clearTimeout(connectionTimer);
        console.error('Account Error:', message);
        updateTrackDisplay('Premium account required');
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
        updateTrackDisplay('Playback error: ' + message);
    });

    // State Handlers
    player.addListener('player_state_changed', state => {
        clearTimeout(connectionTimer);
        if (!state) {
            updateTrackDisplay('No song playing - start playback from another device');
            return;
        }
        
        const { current_track } = state.track_window;
        if (current_track) {
            updateTrackDisplay(
                `${current_track.name} by ${current_track.artists[0].name}`,
                current_track.album.images[0]?.url
            );
        }
    });

    player.addListener('ready', ({ device_id }) => {
        clearTimeout(connectionTimer);
        console.log('Connected as device:', device_id);
        updateTrackDisplay('Connected! Play a song from any Spotify app');
        checkCurrentPlayback(token);
    });

    player.addListener('not_ready', ({ device_id }) => {
        clearTimeout(connectionTimer);
        console.log('Device ID not ready:', device_id);
        updateTrackDisplay('Paused - play something from another device');
    });

    player.connect().then(success => {
        if (!success) {
            clearTimeout(connectionTimer);
            updateTrackDisplay('Connection failed. Try refreshing.');
        }
    });

    return player;
}

function configureDRM() {
    if (window.spotifyConfig) {
        try {
            window.spotifyConfig.setConfig({
                encryption: {
                    robustness: 'SW_SECURE_CRYPTO'
                }
            });
            console.log('DRM configured successfully');
        } catch (e) {
            console.warn('DRM configuration failed:', e);
        }
    } else {
        console.warn('spotifyConfig not available - DRM not configured');
    }
}

function handleAuthError(message) {
    if (message.includes('scope') || message.includes('403')) {
        updateTrackDisplay('Missing permissions - please log in again');
        document.getElementById('spotify-login').style.display = 'block';
    } else if (message.includes('PREMIUM_REQUIRED')) {
        updateTrackDisplay('Spotify Premium account required');
    } else {
        updateTrackDisplay('Login error - please try again');
    }
    logoutFromSpotify();
}

function checkCurrentPlayback(token) {
    fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Playback check failed');
        return response.json();
    })
    .then(data => {
        if (data?.is_playing && data?.item) {
            updateTrackDisplay(
                `${data.item.name} by ${data.item.artists[0].name}`,
                data.item.album.images[0]?.url
            );
        }
    })
    .catch(error => {
        console.log('Playback check error:', error);
    });
}

/* ================== */
/* UTILITY FUNCTIONS */
/* ================== */

function logoutFromSpotify() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_token_expires');
    document.getElementById('spotify-login').style.display = 'block';
    document.getElementById('spotify-logout').style.display = 'none';
    updateTrackDisplay('Logged out from Spotify');
}

function updateTrackDisplay(text, imageUrl) {
    const trackElement = document.getElementById('current-track');
    trackElement.innerHTML = '';
    
    const textNode = document.createElement('div');
    textNode.textContent = text;
    trackElement.appendChild(textNode);
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Album art';
        img.style.maxWidth = '100px';
        img.style.marginTop = '10px';
        img.style.borderRadius = '4px';
        trackElement.appendChild(img);
    }
}

/* ================== */
/* TO-DO LIST FUNCTIONS */
/* ================== */

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