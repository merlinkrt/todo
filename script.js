// Funktion zum Abrufen des Access Tokens aus der URL
function getAccessToken() {
    const urlParams = new URLSearchParams(window.location.hash.substr(1)); // Hash-Parameter extrahieren
    const token = urlParams.get('access_token'); // Holt das Token
    if (!token) { // Wenn kein Token gefunden wird
        console.log('Kein Zugangstoken gefunden');
        return null; // Gibt null zurück, wenn kein Token gefunden wurde
    }
    console.log('Zugangstoken erhalten:', token); // Gibt das Token in der Konsole aus
    return token; // Gibt das Token zurück, wenn es gefunden wurde
}

// Spotify Web Playback SDK initialisieren
window.onSpotifyWebPlaybackSDKReady = () => {
    const token = getAccessToken(); // Hole das Token aus der URL

    if (!token) { // Wenn kein Token vorhanden ist
        console.log('Kein Zugriffstoken gefunden');
        return; // Stoppe die Ausführung, wenn kein Token vorhanden ist
    }

    const player = new Spotify.Player({
        name: 'Spotify Web Playback SDK Player',
        getOAuthToken: cb => { cb(token); }, // Verwende das Token im Player
        volume: 0.5 // Standardlautstärke
    });

    // Fehlerbehandlung
    player.on('initialization_error', ({ message }) => {
        console.error('Initialisierungsfehler:', message);
    });
    player.on('authentication_error', ({ message }) => {
        console.error('Authentifizierungsfehler:', message);
    });
    player.on('account_error', ({ message }) => {
        console.error('Konto Fehler:', message);
    });
    player.on('playback_error', ({ message }) => {
        console.error('Wiedergabefehler:', message);
    });

    player.on('ready', ({ device_id }) => {
        console.log('Der Web Playback SDK Player ist bereit!');
        console.log('Die Device ID lautet:', device_id);
    });

    player.on('player_state_changed', state => {
        if (!state) return; // Wenn keine State-Informationen vorhanden sind, nichts tun
        const currentTrack = state.track_window.current_track; // Hole den aktuellen Track
        document.getElementById('current-track').textContent = `${currentTrack.name} von ${currentTrack.artists[0].name}`; // Aktualisiere die Anzeige des aktuellen Tracks
    });

    player.connect(); // Verbinde den Player
};

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

document.getElementById('add-task').addEventListener('click', addTask);

document.getElementById('new-task').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
