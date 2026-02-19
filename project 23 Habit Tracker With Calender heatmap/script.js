let habits = JSON.parse(localStorage.getItem('habits')) || [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    renderHabits();
    renderCalendar();
    updateStats();
    updateCurrentMonth();
});

// Add new habit
function addHabit() {
    const habitName = document.getElementById('habitName').value.trim();
    if (!habitName) return;
    
    const newHabit = {
        id: Date.now(),
        name: habitName,
        completion: {}
    };
    
    habits.push(newHabit);
    saveHabits();
    renderHabits();
    updateStats();
    document.getElementById('habitName').value = '';
}

// Delete habit
function deleteHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    saveHabits();
    renderHabits();
    renderCalendar();
    updateStats();
}

// Toggle habit completion for today only
function toggleHabit(id) {
    const today = formatDate(new Date());
    const habit = habits.find(h => h.id === id);
    
    if (habit) {
        habit.completion[today] = !habit.completion[today];
        saveHabits();
        renderHabits();
        renderCalendar();
        updateStats();
    }
}

// Render habits list
function renderHabits() {
    const habitList = document.getElementById('habitList');
    const today = formatDate(new Date());
    
    if (habits.length === 0) {
        habitList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No habits yet. Add your first habit above!</p>';
        return;
    }
    
    habitList.innerHTML = habits.map(habit => {
        const isCompleted = habit.completion[today] || false;
        return `
            <div class="habit-item">
                <span class="habit-name">${habit.name}</span>
                <div class="habit-controls">
                    <div class="checkbox ${isCompleted ? 'completed' : ''}" 
                         onclick="toggleHabit(${habit.id})"></div>
                    <button class="delete-btn" onclick="deleteHabit(${habit.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Render calendar heatmap
function renderCalendar() {
    const calendar = document.getElementById('calendarHeatmap');
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHTML = '';
    const today = formatDate(new Date());
    
    // Generate 6 weeks of calendar
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (week * 7) + day);
            
            const dateStr = formatDate(currentDate);
            const isCurrentMonth = currentDate.getMonth() === currentMonth;
            const isToday = dateStr === today;
            
            // Calculate completion level (0-4)
            const completionLevel = getCompletionLevel(dateStr);
            
            const dayClasses = [
                'calendar-day',
                `level-${completionLevel}`,
                !isCurrentMonth ? 'other-month' : '',
                isToday ? 'today' : ''
            ].filter(Boolean).join(' ');
            
            calendarHTML += `
                <div class="${dayClasses}" 
                     data-date="${dateStr}"
                     onmouseenter="showTooltip(event, '${dateStr}')"
                     onmouseleave="hideTooltip()">
                    ${currentDate.getDate()}
                </div>
            `;
        }
    }
    
    calendar.innerHTML = calendarHTML;
}

// Get completion level for a date (0-4 scale)
function getCompletionLevel(dateStr) {
    if (habits.length === 0) return 0;
    
    const completedCount = habits.filter(habit => habit.completion[dateStr]).length;
    const completionRatio = completedCount / habits.length;
    
    if (completionRatio === 0) return 0;
    if (completionRatio <= 0.25) return 1;
    if (completionRatio <= 0.5) return 2;
    if (completionRatio <= 0.75) return 3;
    return 4;
}

// Show tooltip on hover
function showTooltip(event, dateStr) {
    const tooltip = document.getElementById('tooltip');
    const completedHabits = habits.filter(habit => habit.completion[dateStr]).length;
    const totalHabits = habits.length;
    
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    
    tooltip.innerHTML = `
        <strong>${dateFormatted}</strong><br>
        ${completedHabits} of ${totalHabits} habits completed
    `;
    
    tooltip.style.display = 'block';
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY - 10 + 'px';
}

// Hide tooltip
function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

// Change month
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    updateCurrentMonth();
    renderCalendar();
}

// Update current month display
function updateCurrentMonth() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
}

// Update statistics
function updateStats() {
    const today = formatDate(new Date());
    const currentStreak = getCurrentStreak();
    const longestStreak = getLongestStreak();
    const completionRate = getCompletionRate();
    const totalCompleted = getTotalCompleted();
    
    document.getElementById('currentStreak').textContent = `${currentStreak} days`;
    document.getElementById('longestStreak').textContent = `${longestStreak} days`;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('totalCompleted').textContent = totalCompleted;
}

// Calculate current streak
function getCurrentStreak() {
    if (habits.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i >= -365; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = formatDate(date);
        
        const completedToday = habits.some(habit => habit.completion[dateStr]);
        
        if (completedToday) {
            streak++;
        } else if (i < 0) {
            break;
        }
    }
    
    return streak;
}

// Calculate longest streak
function getLongestStreak() {
    if (habits.length === 0) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = -365; i <= 0; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = formatDate(date);
        
        const completedToday = habits.some(habit => habit.completion[dateStr]);
        
        if (completedToday) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    
    return maxStreak;
}

// Calculate completion rate for current month
function getCompletionRate() {
    if (habits.length === 0) return 0;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const today = new Date();
    const endDate = lastDay > today ? today : lastDay;
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    for (let d = new Date(firstDay); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        totalPossible += habits.length;
        totalCompleted += habits.filter(habit => habit.completion[dateStr]).length;
    }
    
    return totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);
}

// Calculate total completed habits
function getTotalCompleted() {
    let total = 0;
    habits.forEach(habit => {
        total += Object.values(habit.completion).filter(Boolean).length;
    });
    return total;
}

// Format date as YYYY-MM-DD in local timezone
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Save habits to localStorage
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Handle Enter key in input
document.getElementById('habitName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addHabit();
    }
});