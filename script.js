const API_URL = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/tasks';
const WHEEL_API = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/wheel';
const HABITS_API = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/habits';
const DIARY_API = 'https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/diary';

// --- Authentication Guard ---
// Checks if the user is logged in. If not, redirects to the registration page.
(function() {
    const currentUserId = localStorage.getItem('userId');
    const path = window.location.pathname.toLowerCase();

    // Checking for presence of keywords in the URL
    const isLoginPage = path.includes('login.html');
    const isRegisterPage = path.includes('register.html');
    const isVerifyPage = path.includes('verify.html');
    
    // Root handling: if path is just "/" or ends with project folder name
    const isRoot = path === '/' || path.endsWith('/') || path.endsWith('index.html');

    const isPublicPage = isLoginPage || isRegisterPage || isVerifyPage;

    // Redirection logic:
    // Only redirect if there is NO userId AND it's NOT a public page AND it's NOT the root/index
    if (!currentUserId && !isPublicPage && !isRoot) {
        console.log("Access denied. Redirecting to registration...");
        window.location.replace('register.html');
    }
})();


// Pulsation variables
let pulseOpacity = 0.2;
let pulseDirection = 1;
let currentWheelData = null;

//  SYSTEM FUNCTIONS
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName'); // Retrieve name here
    const guestBtns = document.getElementById('guest-btns');
    const userProfile = document.getElementById('user-profile');
    const welcomeText = document.getElementById('welcome-text');

    if (userId && userId !== "null") {
        if (guestBtns) guestBtns.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            // Use userName from local storage
            welcomeText.textContent = `Hello, ${userName || 'User'}!`;
        }
    } else {
        if (guestBtns) guestBtns.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function logout() {
    localStorage.clear();
    window.location.replace("login.html");
}

// TASK LOGIC
async function loadTasks() {
    const userId = localStorage.getItem('userId');
    const list = document.getElementById('taskList');
    if (!list) return;

    // If guest — clear the list and exit
    if (!userId || userId === "null") {
        list.innerHTML = '';
        updateProgressBar([]);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?userId=${userId}`);
        if (!response.ok) return;
        const tasks = await response.json();
        list.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            const isDone = task.done || task.isDone;
            if (isDone) li.classList.add('completed-task');

            const priorityLabels = {
                'low': '🌱 Simple', 'medium': '⚡ Medium',
                'high': '🔥 Important', 'goal': '🏆 Goal'
            };

            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTask(${task.id}, ${isDone})">
                    <div class="task-text ${isDone ? 'completed-text' : ''}">
                        <span class="priority-badge prio-${task.priority || 'low'}">
                            ${priorityLabels[task.priority] || '🌱 Simple'}
                        </span><br>
                        <b>${task.name || 'NO CATEGORY'}</b><br>
                        ${task.description || 'No description'}
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            `;
            list.appendChild(li);
        });
        updateProgressBar(tasks);
    } catch (err) { console.error("Task error:", err); }
}

function updateProgressBar(tasks) {
    const progressBar = document.getElementById('progressBar');
    const percentText = document.getElementById('progressPercent');
    if (!progressBar) return;
    const completed = tasks.filter(t => t.done || t.isDone).length;
    const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    progressBar.style.width = percent + '%';
    if (percentText) percentText.textContent = percent + '%';
}

async function addTask() {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === "null") {
        return alert("Please login or register!");
    }

    const descInput = document.getElementById('taskInput');
    const nameInput = document.getElementById('nameInput');
    const priorityInput = document.getElementById('priorityInput');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                description: descInput.value,
                name: nameInput.value,
                priority: priorityInput.value,
                done: false,
                userId: parseInt(userId)
            })
        });
        if (response.ok) {
            descInput.value = ''; nameInput.value = '';
            await loadTasks();
        }
    } catch (err) { console.error(err); }
}

