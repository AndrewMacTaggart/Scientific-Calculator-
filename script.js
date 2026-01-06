// Calendar Class
class Calendar {
    constructor(taskTracker) {
        this.taskTracker = taskTracker;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.populateMonthSelect();
        this.populateYearSelect();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('monthSelect').addEventListener('change', (e) => this.changeMonth(e.target.value));
        document.getElementById('yearSelect').addEventListener('change', (e) => this.changeYear(e.target.value));
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
        this.updateSelects();
    }

    changeMonth(monthIndex) {
        this.currentDate.setMonth(parseInt(monthIndex));
        this.renderCalendar();
    }

    changeYear(year) {
        this.currentDate.setFullYear(parseInt(year));
        this.renderCalendar();
    }

    populateMonthSelect() {
        const monthSelect = document.getElementById('monthSelect');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        monthSelect.innerHTML = months.map((month, index) => 
            `<option value="${index}">${month}</option>`
        ).join('');
        
        this.updateSelects();
    }

    populateYearSelect() {
        const yearSelect = document.getElementById('yearSelect');
        const years = [];
        
        // Set year range to 2025-2035
        for (let i = 2025; i <= 2035; i++) {
            years.push(i);
        }
        
        yearSelect.innerHTML = years.map(year => 
            `<option value="${year}">${year}</option>`
        ).join('');
        
        this.updateSelects();
    }

    updateSelects() {
        document.getElementById('monthSelect').value = this.currentDate.getMonth();
        document.getElementById('yearSelect').value = this.currentDate.getFullYear();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarTitle = document.getElementById('calendarTitle');
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        calendarTitle.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        calendarGrid.innerHTML = '';
        
        // Add day headers
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = date.toISOString().split('T')[0];
            
            // Check if it's today
            if (date.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Check if it's selected
            if (this.selectedDate && date.getTime() === this.selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }
            
            // Check if it has tasks
            const hasTasks = this.taskTracker.hasTasksForDate(date);
            if (hasTasks) {
                dayElement.classList.add('has-tasks');
            }
            
            // Check if it has notes
            if (window.notepadManager && window.notepadManager.hasNoteForDate(date)) {
                dayElement.classList.add('has-notes');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            dayElement.addEventListener('click', () => this.selectDate(date));
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Add empty cells for days after the last day of the month
        const totalCells = startingDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedDate.setHours(0, 0, 0, 0);
        
        // Update task date input - convert to YYYY-MM-DD format to avoid timezone issues
        const taskDateInput = document.getElementById('taskDate');
        const year = this.selectedDate.getFullYear();
        const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDate.getDate()).padStart(2, '0');
        taskDateInput.value = `${year}-${month}-${day}`;
        
        // Filter tasks by selected date
        this.taskTracker.filterByDate(this.selectedDate);
        
        // Update notepad for selected date
        if (window.notepadManager) {
            window.notepadManager.loadNoteForDate(this.selectedDate);
        }
        
        // Re-render calendar to show selection
        this.renderCalendar();
    }

    getSelectedDate() {
        return this.selectedDate;
    }

    refresh() {
        this.renderCalendar();
    }
}

// Task Tracker Application
class TaskTracker {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.filterDate = null;
        this.calendar = null;
        
        this.init();
    }

