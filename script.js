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


window.onSpotifyWebPlaybackSDKReady = () => {
    const token = 'YOUR_ACCESS_TOKEN'; // Ersetzen Sie dies durch Ihren tatsächlichen Token

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

const urlParams = new URLSearchParams(window.location.hash.substr(1));
const token = urlParams.get('access_token');
if (token) {
    console.log('Zugangstoken erhalten:', token);
    // Hier können Sie den Token verwenden, um auf die Spotify API zuzugreifen
} else {
    console.log('Kein Zugangstoken gefunden. Stellen Sie sicher, dass Sie sich bei Spotify anmelden und den Token erhalten.');
}

document.getElementById('add-task').addEventListener('click', addTask);

document.getElementById('new-task').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});