function addTask() {
    const input = document.getElementById('new-task');
    const taskText = input.value.trim(); // Korrekt: 'input.value' verwenden
    if (taskText === "") return; // Verhindern, dass leere Aufgaben hinzugefügt werden

    const li = document.createElement('li');
    li.textContent = taskText;

    // Toggle 'completed' class on click
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    // Right-click to delete the task
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Verhindert das Standard-Kontextmenü
        li.remove(); // Löscht das Element
    });

    // Append the new task to the list
    document.getElementById('task-list').appendChild(li);

    // Clear the input field after adding the task
    input.value = "";
}
