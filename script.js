document.addEventListener('DOMContentLoaded', function() {
    // To-Do List functionality
    document.getElementById('add-task').addEventListener('click', addTask);
    document.getElementById('new-task').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Spotify Integration
    const token = getAccessToken();
    if (token) {
        document.getElementById('spotify-login').style.display = 'none';
        document.getElementById('spotify-logout').style.display = 'block';
        initializeSpotifyPlayer(token);
    } else {
        updateTrackDisplay('Please log in to see your current song');
    }

    // Logout functionality
    document.getElementById('spotify-logout').addEventListener('click', logoutFromSpotify);
});

function getAccessToken() {
    const hash = window.location.hash.substr(1);
    if (!hash) return null;
    
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    
    // Clear the URL hash after getting the token
    if (token && window.history.replaceState) {
        window.history.replaceState(null, null, ' ');
    }
    
    return token;
}

function initializeSpotifyPlayer(token) {
    updateTrackDisplay('Connecting to Spotify...');
    
    // Check if Spotify SDK is already loaded
    if (window.Spotify) {
        createPlayer(token);
    } else {
        // Fallback if SDK doesn't auto-initialize
        window.onSpotifyWebPlaybackSDKReady = () => createPlayer(token);
        
        // Timeout in case SDK fails to load
        setTimeout(() => {
            if (!window.Spotify) {
                console.error('Spotify SDK failed to load');
                updateTrackDisplay('Error loading Spotify player. Please refresh the page.');
            }
        }, 5000);
    }
}

function createPlayer(token) {
    const player = new Spotify.Player({
        name: 'To-Do List Player',
        getOAuthToken: cb => cb(token),
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
        updateTrackDisplay('Player initialization failed');
    });
    
    player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
        updateTrackDisplay('Login expired - please log in again');
        showLoginButton();
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
        updateTrackDisplay('Connected to Spotify - play something!');
    });

    player.connect().then(success => {
        if (!success) {
            updateTrackDisplay('Failed to connect to Spotify');
        }
    });
}

function updateTrackDisplay(text, imageUrl) {
    const trackElement = document.getElementById('current-track');
    trackElement.textContent = text;
    trackElement.className = '';
    
    // Clear any existing image
    const existingImg = trackElement.querySelector('img');
    if (existingImg) existingImg.remove();
    
    // Add new image if provided
    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Album art';
        trackElement.appendChild(img);
    }
}

function showLoginButton() {
    document.getElementById('spotify-login').style.display = 'block';
    document.getElementById('spotify-logout').style.display = 'none';
}

function logoutFromSpotify() {
    showLoginButton();
    updateTrackDisplay('Logged out from Spotify');
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