async function toggleTask(id, currentStatus) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ done: !currentStatus })
        });
        await loadTasks();
    } catch (err) { console.error(err); }
}

async function deleteTask(id) {
    if (confirm('Are you sure?')) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await loadTasks();
    }
}

//  WHEEL OF LIFE
async function loadWheelData() {
    const userId = localStorage.getItem('userId');

    const defaultData = [
        { label: 'Health and Sports', key: 'health', score: 0 },
        { label: 'Friends and Environment', key: 'friends', score: 0 },
        { label: 'Relationships', key: 'family', score: 0 },
        { label: 'Career and Business', key: 'work', score: 0 },
        { label: 'Finance', key: 'finance', score: 0 },
        { label: 'Spirituality and Creativity', key: 'spiritual', score: 0 },
        { label: 'Personal Growth', key: 'learning', score: 0 },
        { label: 'Life Brightness', key: 'rest', score: 0 }
    ];

    // If user doesn't exist, draw empty wheel and exit
    if (!userId || userId === "null") {
        currentWheelData = defaultData;
        renderPerfectWheel('balanceChart', defaultData);
        return;
    }

    try {
        const response = await fetch(`${WHEEL_API}/${userId}`);
        if (!response.ok) throw new Error("Backend offline");
        const data = await response.json();
        const wheelData = defaultData.map(item => ({ ...item, score: data[item.key] || 0 }));
        currentWheelData = wheelData;
        renderPerfectWheel('balanceChart', wheelData);
    } catch (err) {
        console.warn("Backend unavailable or error, drawing default.");
        currentWheelData = defaultData;
        renderPerfectWheel('balanceChart', defaultData);
    }
}

function setupWheelClick() {
    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;

    canvas.addEventListener('click', async (event) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return alert("Please login or register!");

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - canvas.width / 2;
        const y = event.clientY - rect.top - canvas.height / 2;

        let angle = Math.atan2(y, x) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;

        const sectorIndex = Math.floor(angle / (Math.PI / 4)) % 8;
        const distance = Math.sqrt(x*x + y*y);
        const maxRadius = 200;

        let score = Math.ceil((distance / maxRadius) * 10);
        if (score > 10) score = 10;
        if (score < 1) score = 1;

        const keys = ['health', 'friends', 'family', 'work', 'finance', 'spiritual', 'learning', 'rest'];
        const clickedKey = keys[sectorIndex];

        try {
            const res = await fetch(`${WHEEL_API}/${userId}`);
            let currentData = await res.json();
            currentData[clickedKey] = score;
            currentData.userId = parseInt(userId);

            await fetch(`${WHEEL_API}/${userId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(currentData)
            });
            await loadWheelData();
        } catch (err) { console.error(err); }
    });
}

function renderPerfectWheel(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    currentWheelData = data;

    function draw() {
        if (!currentWheelData) return;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const squareSize = 400;
        const maxRadius = squareSize / 2;
        const labelRadius = maxRadius + 50;

        ctx.clearRect(0, 0, width, height);
        const scores = currentWheelData.map(d => d.score).filter(s => s > 0);
        const minScore = scores.length > 0 ? Math.min(...scores) : null;

        for (let i = 1; i <= 10; i++) {
            const radius = (maxRadius / 10) * i;
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke();
        }

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i - Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * (maxRadius * 1.41), centerY + Math.sin(angle) * (maxRadius * 1.41));
            ctx.stroke();
        }

        for (let i = 0; i < 8; i++) {
            const item = currentWheelData[i];
            const startAngle = (Math.PI / 4) * i - Math.PI / 2;
            const endAngle = startAngle + (Math.PI / 4);
            const r = (maxRadius / 10) * item.score;

            if (item.score === minScore && minScore < 7 && item.score > 0) {
                ctx.save(); ctx.fillStyle = `rgba(220, 53, 69, ${pulseOpacity})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, r + 8, startAngle, endAngle); ctx.fill(); ctx.restore();
            }
            ctx.fillStyle = 'rgba(46, 125, 50, 0.7)';
            ctx.beginPath(); ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, r, startAngle, endAngle); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.stroke();
        }

        ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 13px "Inter", sans-serif';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        for (let i = 0; i < 8; i++) {
            const item = currentWheelData[i];
            const axisAngle = (Math.PI / 4) * i - Math.PI / 2;
            const textAngle = axisAngle + (Math.PI / 8);
            ctx.save();
            ctx.translate(centerX + Math.cos(textAngle) * labelRadius, centerY + Math.sin(textAngle) * labelRadius);
            let rotationAngle = textAngle + Math.PI / 2;
            if (textAngle > 0 && textAngle < Math.PI) rotationAngle += Math.PI;
            ctx.rotate(rotationAngle);
            ctx.fillText(item.label.toUpperCase(), 0, 0); ctx.restore();
        }

        pulseOpacity += 0.008 * pulseDirection;
        if (pulseOpacity > 0.5 || pulseOpacity < 0.15) pulseDirection *= -1;
        requestAnimationFrame(draw);
    }
    if (!window.isWheelAnimating) { window.isWheelAnimating = true; draw(); }
}

