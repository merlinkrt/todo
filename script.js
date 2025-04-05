document.addEventListener('DOMContentLoaded', function() {
    // To-Do List functionality
    document.getElementById('add-task').addEventListener('click', addTask);
    document.getElementById('new-task').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Check for token immediately on load
    checkForSpotifyToken();

    // Logout functionality
    document.getElementById('spotify-logout').addEventListener('click', logoutFromSpotify);
});

function checkForSpotifyToken() {
    const token = getAccessToken();
    if (token) {
        handleSuccessfulLogin(token);
    } else {
        updateTrackDisplay('Please log in to see your current song');
    }
}

function getAccessToken() {
    const hash = window.location.hash.substr(1);
    if (!hash) return null;
    
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const expiresIn = parseInt(params.get('expires_in')) || 3600;
    
    if (token) {
        // Store token and expiration time
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('spotify_token_expires', Date.now() + expiresIn * 1000);
        
        // Clear the URL hash
        if (window.history.replaceState) {
            window.history.replaceState(null, null, ' ');
        }
        
        return token;
    }
    return null;
}

function handleSuccessfulLogin(token) {
    document.getElementById('spotify-login').style.display = 'none';
    document.getElementById('spotify-logout').style.display = 'block';
    updateTrackDisplay('Connecting to Spotify player...');
    
    // Check if token is expired
    if (isTokenExpired()) {
        updateTrackDisplay('Session expired - please log in again');
        logoutFromSpotify();
        return;
    }

    // Initialize player
    if (window.Spotify) {
        createPlayer(token);
    } else {
        window.onSpotifyWebPlaybackSDKReady = () => createPlayer(token);
        setTimeout(() => {
            if (!window.Spotify) {
                updateTrackDisplay('Error loading Spotify player. Please refresh the page.');
            }
        }, 5000);
    }
}

function isTokenExpired() {
    const expiresAt = localStorage.getItem('spotify_token_expires');
    return !expiresAt || Date.now() > parseInt(expiresAt);
}

function createPlayer(token) {
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
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
        updateTrackDisplay('Player error - please refresh');
    });
    
    player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
        updateTrackDisplay('Login expired - please log in again');
        logoutFromSpotify();
    });

    player.addListener('player_state_changed', state => {
        if (!state) {
            updateTrackDisplay('No song currently playing');
            return;
        }
        
        const { current_track } = state.track_window;
        if (current_track) {
            updateTrackDisplay(
                `${current_track.name} by ${current_track.artists[0].name}`,
                current_track.album.images[0]?.url
            );
        } else {
            updateTrackDisplay('No song currently playing');
        }
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });

    player.connect().then(success => {
        if (!success) {
            updateTrackDisplay('Failed to connect. Please make sure Spotify is open on another device.');
        }
    });
}

function logoutFromSpotify() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_token_expires');
    document.getElementById('spotify-login').style.display = 'block';
    document.getElementById('spotify-logout').style.display = 'none';
    updateTrackDisplay('Logged out from Spotify');
}

function updateTrackDisplay(text, imageUrl) {
    const trackElement = document.getElementById('current-track');
    trackElement.textContent = text;
    trackElement.className = '';
    
    const existingImg = trackElement.querySelector('img');
    if (existingImg) existingImg.remove();
    
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Album art';
        trackElement.appendChild(img);
    }
}

// To-Do List functions
function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim();
    if (taskText === "") return;

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
    input.value = "";
}