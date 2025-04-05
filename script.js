// Funktion zum Hinzufügen einer Aufgabe
function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim();
    if (taskText === "") return;

    const li = document.createElement('li');
    li.textContent = taskText;

    // Toggle "completed" Status (durch Klicken)
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    // Rechtsklick zum Löschen der Aufgabe
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        li.remove();
    });

    document.getElementById('task-list').appendChild(li);
    input.value = ""; // Eingabefeld nach dem Hinzufügen leeren
}

// Spotify Access Token erhalten und Player initialisieren
const urlParams = new URLSearchParams(window.location.hash.substr(1));
const token = urlParams.get('access_token');  // Access Token extrahieren

if (token) {
    console.log('Zugangstoken erhalten:', token);

    // Spotify Web Playback SDK initialisieren
    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Spotify Web Playback SDK Player',
            getOAuthToken: (cb) => { cb(token); },
            volume: 0.5
        });

        // Fehlerbehandlung
        player.on('initialization_error', ({ message }) => { console.error(message); });
        player.on('authentication_error', ({ message }) => { console.error(message); });
        player.on('account_error', ({ message }) => { console.error(message); });
        player.on('playback_error', ({ message }) => { console.error(message); });

        // Player bereit
        player.on('ready', ({ device_id }) => {
            console.log('Der Player ist bereit!');
            console.log('Die Device ID ist', device_id);
        });

        // Aktuellen Song abspielen
        player.on('player_state_changed', (state) => {
            if (!state) return;
            const currentTrack = state.track_window.current_track;
            document.getElementById('current-track').textContent = `${currentTrack.name} von ${currentTrack.artists[0].name}`;
        });

        // Player verbinden
        player.connect();
    };
} else {
    console.log('Kein Zugangstoken gefunden. Bitte mit Spotify einloggen.');
}

// Event für den "Hinzufügen"-Button
document.getElementById('add-task').addEventListener('click', addTask);

