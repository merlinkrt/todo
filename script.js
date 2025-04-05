// Funktion, um eine neue Aufgabe hinzuzufügen
function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim(); // Leerzeichen entfernen
    if (taskText === "") return; // keine leere Aufgabe

    const li = document.createElement('li');
    li.textContent = taskText;

    // Toggle 'completed' class on click
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    // Right-click to delete the task
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        li.remove(); // Löscht
    });

    // Append the new task to the list
    document.getElementById('task-list').appendChild(li);

    // Clear the input field after adding the task
    input.value = "";
}

// Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    const urlParams = new URLSearchParams(window.location.hash.substr(1));
    const token = urlParams.get('access_token'); // Den Token aus der URL holen

    if (!token) {
        console.log('Kein Zugangstoken gefunden.');
        return;
    }

    console.log('Zugangstoken erhalten:', token);

    // Player Initialisierung
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
        console.log('Der Web Playback SDK ist bereit!');
        console.log('Die Geräte-ID ist', device_id);
    });

    player.on('player_state_changed', state => {
        if (!state) return;

        const currentTrack = state.track_window.current_track;
        document.getElementById('current-track').textContent = `${currentTrack.name} von ${currentTrack.artists[0].name}`;
    });

    player.connect();
};

// Event Listener für das Hinzufügen einer Aufgabe
document.getElementById('add-task').addEventListener('click', addTask);

// Event Listener für das Hinzufügen einer Aufgabe mit der Enter-Taste
document.getElementById('new-task').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