    init() {
        // Load tasks from localStorage
        this.loadTasks();
        
        // Initialize holidays
        this.initializeHolidays();
        
        // Initialize calendar
        this.calendar = new Calendar(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set today's date as default
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        document.getElementById('taskDate').value = today.toISOString().split('T')[0];
        
        // Render initial tasks
        this.renderTasks();
        this.updateTaskCount();
    }

    setupEventListeners() {
        // Form submission
        const taskForm = document.getElementById('taskForm');
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear completed button
        const clearCompleted = document.getElementById('clearCompleted');
        clearCompleted.addEventListener('click', () => {
            this.clearCompleted();
        });

        // Sync calendar when date input changes
        const taskDateInput = document.getElementById('taskDate');
        taskDateInput.addEventListener('change', (e) => {
            if (e.target.value && this.calendar) {
                const selectedDate = new Date(e.target.value);
                selectedDate.setHours(0, 0, 0, 0);
                this.calendar.selectDate(selectedDate);
            }
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskDateInput = document.getElementById('taskDate');
        const taskTimeInput = document.getElementById('taskTime');
        const text = taskInput.value.trim();
        const dateValue = taskDateInput.value;
        const timeValue = taskTimeInput.value;

        if (text === '') {
            return;
        }

        // Parse date string to avoid timezone issues
        let taskDateStr;
        if (dateValue) {
            // Use the date string directly to avoid timezone conversion
            taskDateStr = dateValue;
        } else {
            // If no date provided, use today's date in local timezone
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            taskDateStr = `${year}-${month}-${day}`;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            date: taskDateStr,
            time: timeValue || null, // Store time if provided
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        taskInput.value = '';
        taskTimeInput.value = ''; // Clear time input
        
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();
        if (this.calendar) {
            this.calendar.refresh();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        // Prevent toggling holiday tasks
        if (task && task.isHoliday) {
            return;
        }
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCount();
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        // Prevent deletion of holiday tasks
        if (task && task.isHoliday) {
            alert('Holiday tasks cannot be deleted.');
            return;
        }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();
    }

    startEdit(id) {
        const task = this.tasks.find(t => t.id === id);
        // Prevent editing of holiday tasks
        if (task && task.isHoliday) {
            alert('Holiday tasks cannot be edited.');
            return;
        }
        this.editingId = id;
        this.renderTasks();
    }

    saveEdit(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
        }
        this.editingId = null;
        this.renderTasks();
    }

    cancelEdit() {
        this.editingId = null;
        this.renderTasks();
    }

    clearCompleted() {
        // Only count non-holiday completed tasks
        const completedCount = this.tasks.filter(t => t.completed && !t.isHoliday).length;
        if (completedCount === 0) {
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)? (Holidays will be preserved)`)) {
            this.tasks = this.tasks.filter(t => !t.completed || t.isHoliday);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCount();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Clear date filter when changing status filter
        this.filterDate = null;
        if (this.calendar) {
            this.calendar.selectedDate = null;
            this.calendar.refresh();
        }
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        
        // Separate holidays from regular tasks
        const holidays = filtered.filter(t => t.isHoliday);
        const regularTasks = filtered.filter(t => !t.isHoliday);
        
        // Apply status filter to regular tasks only
        switch (this.currentFilter) {
            case 'active':
                filtered = regularTasks.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = regularTasks.filter(t => t.completed);
                break;
            default:
                filtered = regularTasks;
        }
        
        // Apply date filter if set (filterDate is now a string in YYYY-MM-DD format)
        if (this.filterDate) {
            // Filter regular tasks by date
            filtered = filtered.filter(t => t.date && t.date === this.filterDate);
            
            // Add holidays that match the selected date
            const matchingHolidays = holidays.filter(h => h.date === this.filterDate);
            filtered = filtered.concat(matchingHolidays);
        } else {
            // If no date is selected, exclude all holidays
            // (holidays only show when their date is selected)
        }
        
        return filtered;
    }

    filterByDate(date) {
        if (date) {
            // Convert date to YYYY-MM-DD string format to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            this.filterDate = `${year}-${month}-${day}`;
        } else {
            this.filterDate = null;
        }
        this.renderTasks();
    }

    hasTasksForDate(date) {
        // Convert date to YYYY-MM-DD string format to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return this.tasks.some(t => t.date && t.date === dateStr);
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        // Clear existing tasks
        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // Sort tasks by date and time
        const sortedTasks = this.sortTasksByDateTime(filteredTasks);

        // Render each task
        sortedTasks.forEach(task => {
            const taskItem = this.createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }

    sortTasksByDateTime(tasks) {
        return [...tasks].sort((a, b) => {
            // Holidays come first
            if (a.isHoliday && !b.isHoliday) return -1;
            if (!a.isHoliday && b.isHoliday) return 1;
            
            // Sort by date first
            if (a.date !== b.date) {
                return (a.date || '').localeCompare(b.date || '');
            }
            
            // If same date, sort by time
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            
            // Tasks with time come before tasks without time on the same date
            if (a.time && !b.time) return -1;
            if (!a.time && b.time) return 1;
            
            // If same date and no time, maintain original order
            return 0;
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        // Holidays don't have completed state
        li.className = `task-item ${!task.isHoliday && task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        // Add holiday indicator or date/time badges
        let dateBadge = null;
        let timeBadge = null;
        
        if (task.isHoliday) {
            dateBadge = document.createElement('div');
            dateBadge.className = 'task-date-badge holiday-badge';
            dateBadge.textContent = '🎉 Holiday';
        } else if (task.date) {
            // Parse date string (YYYY-MM-DD) to avoid timezone issues
            const [year, month, day] = task.date.split('-').map(Number);
            const taskDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const isToday = task.date === todayStr;
            const isPast = task.date < todayStr;
            
            dateBadge = document.createElement('div');
            dateBadge.className = 'task-date-badge';
            if (isToday) {
                dateBadge.classList.add('today');
                dateBadge.textContent = 'Today';
            } else if (isPast) {
                dateBadge.classList.add('past');
                dateBadge.textContent = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                dateBadge.textContent = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            
            // Add time badge if time is set
            if (task.time) {
                timeBadge = document.createElement('div');
                timeBadge.className = 'task-time-badge';
                // Format time to 12-hour format
                const [hours, minutes] = task.time.split(':');
                const hour12 = parseInt(hours) % 12 || 12;
                const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                timeBadge.textContent = `${hour12}:${minutes} ${ampm}`;
            }
        }

        // Checkbox - don't show for holiday tasks
        let checkbox = null;
        if (!task.isHoliday) {
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
        }

        // Task text or input
        const textContainer = document.createElement('div');
        textContainer.className = 'task-text-container';
        textContainer.style.flex = '1';

        if (this.editingId === task.id) {
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.className = 'task-text editing';
            editInput.value = task.text;
            editInput.addEventListener('blur', () => {
                this.saveEdit(task.id, editInput.value);
            });
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit(task.id, editInput.value);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
            // Focus the input
            setTimeout(() => editInput.focus(), 0);
            textContainer.appendChild(editInput);
        } else {
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            textContainer.appendChild(taskText);
        }

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        if (this.editingId === task.id) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'task-btn save-btn';
            saveBtn.textContent = 'Save';
            saveBtn.addEventListener('click', () => {
                const input = textContainer.querySelector('.editing');
                this.saveEdit(task.id, input.value);
            });
            actions.appendChild(saveBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'task-btn edit-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => this.cancelEdit());
            actions.appendChild(cancelBtn);
        } else {
            // Don't show edit/delete buttons for holiday tasks
            if (!task.isHoliday) {
                const editBtn = document.createElement('button');
                editBtn.className = 'task-btn edit-btn';
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', () => this.startEdit(task.id));
                actions.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'task-btn delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this task?')) {
                        this.deleteTask(task.id);
                    }
                });
                actions.appendChild(deleteBtn);
            }
        }

        // Add holiday class to task item
        if (task.isHoliday) {
            li.classList.add('holiday-task');
        }

        // Assemble the task item
        if (checkbox) {
            li.appendChild(checkbox);
        }
        li.appendChild(textContainer);
        
        // Add badges container
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'task-badges';
        if (dateBadge) {
            badgesContainer.appendChild(dateBadge);
        }
        if (timeBadge) {
            badgesContainer.appendChild(timeBadge);
        }
        if (badgesContainer.children.length > 0) {
            li.appendChild(badgesContainer);
        }
        
        li.appendChild(actions);

        return li;
    }

    updateTaskCount() {
        const taskCount = document.getElementById('taskCount');
        // Exclude holidays from task count
        const regularTasks = this.tasks.filter(t => !t.isHoliday);
        const totalTasks = regularTasks.length;
        const activeTasks = regularTasks.filter(t => !t.completed).length;
        const completedTasks = regularTasks.filter(t => t.completed).length;

        let countText = '';
        if (totalTasks === 0) {
            countText = 'No tasks';
        } else if (totalTasks === 1) {
            countText = '1 task';
        } else {
            countText = `${totalTasks} tasks`;
        }

        if (activeTasks > 0 && completedTasks > 0) {
            countText += ` (${activeTasks} active, ${completedTasks} completed)`;
        }

        taskCount.textContent = countText;

        // Enable/disable clear completed button
        const clearBtn = document.getElementById('clearCompleted');
        clearBtn.disabled = completedTasks === 0;
    }

    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // Migrate old tasks without dates to today's date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString().split('T')[0];
                
                this.tasks = this.tasks.map(task => {
                    if (!task.date) {
                        task.date = todayStr;
                    }
                    return task;
                });
                
                this.saveTasks(); // Save migrated tasks
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    initializeHolidays() {
        // Create holidays for years 2025-2035
        const startYear = 2025;
        const endYear = 2035;
        let allHolidays = [];
        
        for (let year = startYear; year <= endYear; year++) {
            allHolidays = allHolidays.concat(this.getHolidaysForYear(year));
        }
        
        // Get existing holiday IDs to avoid duplicates
        const existingHolidayIds = new Set(
            this.tasks.filter(t => t.isHoliday).map(t => t.id)
        );
        
        // Add holidays that don't already exist
        allHolidays.forEach(holiday => {
            if (!existingHolidayIds.has(holiday.id)) {
                this.tasks.push(holiday);
            }
        });
        
        this.saveTasks();
    }

    getHolidaysForYear(year) {
        const holidays = [];
        
        // Fixed date holidays
        holidays.push({ date: `${year}-01-01`, text: "New Year's Day", isHoliday: true, completed: false, id: `holiday-${year}-01-01` });
        holidays.push({ date: `${year}-07-04`, text: "Independence Day", isHoliday: true, completed: false, id: `holiday-${year}-07-04` });
        holidays.push({ date: `${year}-12-25`, text: "Christmas Day", isHoliday: true, completed: false, id: `holiday-${year}-12-25` });
        holidays.push({ date: `${year}-11-11`, text: "Veterans Day", isHoliday: true, completed: false, id: `holiday-${year}-11-11` });
        holidays.push({ date: `${year}-10-31`, text: "Halloween", isHoliday: true, completed: false, id: `holiday-${year}-10-31` });
        holidays.push({ date: `${year}-02-14`, text: "Valentine's Day", isHoliday: true, completed: false, id: `holiday-${year}-02-14` });
        holidays.push({ date: `${year}-12-31`, text: "New Year's Eve", isHoliday: true, completed: false, id: `holiday-${year}-12-31` });
        holidays.push({ date: `${year}-03-17`, text: "St. Patrick's Day", isHoliday: true, completed: false, id: `holiday-${year}-03-17` });
        holidays.push({ date: `${year}-01-06`, text: "Epiphany", isHoliday: true, completed: false, id: `holiday-${year}-01-06` });
        holidays.push({ date: `${year}-11-01`, text: "All Saints' Day", isHoliday: true, completed: false, id: `holiday-${year}-11-01` });
        
        // Calculate variable date holidays
        holidays.push({ date: this.getMLKDay(year), text: "Martin Luther King Jr. Day", isHoliday: true, completed: false, id: `holiday-${year}-mlk` });
        holidays.push({ date: this.getPresidentsDay(year), text: "Presidents' Day", isHoliday: true, completed: false, id: `holiday-${year}-presidents` });
        holidays.push({ date: this.getMemorialDay(year), text: "Memorial Day", isHoliday: true, completed: false, id: `holiday-${year}-memorial` });
        holidays.push({ date: this.getLaborDay(year), text: "Labor Day", isHoliday: true, completed: false, id: `holiday-${year}-labor` });
        holidays.push({ date: this.getColumbusDay(year), text: "Columbus Day", isHoliday: true, completed: false, id: `holiday-${year}-columbus` });
        holidays.push({ date: this.getThanksgiving(year), text: "Thanksgiving", isHoliday: true, completed: false, id: `holiday-${year}-thanksgiving` });
        holidays.push({ date: this.getEaster(year), text: "Easter Sunday", isHoliday: true, completed: false, id: `holiday-${year}-easter` });
        holidays.push({ date: this.getGoodFriday(year), text: "Good Friday", isHoliday: true, completed: false, id: `holiday-${year}-goodfriday` });
        holidays.push({ date: this.getAshWednesday(year), text: "Ash Wednesday", isHoliday: true, completed: false, id: `holiday-${year}-ashwednesday` });
        holidays.push({ date: this.getPalmSunday(year), text: "Palm Sunday", isHoliday: true, completed: false, id: `holiday-${year}-palmsunday` });
        holidays.push({ date: this.getMaundyThursday(year), text: "Maundy Thursday", isHoliday: true, completed: false, id: `holiday-${year}-maundythursday` });
        holidays.push({ date: this.getHolySaturday(year), text: "Holy Saturday", isHoliday: true, completed: false, id: `holiday-${year}-holysaturday` });
        holidays.push({ date: this.getAscensionDay(year), text: "Ascension Day", isHoliday: true, completed: false, id: `holiday-${year}-ascension` });
        holidays.push({ date: this.getPentecost(year), text: "Pentecost", isHoliday: true, completed: false, id: `holiday-${year}-pentecost` });
        holidays.push({ date: this.getRoshHashanah(year), text: "Rosh Hashanah", isHoliday: true, completed: false, id: `holiday-${year}-roshhashanah` });
        holidays.push({ date: this.getYomKippur(year), text: "Yom Kippur", isHoliday: true, completed: false, id: `holiday-${year}-yomkippur` });
        holidays.push({ date: this.getHanukkah(year), text: "Hanukkah (First Day)", isHoliday: true, completed: false, id: `holiday-${year}-hanukkah` });
        holidays.push({ date: this.getDiwali(year), text: "Diwali", isHoliday: true, completed: false, id: `holiday-${year}-diwali` });
        holidays.push({ date: this.getChineseNewYear(year), text: "Chinese New Year", isHoliday: true, completed: false, id: `holiday-${year}-chinesenewyear` });
        holidays.push({ date: this.getMothersDay(year), text: "Mother's Day", isHoliday: true, completed: false, id: `holiday-${year}-mothers` });
        holidays.push({ date: this.getFathersDay(year), text: "Father's Day", isHoliday: true, completed: false, id: `holiday-${year}-fathers` });
        
        return holidays;
    }

    // Calculate MLK Day (3rd Monday of January)
    getMLKDay(year) {
        const date = new Date(year, 0, 1);
        // Find first Monday
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        // Add 2 weeks to get 3rd Monday
        date.setDate(date.getDate() + 14);
        return this.formatDate(date);
    }

    // Calculate Presidents' Day (3rd Monday of February)
    getPresidentsDay(year) {
        const date = new Date(year, 1, 1);
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 14);
        return this.formatDate(date);
    }

    // Calculate Memorial Day (last Monday of May)
    getMemorialDay(year) {
        const date = new Date(year, 4, 31);
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() - 1);
        }
        return this.formatDate(date);
    }

    // Calculate Labor Day (1st Monday of September)
    getLaborDay(year) {
        const date = new Date(year, 8, 1);
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        return this.formatDate(date);
    }

    // Calculate Columbus Day (2nd Monday of October)
    getColumbusDay(year) {
        const date = new Date(year, 9, 1);
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 7);
        return this.formatDate(date);
    }

    // Calculate Thanksgiving (4th Thursday of November)
    getThanksgiving(year) {
        const date = new Date(year, 10, 1);
        while (date.getDay() !== 4) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 21);
        return this.formatDate(date);
    }

    // Calculate Easter (using simplified algorithm)
    getEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        const date = new Date(year, month - 1, day);
        return this.formatDate(date);
    }

    // Calculate Good Friday (2 days before Easter)
    getGoodFriday(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() - 2);
        return this.formatDate(easter);
    }

    // Calculate Ash Wednesday (46 days before Easter)
    getAshWednesday(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() - 46);
        return this.formatDate(easter);
    }

    // Calculate Palm Sunday (1 week before Easter)
    getPalmSunday(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() - 7);
        return this.formatDate(easter);
    }

    // Calculate Maundy Thursday (3 days before Easter)
    getMaundyThursday(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() - 3);
        return this.formatDate(easter);
    }

    // Calculate Holy Saturday (1 day before Easter)
    getHolySaturday(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() - 1);
        return this.formatDate(easter);
    }

    // Calculate Ascension Day (40 days after Easter)
    getAscensionDay(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() + 40);
        return this.formatDate(easter);
    }

    // Calculate Pentecost (50 days after Easter)
    getPentecost(year) {
        const easter = new Date(this.getEaster(year));
        easter.setDate(easter.getDate() + 50);
        return this.formatDate(easter);
    }

    // Calculate Rosh Hashanah (Jewish New Year) - simplified calculation
    getRoshHashanah(year) {
        // Rosh Hashanah typically falls in September or early October
        // Using a simplified calculation based on the Hebrew calendar
        // This is an approximation - actual dates may vary slightly
        const month = 8; // September (0-indexed)
        let day = 1;
        
        // Rough approximation: Rosh Hashanah is usually between Sept 5-Oct 5
        // Using a lookup table for years 2025-2035
        const roshHashanahDates = {
            2025: '2025-09-23',
            2026: '2026-09-12',
            2027: '2027-10-02',
            2028: '2028-09-21',
            2029: '2029-09-10',
            2030: '2030-09-28',
            2031: '2031-09-17',
            2032: '2032-10-06',
            2033: '2033-09-25',
            2034: '2034-09-14',
            2035: '2035-10-04'
        };
        
        if (roshHashanahDates[year]) {
            return roshHashanahDates[year];
        }
        
        // Fallback: approximate as September 15 for years not in lookup
        return `${year}-09-15`;
    }

    // Calculate Yom Kippur (Day of Atonement) - 10 days after Rosh Hashanah
    getYomKippur(year) {
        const roshHashanah = new Date(this.getRoshHashanah(year));
        roshHashanah.setDate(roshHashanah.getDate() + 10);
        return this.formatDate(roshHashanah);
    }

    // Calculate Hanukkah (First Day) - simplified calculation
    getHanukkah(year) {
        // Hanukkah typically falls in late November to late December
        // Using a lookup table for years 2025-2035
        const hanukkahDates = {
            2025: '2025-12-14',
            2026: '2026-12-04',
            2027: '2027-12-24',
            2028: '2028-12-12',
            2029: '2029-12-01',
            2030: '2030-12-20',
            2031: '2031-12-09',
            2032: '2032-11-28',
            2033: '2033-12-17',
            2034: '2034-12-06',
            2035: '2035-12-26'
        };
        
        if (hanukkahDates[year]) {
            return hanukkahDates[year];
        }
        
        // Fallback: approximate as December 10 for years not in lookup
        return `${year}-12-10`;
    }

    // Calculate Diwali (Hindu Festival of Lights) - simplified calculation
    getDiwali(year) {
        // Diwali typically falls in October or November
        // Using a lookup table for years 2025-2035
        const diwaliDates = {
            2025: '2025-10-20',
            2026: '2026-11-08',
            2027: '2027-10-29',
            2028: '2028-10-18',
            2029: '2029-11-05',
            2030: '2030-10-26',
            2031: '2031-11-14',
            2032: '2032-11-02',
            2033: '2033-10-22',
            2034: '2034-11-11',
            2035: '2035-10-31'
        };
        
        if (diwaliDates[year]) {
            return diwaliDates[year];
        }
        
        // Fallback: approximate as November 1 for years not in lookup
        return `${year}-11-01`;
    }

    // Calculate Chinese New Year - simplified calculation
    getChineseNewYear(year) {
        // Chinese New Year typically falls between January 21 and February 20
        // Using a lookup table for years 2025-2035
        const chineseNewYearDates = {
            2025: '2025-01-29',
            2026: '2026-02-17',
            2027: '2027-02-06',
            2028: '2028-01-26',
            2029: '2029-02-13',
            2030: '2030-02-03',
            2031: '2031-01-23',
            2032: '2032-02-11',
            2033: '2033-01-31',
            2034: '2034-02-19',
            2035: '2035-02-08'
        };
        
        if (chineseNewYearDates[year]) {
            return chineseNewYearDates[year];
        }
        
        // Fallback: approximate as February 1 for years not in lookup
        return `${year}-02-01`;
    }

    // Calculate Mother's Day (2nd Sunday of May)
    getMothersDay(year) {
        const date = new Date(year, 4, 1);
        while (date.getDay() !== 0) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 7);
        return this.formatDate(date);
    }

    // Calculate Father's Day (3rd Sunday of June)
    getFathersDay(year) {
        const date = new Date(year, 5, 1);
        while (date.getDay() !== 0) {
            date.setDate(date.getDate() + 1);
        }
        date.setDate(date.getDate() + 14);
        return this.formatDate(date);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Settings Manager
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            bgGradient1: '#1e3a8a',
            bgGradient2: '#7c3aed',
            bgGradient3: '#ec4899',
            headerColor1: '#3b82f6',
            headerColor2: '#8b5cf6',
            headerColor3: '#ec4899',
            primaryColor: '#3b82f6',
            secondaryColor: '#a855f7',
            accentColor: '#f59e0b',
            successColor: '#22c55e',
            dangerColor: '#f43f5e',
            containerBg: '#ffffff',
            containerBorder: '#ffffff'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.applySettingsOnLoad();
    }

    setupEventListeners() {
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettings = document.getElementById('closeSettings');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const applyBtn = document.getElementById('applySettings');
        const resetBtn = document.getElementById('resetSettings');

        settingsBtn.addEventListener('click', () => this.openSettings());
        closeSettings.addEventListener('click', () => this.closeSettings());
        settingsOverlay.addEventListener('click', () => this.closeSettings());
        applyBtn.addEventListener('click', () => this.applySettings());
        resetBtn.addEventListener('click', () => this.resetSettings());

        // Update preview on color change
        const colorInputs = document.querySelectorAll('.settings-content input[type="color"]');
        colorInputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    openSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        panel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        panel.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    getCurrentSettings() {
        return {
            bgGradient1: document.getElementById('bgColor1').value,
            bgGradient2: document.getElementById('bgColor2').value,
            bgGradient3: document.getElementById('bgColor3').value,
            headerColor1: document.getElementById('headerColor1').value,
            headerColor2: document.getElementById('headerColor2').value,
            headerColor3: document.getElementById('headerColor3').value,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            accentColor: document.getElementById('accentColor').value,
            successColor: document.getElementById('successColor').value,
            dangerColor: document.getElementById('dangerColor').value,
            containerBg: document.getElementById('containerBg').value,
            containerBorder: document.getElementById('containerBorder').value
        };
    }

    updatePreview() {
        const settings = this.getCurrentSettings();
        const root = document.documentElement;
        
        root.style.setProperty('--bg-gradient-1', settings.bgGradient1);
        root.style.setProperty('--bg-gradient-2', settings.bgGradient2);
        root.style.setProperty('--bg-gradient-3', settings.bgGradient3);
        root.style.setProperty('--header-color-1', settings.headerColor1);
        root.style.setProperty('--header-color-2', settings.headerColor2);
        root.style.setProperty('--header-color-3', settings.headerColor3);
        root.style.setProperty('--primary-color', settings.primaryColor);
        root.style.setProperty('--secondary-color', settings.secondaryColor);
        root.style.setProperty('--accent-color', settings.accentColor);
        root.style.setProperty('--success-color', settings.successColor);
        root.style.setProperty('--danger-color', settings.dangerColor);
        root.style.setProperty('--container-bg', settings.containerBg);
        root.style.setProperty('--container-border', settings.containerBorder);
    }

    applySettings() {
        const settings = this.getCurrentSettings();
        this.saveSettings(settings);
        this.updatePreview();
        this.closeSettings();
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            this.loadDefaultSettings();
            this.applySettings();
        }
    }

    loadDefaultSettings() {
        document.getElementById('bgColor1').value = this.defaultSettings.bgGradient1;
        document.getElementById('bgColor2').value = this.defaultSettings.bgGradient2;
        document.getElementById('bgColor3').value = this.defaultSettings.bgGradient3;
        document.getElementById('headerColor1').value = this.defaultSettings.headerColor1;
        document.getElementById('headerColor2').value = this.defaultSettings.headerColor2;
        document.getElementById('headerColor3').value = this.defaultSettings.headerColor3;
        document.getElementById('primaryColor').value = this.defaultSettings.primaryColor;
        document.getElementById('secondaryColor').value = this.defaultSettings.secondaryColor;
        document.getElementById('accentColor').value = this.defaultSettings.accentColor;
        document.getElementById('successColor').value = this.defaultSettings.successColor;
        document.getElementById('dangerColor').value = this.defaultSettings.dangerColor;
        document.getElementById('containerBg').value = this.defaultSettings.containerBg;
        document.getElementById('containerBorder').value = this.defaultSettings.containerBorder;
    }

    saveSettings(settings) {
        try {
            localStorage.setItem('themeSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('themeSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                document.getElementById('bgColor1').value = settings.bgGradient1 || this.defaultSettings.bgGradient1;
                document.getElementById('bgColor2').value = settings.bgGradient2 || this.defaultSettings.bgGradient2;
                document.getElementById('bgColor3').value = settings.bgGradient3 || this.defaultSettings.bgGradient3;
                document.getElementById('headerColor1').value = settings.headerColor1 || this.defaultSettings.headerColor1;
                document.getElementById('headerColor2').value = settings.headerColor2 || this.defaultSettings.headerColor2;
                document.getElementById('headerColor3').value = settings.headerColor3 || this.defaultSettings.headerColor3;
                document.getElementById('primaryColor').value = settings.primaryColor || this.defaultSettings.primaryColor;
                document.getElementById('secondaryColor').value = settings.secondaryColor || this.defaultSettings.secondaryColor;
                document.getElementById('accentColor').value = settings.accentColor || this.defaultSettings.accentColor;
                document.getElementById('successColor').value = settings.successColor || this.defaultSettings.successColor;
                document.getElementById('dangerColor').value = settings.dangerColor || this.defaultSettings.dangerColor;
                document.getElementById('containerBg').value = settings.containerBg || this.defaultSettings.containerBg;
                document.getElementById('containerBorder').value = settings.containerBorder || this.defaultSettings.containerBorder;
            } else {
                this.loadDefaultSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.loadDefaultSettings();
        }
    }

    applySettingsOnLoad() {
        const settings = this.getCurrentSettings();
        const root = document.documentElement;
        
        root.style.setProperty('--bg-gradient-1', settings.bgGradient1);
        root.style.setProperty('--bg-gradient-2', settings.bgGradient2);
        root.style.setProperty('--bg-gradient-3', settings.bgGradient3);
        root.style.setProperty('--header-color-1', settings.headerColor1);
        root.style.setProperty('--header-color-2', settings.headerColor2);
        root.style.setProperty('--header-color-3', settings.headerColor3);
        root.style.setProperty('--primary-color', settings.primaryColor);
        root.style.setProperty('--secondary-color', settings.secondaryColor);
        root.style.setProperty('--accent-color', settings.accentColor);
        root.style.setProperty('--success-color', settings.successColor);
        root.style.setProperty('--danger-color', settings.dangerColor);
        root.style.setProperty('--container-bg', settings.containerBg);
        root.style.setProperty('--container-border', settings.containerBorder);
    }
}

