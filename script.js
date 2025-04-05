// Funktion zum Hinzufügen einer Aufgabe
function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim(); // Entferne Leerzeichen
    if (taskText === "") return; // Keine leere Aufgabe hinzufügen

    const li = document.createElement('li');
    li.textContent = taskText;

    // Toggle 'completed' class on click
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    // Right-click to delete the task
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        li.remove();
    });

    // Append the new task to the list
    document.getElementById('task-list').appendChild(li);

    // Clear the input field after adding the task
    input.value = "";
}

// Spotify Web Playback SDK initialisieren
window.onSpotifyWebPlaybackSDKReady = () => {
    const token = getAccessToken(); // Erhalte das Token aus der URL
    if (!token) {
        console.log('Kein Zugriffstoken gefunden');
        return;
    }

    const player = new Spotify.Player({
        name: 'Spotify Web Playback SDK Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    // Fehlerbehandlung
    player.on('initialization_error', ({ message }) => { console.error(message); });
    player.on('authentication_error', ({ message }) => { console.error(message); });
    player.on('account_error', ({ message }) => { console.error(message); });
    player.on('playback_error', ({ message }) => { console.error(message); });

    player.on('ready', ({ device_id }) => {
        console.log('The Web Playback SDK is ready!');
        console.log('The device ID is', device_id);
    });

    player.on('player_state_changed', state => {
        if (!state) return;

        const currentTrack = state.track_window.current_track;
        document.getElementById('current-track').textContent = `${currentTrack.name} von ${currentTrack.artists[0].name}`;
    });

    player.connect();
};

// Funktion zum Abrufen des Access Tokens aus der URL
function getAccessToken() {
    const urlParams = new URLSearchParams(window.location.hash.substr(1));
    return urlParams.get('access_token'); // Gibt das Access Token zurück
}

// Wenn ein Token vorhanden ist, wird es benutzt, um die Spotify API zu authentifizieren
const token = getAccessToken();
if (token) {
    console.log('Zugangstoken erhalten:', token);
    // Hier kannst du das Token für weitere API-Anfragen verwenden
} else {
    console.log('Kein Zugangstoken gefunden. Stellen Sie sicher, dass Sie sich bei Spotify anmelden und den Token erhalten.');
}

document.getElementById('add-task').addEventListener('click', addTask);

document.getElementById('new-task').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