// HABITS
async function loadHabits() {
    const userId = localStorage.getItem('userId');
    const habitList = document.getElementById('habitList');
    if (!habitList) return;

    // If guest — clear the list and exit
    if (!userId || userId === "null") {
        habitList.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${HABITS_API}?userId=${userId}`);
        const habits = await response.json();
        habitList.innerHTML = '';
        habits.forEach(habit => renderHabitItem(habit));
    } catch (err) { console.error("Habit loading error:", err); }
}

async function addHabit() {
    const input = document.getElementById('habitInput');
    const userId = localStorage.getItem('userId');

    // CHECK: If guest tries to add a habit
    if (!userId || userId === "null") {
        return alert("Please login or register!");
    }

    if (!input.value.trim()) return;

    try {
        const response = await fetch(HABITS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: input.value.trim(),
                userId: parseInt(userId),
                streak: 0,
                current_days: ""
            })
        });
        if (response.ok) { input.value = ''; await loadHabits(); }
    } catch (err) { console.error("Addition error:", err); }
}

function renderHabitItem(habit) {
    const habitList = document.getElementById('habitList');
    if (!habitList) return;
    const li = document.createElement('li');
    li.className = 'habit-item';
    li.id = `habit-${habit.id}`;
    li.setAttribute('data-streak', habit.streak || 0);

    const daysHtml = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => `
        <div class="day-wrapper">
            <span class="day-label">${day}</span>
            <input type="checkbox" class="day-check" onchange="checkWeekCompletion(${habit.id})">
        </div>`).join('');

    li.innerHTML = `
        <div class="habit-info">
            <span class="habit-name">${habit.name}</span>
            <span class="habit-streak ${habit.streak > 0 ? 'streak-active' : ''}" id="streak-${habit.id}">${formatStreak(habit.streak)}</span>
        </div>
        <div class="habit-days">${daysHtml}</div>
        <button class="btn-delete" onclick="deleteHabit(${habit.id})">×</button>
    `;
    habitList.appendChild(li);
}

async function checkWeekCompletion(habitId) {
    const habitItem = document.getElementById(`habit-${habitId}`);
    const checkboxes = habitItem.querySelectorAll('.day-check');
    if (Array.from(checkboxes).every(cb => cb.checked)) {
        let newStreak = (parseInt(habitItem.getAttribute('data-streak')) || 0) + 1;
        try {
            const response = await fetch(`${HABITS_API}/${habitId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streak: newStreak, current_days: "" })
            });
            if (response.ok) {
                habitItem.setAttribute('data-streak', newStreak);
                const sEl = document.getElementById(`streak-${habitId}`);
                sEl.textContent = formatStreak(newStreak);
                sEl.classList.add('streak-active');
                checkboxes.forEach(cb => cb.checked = false);
            }
        } catch (err) { console.error(err); }
    }
}