// Notepad Manager
class NotepadManager {
    constructor() {
        this.notes = {};
        this.currentDate = null;
        this.init();
    }

    init() {
        this.loadAllNotes();
        this.setupEventListeners();
        
        // Load today's note by default
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.loadNoteForDate(today);
    }

    setupEventListeners() {
        const textarea = document.getElementById('notepadTextarea');
        const clearBtn = document.getElementById('clearNote');

        // Auto-save on input (with debounce)
        let saveTimeout;
        textarea.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveCurrentNote();
            }, 500);
        });

        // Clear note button
        clearBtn.addEventListener('click', () => {
            if (this.currentDate && confirm('Are you sure you want to clear this note?')) {
                this.clearCurrentNote();
            }
        });
    }

    getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateDisplay(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    loadNoteForDate(date) {
        this.currentDate = new Date(date);
        this.currentDate.setHours(0, 0, 0, 0);
        
        const dateStr = this.getDateString(this.currentDate);
        const textarea = document.getElementById('notepadTextarea');
        const dateDisplay = document.getElementById('notepadDateDisplay');
        
        // Update date display
        dateDisplay.textContent = this.formatDateDisplay(this.currentDate);
        
        // Load note for this date
        const note = this.notes[dateStr] || '';
        textarea.value = note;
        
        // Show saved indicator briefly
        this.showSavedIndicator();
    }

    saveCurrentNote() {
        if (!this.currentDate) return;
        
        const dateStr = this.getDateString(this.currentDate);
        const textarea = document.getElementById('notepadTextarea');
        
        this.notes[dateStr] = textarea.value;
        this.saveAllNotes();
        this.showSavedIndicator();
        
        // Refresh calendar to update note indicators
        if (window.taskTracker && window.taskTracker.calendar) {
            window.taskTracker.calendar.refresh();
        }
    }

    clearCurrentNote() {
        if (!this.currentDate) return;
        
        const dateStr = this.getDateString(this.currentDate);
        const textarea = document.getElementById('notepadTextarea');
        
        this.notes[dateStr] = '';
        textarea.value = '';
        this.saveAllNotes();
        
        // Refresh calendar to update note indicators
        if (window.taskTracker && window.taskTracker.calendar) {
            window.taskTracker.calendar.refresh();
        }
    }

    showSavedIndicator() {
        const indicator = document.getElementById('noteSavedIndicator');
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    saveAllNotes() {
        try {
            localStorage.setItem('notepadNotes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    loadAllNotes() {
        try {
            const saved = localStorage.getItem('notepadNotes');
            if (saved) {
                this.notes = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = {};
        }
    }

    getNoteForDate(date) {
        const dateStr = this.getDateString(date);
        return this.notes[dateStr] || '';
    }

    hasNoteForDate(date) {
        const dateStr = this.getDateString(date);
        return this.notes[dateStr] && this.notes[dateStr].trim().length > 0;
    }
}

// Clock Manager
class ClockManager {
    constructor() {
        this.currentTimezone = 'local';
        this.clockInterval = null;
        this.stopwatchInterval = null;
        this.stopwatchTime = 0;
        this.stopwatchRunning = false;
        this.lapCount = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
    }

    setupEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.clock-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Timezone selector
        const timezoneSelect = document.getElementById('timezoneSelect');
        timezoneSelect.addEventListener('change', (e) => {
            this.currentTimezone = e.target.value;
            this.updateClock();
        });

        // Stopwatch controls
        document.getElementById('stopwatchStart').addEventListener('click', () => this.startStopwatch());
        document.getElementById('stopwatchPause').addEventListener('click', () => this.pauseStopwatch());
        document.getElementById('stopwatchLap').addEventListener('click', () => this.addLap());
        document.getElementById('stopwatchReset').addEventListener('click', () => this.resetStopwatch());
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.clock-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.clock-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tab === 'clock') {
            document.getElementById('clockTab').classList.add('active');
        } else {
            document.getElementById('stopwatchTab').classList.add('active');
        }
    }

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const clockTime = document.getElementById('clockTime');
        const clockDate = document.getElementById('clockDate');
        const clockTimezone = document.getElementById('clockTimezone');

        try {
            let timeFormatter, dateFormatter, tzName;

            if (this.currentTimezone === 'local') {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                clockTime.textContent = `${hours}:${minutes}:${seconds}`;

                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                clockDate.textContent = now.toLocaleDateString('en-US', options);
                clockTimezone.textContent = 'Local Time';
            } else {
                // Format time
                timeFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: this.currentTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });

                // Format date
                dateFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: this.currentTimezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const now = new Date();
                const timeStr = timeFormatter.format(now);
                const dateStr = dateFormatter.format(now);

                clockTime.textContent = timeStr;
                clockDate.textContent = dateStr;

                // Get timezone name from select option
                const select = document.getElementById('timezoneSelect');
                const selectedOption = select.options[select.selectedIndex];
                tzName = selectedOption.text.split('(')[0].trim();
                clockTimezone.textContent = tzName;
            }
        } catch (error) {
            console.error('Error updating clock:', error);
            // Fallback to local time
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockTime.textContent = `${hours}:${minutes}:${seconds}`;
            clockDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            clockTimezone.textContent = 'Local Time';
        }
    }

    startStopwatch() {
        if (!this.stopwatchRunning) {
            this.stopwatchRunning = true;
            const startTime = Date.now() - this.stopwatchTime;
            
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime = Date.now() - startTime;
                this.updateStopwatchDisplay();
            }, 10);

            document.getElementById('stopwatchStart').disabled = true;
            document.getElementById('stopwatchPause').disabled = false;
            document.getElementById('stopwatchLap').disabled = false;
        }
    }

    pauseStopwatch() {
        if (this.stopwatchRunning) {
            this.stopwatchRunning = false;
            clearInterval(this.stopwatchInterval);
            
            document.getElementById('stopwatchStart').disabled = false;
            document.getElementById('stopwatchPause').disabled = true;
            document.getElementById('stopwatchLap').disabled = true;
        }
    }

    resetStopwatch() {
        this.pauseStopwatch();
        this.stopwatchTime = 0;
        this.lapCount = 0;
        this.updateStopwatchDisplay();
        
        // Clear laps
        const lapsContainer = document.getElementById('stopwatchLaps');
        lapsContainer.innerHTML = '';
        
        document.getElementById('stopwatchStart').disabled = false;
        document.getElementById('stopwatchLap').disabled = true;
    }

    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatchDisplay');
        const totalSeconds = Math.floor(this.stopwatchTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((this.stopwatchTime % 1000) / 10);

        display.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }

    addLap() {
        this.lapCount++;
        const lapsContainer = document.getElementById('stopwatchLaps');
        const lapItem = document.createElement('div');
        lapItem.className = 'stopwatch-lap-item';
        
        const lapTime = this.formatLapTime(this.stopwatchTime);
        lapItem.innerHTML = `
            <span class="stopwatch-lap-number">Lap ${this.lapCount}</span>
            <span class="stopwatch-lap-time">${lapTime}</span>
        `;
        
        lapsContainer.insertBefore(lapItem, lapsContainer.firstChild);
    }

    formatLapTime(time) {
        const totalSeconds = Math.floor(time / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((time % 1000) / 10);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    }
}

// Initialize the task tracker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskTracker = new TaskTracker();
    new SettingsManager();
    window.notepadManager = new NotepadManager();
    new ClockManager();
});

