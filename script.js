const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const deletedTasks = document.getElementById("deletedTasks");
const editedTasks = document.getElementById("editedTasks");
const deleteSelectedBtn = document.getElementById("deleteSelected");
const sortBtn = document.getElementById("sortBtn");
const resetBtn = document.getElementById("resetBtn");

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const appContainer = document.getElementById('appContainer');
let theme = localStorage.getItem('theme') || 'light';
function applyTheme(t) {
    if (t === 'dark') {
  
        document.documentElement.classList.add('dark');
       
        document.body.classList.add('dark');
        if (appContainer) appContainer.classList.add('dark');
        if (themeToggle) {
            themeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.2" y1="4.2" x2="5.6" y2="5.6"></line>
                    <line x1="18.4" y1="18.4" x2="19.8" y2="19.8"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.2" y1="19.8" x2="5.6" y2="18.4"></line>
                    <line x1="18.4" y1="5.6" x2="19.8" y2="4.2"></line>
                </svg>`;
            themeToggle.setAttribute('aria-label', 'Switch to light theme');
        }
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        if (appContainer) appContainer.classList.remove('dark');
        if (themeToggle) {
            themeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>`;
            themeToggle.setAttribute('aria-label', 'Switch to dark theme');
        }
    }
    localStorage.setItem('theme', t);
}
if (themeToggle) {
    applyTheme(theme);
    themeToggle.addEventListener('click', () => {

        themeToggle.classList.add('animating');
        setTimeout(() => themeToggle.classList.remove('animating'), 520);

        theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
    });
}

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let deletedCount = Number(localStorage.getItem("deletedCount")) || 0;
let editCount = Number(localStorage.getItem("editCount")) || 0;
let originalTaskOrder = [...tasks]; 
let isSortedAZ = false;

// Drag and drop state
let draggedIndex = null;
let draggedElement = null;
let dropTargetIndex = null;

// Event listeners
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
deleteSelectedBtn.addEventListener("click", deleteSelectedTasks);
sortBtn.addEventListener("click", toggleSort);
resetBtn.addEventListener("click", resetSort);

document.addEventListener("keydown", e => {
    if (document.activeElement === taskInput) return;
    if (e.key === "Backspace" || e.key === "Delete") {
        const checked = document.querySelectorAll(".task-checkbox:checked");
        if (checked.length) {
            e.preventDefault();
            deleteSelectedTasks();
        }
    }
});

// Add a task
function addTask() {
    const newTask = taskInput.value.trim();
    if (!newTask) return alert("Task field is empty. Please type something!");

    const exists = tasks.some(task => task.text.toLowerCase() === newTask.toLowerCase());
    if (exists) return alert("Task already exists!");

    tasks.push({ text: newTask, completed: false });
    // Update original order when task is added while in normal (unsorted) view
    if (!isSortedAZ) {
        originalTaskOrder = [...tasks];
    }
    taskInput.value = "";
    saveTasks();
    displayTask();
}

// Delete selected tasks
function deleteSelectedTasks() {
    const checkboxes = document.querySelectorAll(".task-checkbox");
    const indexesToDelete = [];
    checkboxes.forEach(cb => {
        if (cb.checked) indexesToDelete.push(Number(cb.closest("li").dataset.index));
    });

    if (!indexesToDelete.length) return;
    if (!confirm(`Are you sure you want to delete ${indexesToDelete.length} task(s)?`)) return;

    indexesToDelete.sort((a, b) => b - a).forEach(i => {
        tasks.splice(i, 1);
        originalTaskOrder.splice(i, 1); 
        deletedCount++;
    });

    localStorage.setItem("deletedCount", deletedCount);
    saveTasks();
    displayTask();
}