function formatStreak(weeks) {
    const w = parseInt(weeks) || 0;
    if (w <= 0) return "0 weeks";

    const months = Math.floor(w / 4);
    const remainingWeeks = w % 4;

    if (months > 0) {
        if (remainingWeeks > 0) {
            return `${months} mo. ${remainingWeeks} wk.`;
        } else {
            return `${months} mo.`;
        }
    } else {
        return `${remainingWeeks} wk.`;
    }
}

async function deleteHabit(id) {
    try {
        await fetch(`${HABITS_API}/${id}`, { method: 'DELETE' });
        document.getElementById(`habit-${id}`).remove();
    } catch (err) { console.error(err); }
}

// --- DIARY ---
async function loadDiary() {
    const userId = localStorage.getItem('userId');
    const log = document.getElementById('diaryLog');
    if (!log || !userId) return;
    try {
        const response = await fetch(`${DIARY_API}?userId=${userId}`);
        const entries = await response.json();
        log.innerHTML = entries.map(item => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US') : 'Today';
            return `
                <div class="diary-entry">
                    <div class="diary-entry-header"><span>${dateStr}</span><span>${item.mood}</span></div>
                    <h4>${item.title}</h4><p>${item.content}</p>
                    <button class="btn-delete" onclick="deleteDiaryEntry(${item.id})">×</button>
                </div>`;
        }).join('');
    } catch (err) { console.error("Diary error:", err); }
}

async function addDiaryEntry(event) {
    event.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) return alert("Please login or register!");
    const entry = {
        userId: parseInt(userId),
        title: document.getElementById('diaryTitle').value,
        mood: document.getElementById('diaryMood').value,
        content: document.getElementById('diaryText').value
    };
    try {
        const response = await fetch(DIARY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (response.ok) { event.target.reset(); await loadDiary(); }
    } catch (err) { console.error("Save error:", err); }
}

async function deleteDiaryEntry(id) {
    if (confirm('Delete entry?')) {
        await fetch(`${DIARY_API}/${id}`, { method: 'DELETE' });
        await loadDiary();
    }
}

// --- INITIALIZATION (SINGLE BLOCK) ---
// --- QUOTES (Via AI) ---
async function initTypewriter() {
    const textElement = document.getElementById('typewriter-quote');
    if (!textElement) return;

    let quote = "";

    try {
        // Request to your future endpoint
        const response = await fetch('https://wheel-web-site-api-apfhdfbxd7dud0cj.austriaeast-01.azurewebsites.net/ai-quote');
        if (response.ok) {
            quote = await response.text();
        } else {
            throw new Error();
        }
    } catch (err) {
        // Fallback (backup option) if server is down or AI didn't respond
        const fallbackQuotes = [
            "Discipline is the key to success.",
            "Your only limit is yourself.",
            "Small steps lead to the goal."
        ];
        quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    }

    // Clear text before starting animation
    textElement.textContent = "";

    let i = 0;
    function type() {
        if (i < quote.length) {
            textElement.textContent += quote.charAt(i++);
            setTimeout(type, 50);
        }
    }
    type();
}

const quotes = ["Discipline is the key to success.", "Your only limit is yourself.", "Small steps lead to the goal."];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Start everything. Functions will automatically detect guest vs user.
    loadTasks();
    loadWheelData();
    loadHabits();
    loadDiary();

    setupWheelClick();
    initTypewriter();

    const diaryForm = document.getElementById('diaryForm');
    if (diaryForm) diaryForm.addEventListener('submit', addDiaryEntry);

    const taskForm = document.getElementById('taskForm');
    if (taskForm) taskForm.addEventListener('submit', (e) => { e.preventDefault(); addTask(); });
});
