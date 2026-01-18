// ===== STATE MANAGEMENT =====
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSort = 'date';
let currentView = 'dashboard';
let charts = {};

// ===== THEME MANAGEMENT =====
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
const savedTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
    updateCharts();
});

function updateThemeUI(theme) {
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }
}

// ===== TASK CRUD OPERATIONS =====
function addTask(taskData) {
    const task = {
        id: Date.now().toString(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    updateCharts();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    updateCharts();
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
        updateCharts();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDate').value = task.dueDate || '';
        document.getElementById('taskPriority').value = task.priority;
        
        deleteTask(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== FILTERING & SORTING =====
function getFilteredTasks() {
    let filtered = [...tasks];

    // Apply filter
    switch(currentFilter) {
        case 'pending':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
        case 'high':
            filtered = filtered.filter(t => t.priority === 'high');
            break;
    }

    // Apply search
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm) ||
            (t.description && t.description.toLowerCase().includes(searchTerm))
        );
    }

    // Apply sort
    if (currentSort === 'date') {
        filtered.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    } else if (currentSort === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return filtered;
}

// ===== RENDERING =====
function renderTasks() {
    const filtered = getFilteredTasks();
    const containers = [
        document.getElementById('taskListContainer'),
        document.getElementById('tasksListContainer')
    ];

    containers.forEach(container => {
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    <h3>No tasks found</h3>
                    <p>Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="task-list">
                ${filtered.map(task => `
                    <div class="task-card ${task.completed ? 'completed' : ''}">
                        <div class="task-header">
                            <div style="flex: 1;">
                                <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                            </div>
                            <div class="task-actions">
                                <button class="btn-icon btn-complete" onclick="toggleComplete('${task.id}')" title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                                    ${task.completed ? '↩️' : '✓'}
                                </button>
                                <button class="btn-icon" onclick="editTask('${task.id}')" title="Edit">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete">🗑️</button>
                            </div>
                        </div>
                        <div class="task-meta">
                            ${task.dueDate ? `<div class="task-date">📅 ${new Date(task.dueDate).toLocaleDateString()}</div>` : ''}
                            <div class="priority-badge priority-${task.priority}">
                                ${task.priority}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === 'high').length;

    // Update stat cards
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statHigh').textContent = high;

    // Update badges
    document.getElementById('totalTasksBadge').textContent = total;
    document.getElementById('allCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('highCount').textContent = high;
}

// ===== CHARTS =====
function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#f1f5f9' : '#1a1a1a',
        grid: isDark ? '#334155' : '#e9ecef',
        primary: '#4f46e5',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
}

function initCharts() {
    const colors = getChartColors();

    // Pie Chart - Completion Status
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [colors.success, colors.warning],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text, padding: 15, font: { size: 12 } }
                }
            }
        }
    });

    // Bar Chart - Priority Distribution
    const barCtx = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tasks',
                data: [0, 0, 0],
                backgroundColor: [colors.danger, colors.warning, colors.info],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: colors.text, stepSize: 1 },
                    grid: { color: colors.grid }
                },
                x: {
                    ticks: { color: colors.text },
                    grid: { display: false }
                }
            }
        }
    });

    // Line Chart - Tasks Over Time (Last 7 Days)
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    charts.line = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tasks Created',
                data: [],
                borderColor: colors.primary,
                backgroundColor: colors.primary + '20',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: colors.text }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: colors.text, stepSize: 1 },
                    grid: { color: colors.grid }
                },
                x: {
                    ticks: { color: colors.text },
                    grid: { color: colors.grid }
                }
            }
        }
    });
}

function updateCharts() {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;

    // Update pie chart
    charts.pie.data.datasets[0].data = [completed, pending];
    
    // Update bar chart
    charts.bar.data.datasets[0].data = [high, medium, low];

    // Update line chart - last 7 days
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }

    const tasksByDay = last7Days.map(date => {
        return tasks.filter(t => t.createdAt.split('T')[0] === date).length;
    });

    charts.line.data.labels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    charts.line.data.datasets[0].data = tasksByDay;

    // Update colors for theme
    const colors = getChartColors();
    charts.pie.options.plugins.legend.labels.color = colors.text;
    charts.bar.options.scales.y.ticks.color = colors.text;
    charts.bar.options.scales.x.ticks.color = colors.text;
    charts.bar.options.scales.y.grid.color = colors.grid;
    charts.line.options.plugins.legend.labels.color = colors.text;
    charts.line.options.scales.y.ticks.color = colors.text;
    charts.line.options.scales.x.ticks.color = colors.text;
    charts.line.options.scales.y.grid.color = colors.grid;
    charts.line.options.scales.x.grid.color = colors.grid;

    // Redraw all charts
    Object.values(charts).forEach(chart => chart.update());
}

// ===== NAVIGATION =====
document.querySelectorAll('[data-view]').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
    });
});

function switchView(view) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const activeSection = document.getElementById(view);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Update sidebar active state
    document.querySelectorAll('[data-view]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });
}

// ===== FILTERS & SORT =====
document.querySelectorAll('[data-filter]').forEach(item => {
    item.addEventListener('click', () => {
        currentFilter = item.dataset.filter;
        switchView("tasks");
        renderTasks();
    });
});

document.querySelectorAll('[data-sort]').forEach(item => {
    item.addEventListener('click', () => {
        currentSort = item.dataset.sort;
        renderTasks();
    });
});

// ===== SEARCH =====
document.getElementById('searchInput').addEventListener('input', () => {
    renderTasks();
});

// ===== FORM SUBMISSION =====
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        dueDate: document.getElementById('taskDate').value,
        priority: document.getElementById('taskPriority').value
    };

    addTask(taskData);
    
    // Reset form
    e.target.reset();
});

// ===== INITIALIZATION =====
function init() {
    renderTasks();
    updateStats();
    initCharts();
    updateCharts();
}

// Start the app
init();
switchView("dashboard");