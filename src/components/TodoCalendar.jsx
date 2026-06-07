import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Ban, 
  ListTodo,
  CheckCircle2
} from 'lucide-react';
import './TodoCalendar.css';

const TodoCalendar = () => {
  // Navigation calendar year & month state
  const [navDate, setNavDate] = useState(new Date());
  
  // Selected date string (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  });
  
  // Todos state
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTodo, setNewTodo] = useState('');

  // Fetch todos when month changes
  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navDate]);

  const getCalendarGridRange = () => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth(); // 0-indexed
    
    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = [];
    
    // 1. Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      grid.push({
        dateStr: `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }
    
    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        dateStr: `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }
    
    // 3. Next month padding (pad to fill 42 cells)
    const remainingCells = 42 - grid.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      grid.push({
        dateStr: `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }
    
    return grid;
  };

  const calendarGrid = getCalendarGridRange();

  const fetchTodos = async () => {
    try {
      setLoading(true);
      if (calendarGrid.length === 0) return;
      
      const startDate = calendarGrid[0].dateStr;
      const endDate = calendarGrid[calendarGrid.length - 1].dateStr;
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (error) throw error;
      setTodos(data || []);
    } catch (err) {
      console.error('Error fetching todos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{
          date: selectedDate,
          title: newTodo.trim(),
          status: 'pending'
        }]);

      if (error) throw error;
      setNewTodo('');
      fetchTodos();
    } catch (err) {
      console.error('Error adding todo:', err.message);
      alert('Failed to add todo.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (err) {
      console.error('Error toggling status:', err.message);
    }
  };

  const handleToggleCancel = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'cancelled' ? 'pending' : 'cancelled';
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (err) {
      console.error('Error toggling cancellation:', err.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (err) {
      console.error('Error deleting todo:', err.message);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setNavDate(today);
    
    const tzOffset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
    setSelectedDate(todayStr);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group todos by date for rendering indicators in calendar
  const todosMap = todos.reduce((acc, todo) => {
    if (!acc[todo.date]) {
      acc[todo.date] = { pending: 0, completed: 0, cancelled: 0 };
    }
    acc[todo.date][todo.status]++;
    return acc;
  }, {});

  const selectedDateTodos = todos.filter(t => t.date === selectedDate);
  const formattedDisplayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
  });

  const getTodayDateStr = () => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  };
  const todayDateStr = getTodayDateStr();

  return (
    <div className="todo-calendar-wrapper">
      <div className="todo-calendar-container">
        
        {/* Left Side: Calendar Card */}
        <div className="calendar-card glass-panel">
          <div className="calendar-header">
            <div className="header-title-row">
              <ListTodo size={24} color="var(--accent-primary)" />
              <h2>Task Calendar</h2>
            </div>
            
            <div className="month-selector">
              <button className="nav-arrow-btn" onClick={handlePrevMonth} title="Previous Month">
                <ChevronLeft size={20} />
              </button>
              <span className="month-label">
                {monthNames[navDate.getMonth()]} {navDate.getFullYear()}
              </span>
              <button className="nav-arrow-btn" onClick={handleNextMonth} title="Next Month">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <button className="btn-today" onClick={handleGoToToday}>
              Today
            </button>
          </div>

          <div className="calendar-grid">
            {/* Week Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="grid-weekday-header">{day}</div>
            ))}

            {/* Calendar Days */}
            {calendarGrid.map((cell) => {
              const hasTodos = todosMap[cell.dateStr];
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayDateStr;
              
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`grid-day-cell ${cell.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                >
                  <span className="day-number">{cell.dayNum}</span>
                  
                  {/* Indicators for tasks */}
                  {hasTodos && (
                    <div className="task-indicators">
                      {hasTodos.pending > 0 && <span className="indicator dot-pending" title={`${hasTodos.pending} pending`} />}
                      {hasTodos.completed > 0 && <span className="indicator dot-completed" title={`${hasTodos.completed} completed`} />}
                      {hasTodos.cancelled > 0 && <span className="indicator dot-cancelled" title={`${hasTodos.cancelled} cancelled`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Task List Card */}
        <div className="task-list-card glass-panel">
          <div className="task-list-header">
            <div className="task-list-title">
              <Calendar size={20} color="var(--accent-secondary)" />
              <h3>Tasks for Day</h3>
            </div>
            <p className="task-date-subtitle">{formattedDisplayDate}</p>
          </div>

          <form onSubmit={handleAddTodo} className="add-task-form">
            <input
              type="text"
              placeholder="Add a task for this day..."
              className="input-field task-input"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary add-task-btn" title="Add task">
              <Plus size={18} />
            </button>
          </form>

          <div className="tasks-container">
            {loading ? (
              <div className="todo-loading-state">Loading tasks...</div>
            ) : selectedDateTodos.length === 0 ? (
              <div className="todo-empty-state">
                <p>No tasks scheduled for this day.</p>
              </div>
            ) : (
              <div className="todo-items-list">
                {selectedDateTodos.map((todo) => {
                  const isCompleted = todo.status === 'completed';
                  const isCancelled = todo.status === 'cancelled';
                  
                  return (
                    <div 
                      key={todo.id} 
                      className={`todo-item ${isCompleted ? 'completed' : ''} ${isCancelled ? 'cancelled' : ''}`}
                    >
                      {/* Checkbox Icon / Done Toggle */}
                      <button
                        type="button"
                        className="todo-action-btn check-btn"
                        onClick={() => handleToggleStatus(todo.id, todo.status)}
                        disabled={isCancelled}
                        title={isCompleted ? "Mark Undone" : "Mark Done"}
                      >
                        {isCompleted ? (
                          <CheckSquare size={20} color="var(--label-lunch)" />
                        ) : (
                          <Square size={20} color="var(--text-muted)" />
                        )}
                      </button>

                      {/* Todo Text */}
                      <span className="todo-title-text">{todo.title}</span>

                      {/* Action buttons */}
                      <div className="todo-actions">
                        {/* Cancel Toggle */}
                        <button
                          type="button"
                          className={`todo-action-btn cancel-btn ${isCancelled ? 'active' : ''}`}
                          onClick={() => handleToggleCancel(todo.id, todo.status)}
                          title={isCancelled ? "Restore Task" : "Cancel Task"}
                        >
                          <Ban size={16} />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          className="todo-action-btn delete-btn"
                          onClick={() => handleDeleteTodo(todo.id)}
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TodoCalendar;