// Display tasks
function displayTask() {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        taskList.innerHTML += 
        `<li data-index="${index}" draggable="true"
                class="flex m-2 sm:m-3 justify-between items-center gap-2 sm:gap-3 border border-gray-500 rounded px-2 sm:px-4 py-2 transition-colors duration-150 ease-in-out cursor-pointer ${task.completed ? 'bg-green-500 text-white' : 'hover:bg-gray-300 dark:hover:bg-slate-700'}">
                <div class="flex items-start gap-2 flex-1 min-w-0 cursor-pointer" >
                    <input type="checkbox" class="task-checkbox accent-black mt-1 cursor-pointer" data-index="${index}">
                    <span class="task-text flex-1 min-w-0 break-words whitespace-normal pr-2 ${task.completed ? 'line-through opacity-60 text-black' : ''}">
                        ${task.text}
                    </span>
                </div>

                <button class="completed group border px-2 py-1 rounded transition-colors ${task.completed ? 'bg-green-600 text-white border-green-700' : 'bg-white border-black dark:bg-slate-800 dark:border-slate-700 hover:bg-green-500'}">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-4 h-4 text-black group-hover:text-white transition-colors">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>

                <button class="delete shrink-0 bg-white border
                 border-black px-2 py-1 rounded group hover:bg-red-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-4 h-4 text-black group-hover:text-white transition-colors">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </li>`;
    });

    updateCounts();
    attachListeners();
    enableDragAndDrop();
    enableEditing();
}

// Update total/completed/deleted
function updateCounts() {
    totalTasks.textContent = `Total Tasks: ${tasks.length}`;
    completedTasks.textContent = `Completed Tasks: ${tasks.filter(t => t.completed).length}`;
    deletedTasks.textContent = `Deleted Tasks: ${deletedCount}`;
    editedTasks.textContent = `Edited Tasks: ${editCount}`;
}

// Attach delete and complete button listeners
function attachListeners() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = e => {
            const li = e.target.closest("li");
            const index = Number(li.dataset.index);
            if (!confirm(`Are you sure you want to delete "${tasks[index].text}"?`)) return;

            tasks.splice(index, 1);
            originalTaskOrder.splice(index, 1); // Also remove from original order
            deletedCount++;
            saveTasks();
            displayTask();
        };
    });

    document.querySelectorAll(".completed").forEach(btn => {
        btn.onclick = e => {
            const li = e.target.closest("li");
            const index = Number(li.dataset.index);
            tasks[index].completed = !tasks[index].completed;
            saveTasks();
            displayTask();
        };
    });

    document.querySelectorAll(".task-checkbox").forEach(cb => {
    cb.addEventListener("change", e => {
        const li = e.target.closest("li");

        if (e.target.checked) {
    
            li.style.backgroundColor = '#3b82f6'; 
        } else {
            li.style.backgroundColor = '';
        }
    });
});

}


// Enable double-click editing
let isEditing = false;

function enableEditing() {
    document.querySelectorAll(".task-text").forEach(span => {
        const startEdit = () => {
            if (isEditing) return; // prevent multiple edits
            isEditing = true; 

            const li = span.closest("li");
            const index = Number(li.dataset.index);
            const deleteBtn = li.querySelector(".delete");

            deleteBtn.style.display = "none"; // hide delete

            const input = document.createElement("input");
            input.type = "text";
            input.value = tasks[index].text;
            input.className = "flex-1 min-w-0 border px-1 py-0";
            span.replaceWith(input);
            input.focus();
            let finished = false;
            const finishEdit = (save) => {
                if (finished) return; // prevent double execution (keydown + blur)
                const newValue = input.value.trim();
                const oldValue = tasks[index].text;

                if (!save) {
                    finished = true;
                    isEditing = false;
                    deleteBtn.style.display = "inline-block";
                    const restored = document.createElement("span");
                    restored.className = span.className;
                    restored.textContent = tasks[index].text;
                    input.replaceWith(restored);
                    enableEditing();
                    return;
                }

                if (!newValue) {
                    alert("Task cannot be empty!");
                    setTimeout(() => input.focus(), 0);
                    return;
                }

                // If the text wasn't changed, restore without counting as an edit
                if (newValue === oldValue) {
                    finished = true;
                    isEditing = false;
                    deleteBtn.style.display = "inline-block";
                    const restored = document.createElement("span");
                    restored.className = span.className;
                    restored.textContent = oldValue;
                    input.replaceWith(restored);
                    enableEditing();
                    return;
                }

                const exists = tasks.some((t, i) => t.text.toLowerCase() === newValue.toLowerCase() && i !== index);
                if (exists) {
                    alert("Task already exists!");
                    setTimeout(() => input.focus(), 0);
                    return;
                }

                tasks[index].text = newValue;
                finished = true;
                isEditing = false; // reset editing flag
                deleteBtn.style.display = "inline-block";
                editCount++;
                saveTasks();
                displayTask();
            };

            input.onkeydown = e => {
                if (e.key === "Enter") finishEdit(true);
                if (e.key === "Escape") finishEdit(false);
            };

            // On blur, save the edit
            input.onblur = () => setTimeout(() => {
                if (document.activeElement !== input) finishEdit(true);
            }, 0);
        };

        // Desktop double-click to edit
        span.ondblclick = startEdit;

        // Touch double-tap support for phones
        (function() {
            let lastTap = 0;
            span.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTap < 300) {
                    e.preventDefault();
                    startEdit();
                }
                lastTap = now;
            }, { passive: true });
        })();
    });
}




// Enable drag & drop

function enableDragAndDrop() {
    taskList.querySelectorAll("li").forEach(li => {
        li.draggable = true;

        li.ondragstart = () => {
            if (isEditing) return;
            draggedIndex = Number(li.dataset.index);
        };

        li.ondragover = e => {
            if (isEditing) return;
            e.preventDefault();
        };

        li.ondrop = e => {
            if (isEditing) return;
            const targetLi = e.target.closest("li");
            if (!targetLi) return;

            const targetIndex = Number(targetLi.dataset.index);
            if (draggedIndex === targetIndex) return;

            [tasks[draggedIndex], tasks[targetIndex]] = [tasks[targetIndex], tasks[draggedIndex]];

            saveTasks();
            if (!isSortedAZ) {
                originalTaskOrder = [...tasks];
            }
            displayTask();
        };

        // Mobile touch drag and drop
        let touchStartIndex = null;
        let touchStartTime = null;

        li.addEventListener('touchstart', (e) => {
            if (isEditing) return;
            touchStartIndex = Number(li.dataset.index);
            touchStartTime = Date.now();
            draggedElement = li;
            li.classList.add('touch-dragging');
        }, { passive: true });

        li.addEventListener('touchend', (e) => {
            if (!touchStartIndex && touchStartIndex !== 0) return;
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            li.classList.remove('touch-dragging');

            // Get the element the finger is over when releasing
            const touch = e.changedTouches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetLi = targetElement && targetElement.closest('li');

            if (targetLi && targetLi !== li) {
                const targetIndex = Number(targetLi.dataset.index);
                
                // Swap the tasks
                [tasks[touchStartIndex], tasks[targetIndex]] = [tasks[targetIndex], tasks[touchStartIndex]];
                
                saveTasks();
                if (!isSortedAZ) {
                    originalTaskOrder = [...tasks];
                }
                displayTask();
            }

            touchStartIndex = null;
            touchStartTime = null;
            draggedElement = null;
        }, { passive: true });

        li.addEventListener('touchcancel', (e) => {
            li.classList.remove('touch-dragging');
            touchStartIndex = null;
            touchStartTime = null;
            draggedElement = null;
        }, { passive: true });
    });
}


// Sort and reset functions
function toggleSort() {
    if (!isSortedAZ) {
        // Sort A-Z
        tasks.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
        sortBtn.textContent = "Sort(Z-A)";
        isSortedAZ = true;
    } else {
        // Sort Z-A
        tasks.sort((a, b) => b.text.toLowerCase().localeCompare(a.text.toLowerCase()));
        sortBtn.textContent = "Sort(A-Z)";
        isSortedAZ = false;
    }
    displayTask();
}

function resetSort() {
    if (originalTaskOrder.length > 0) {
        tasks = [...originalTaskOrder];
        isSortedAZ = false;
        sortBtn.textContent = "Sort(A-Z)";
        displayTask();
    }
}

// Save tasks
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("deletedCount", String(deletedCount));
    localStorage.setItem("editCount", String(editCount));
}

// Initial render
displayTask();
