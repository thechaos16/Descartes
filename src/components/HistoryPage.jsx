import { useState, useRef } from 'react';
import { 
  Clock, 
  Utensils, 
  CalendarDays, 
  Inbox, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Tag, 
  MoreVertical, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import './HistoryPage.css';

const formatTimeStr = (timeStr) => {
  if (!timeStr) return '';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  
  let [_, hoursStr, minutesStr, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  ampm = ampm.toUpperCase();
  
  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
};

const parseTimeStr = (timeStr) => {
  if (!timeStr) return { hour: '12', minute: '00' };
  const standardTime = formatTimeStr(timeStr);
  const parts = standardTime.split(':');
  if (parts.length === 2) {
    let h = parseInt(parts[0], 10);
    let m = Math.round(parseInt(parts[1], 10) / 10) * 10;
    if (m === 60) {
      m = 0;
      h = (h + 1) % 24;
    }
    return { 
      hour: h.toString().padStart(2, '0'), 
      minute: m.toString().padStart(2, '0') 
    };
  }
  return { hour: '12', minute: '00' };
};

const HistoryPage = ({ entries, onDeleteEntry, onUpdateEntry }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  });

  // Edit / Delete states
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFood, setEditFood] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHour, setEditHour] = useState('12');
  const [editMinute, setEditMinute] = useState('00');
  const [editLabels, setEditLabels] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gesture refs
  const pressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const allLabels = [
    { id: 'breakfast', label: 'Breakfast', colorVar: 'var(--label-breakfast)' },
    { id: 'lunch', label: 'Lunch', colorVar: 'var(--label-lunch)' },
    { id: 'dinner', label: 'Dinner', colorVar: 'var(--label-dinner)' },
    { id: 'snack', label: 'Snack', colorVar: 'var(--label-snack)' },
  ];

  const navigateDays = (days) => {
    const d = new Date(selectedDate);
    // Add timezone offset correction since new Date(YYYY-MM-DD) uses UTC
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setDate(d.getDate() + days);
    
    // Format back to YYYY-MM-DD
    const tzOffset = d.getTimezoneOffset() * 60000;
    const newDateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const formattedDisplayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { 
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
  });

  const filteredEntries = entries.filter(e => e.date === selectedDate);
  const getLabelColor = (labelId) => {
    const colors = {
      breakfast: 'var(--label-breakfast)',
      lunch: 'var(--label-lunch)',
      dinner: 'var(--label-dinner)',
      snack: 'var(--label-snack)'
    };
    return colors[labelId] || 'var(--text-secondary)';
  };

  const getLabelName = (labelId) => {
    return labelId.charAt(0).toUpperCase() + labelId.slice(1);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditFood(entry.food);
    setEditDate(entry.date);
    const { hour, minute } = parseTimeStr(entry.timeStr);
    setEditHour(hour);
    setEditMinute(minute);
    setEditLabels(entry.labels || []);
    setShowDeleteConfirm(false);
  };

  const toggleEditLabel = (id) => {
    setEditLabels(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editFood.trim() || !editingEntry) return;
    
    const timeStr = `${editHour}:${editMinute}`;
    await onUpdateEntry(editingEntry.id, {
      date: editDate,
      timeStr,
      food: editFood.trim(),
      labels: editLabels
    });
    setEditingEntry(null);
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    await onDeleteEntry(editingEntry.id);
    setEditingEntry(null);
  };

  // Long press event handlers
  const handleStart = (e, entry) => {
    isLongPressTriggered.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50); // Haptic feedback if supported
      }
      openEditModal(entry);
    }, 600);
  };

  const handleMove = (e) => {
    if (!pressTimerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - touchStartPosRef.current.x;
    const dy = clientY - touchStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleEnd = (e) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="history-wrapper">
      <div className="history-container">
        
        <div className="history-header">
          <CalendarDays size={32} color="var(--accent-primary)" className="header-icon" />
          <h2>Your Food Log</h2>
          <p className="subtitle">Review your logged meals.</p>
        </div>

        <div className="date-navigator glass-panel">
          <button className="date-nav-btn" onClick={() => navigateDays(-1)}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="current-date-display">
            <Calendar size={18} color="var(--accent-primary)" />
            <span>{formattedDisplayDate}</span>
            <input 
              type="date"
              className="invisible-date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button className="date-nav-btn" onClick={() => navigateDays(1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No entries found</h3>
            <p>No meals were logged on this date.</p>
          </div>
        ) : (
          <>
            <div className="history-tip">
              <span>Tip: Long-press any card to edit or delete</span>
            </div>
            <div className="entries-list">
              {filteredEntries.map((entry, idx) => (
                <div 
                  key={entry.id} 
                  className="entry-card glass-panel"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onMouseDown={(e) => handleStart(e, entry)}
                  onTouchStart={(e) => handleStart(e, entry)}
                  onMouseMove={handleMove}
                  onTouchMove={handleMove}
                  onMouseUp={handleEnd}
                  onTouchEnd={handleEnd}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="entry-card-header">
                    <div className="entry-time">
                      <Clock size={14} />
                      <span>{formatTimeStr(entry.timeStr)}</span>
                    </div>
                    <button 
                      className="card-menu-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(entry);
                      }}
                      onMouseDown={(e) => e.stopPropagation()} // Prevent long-press trigger on button click
                      onTouchStart={(e) => e.stopPropagation()}
                      title="Edit or Delete"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <div className="entry-details">
                    <h3 className="entry-food">
                      <Utensils size={18} color="var(--accent-secondary)" />
                      {entry.food}
                    </h3>
                    
                    {entry.labels && entry.labels.length > 0 && (
                      <div className="entry-labels">
                        {entry.labels.map(label => (
                          <span 
                            key={label} 
                            className="history-label-chip"
                            style={{
                              '--label-color': getLabelColor(label),
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderColor: 'var(--label-color)',
                              color: 'var(--label-color)'
                            }}
                          >
                            {getLabelName(label)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Edit / Delete Modal */}
      {editingEntry && (
        <div className="modal-backdrop" onClick={() => setEditingEntry(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Logged Meal</h3>
              <button className="close-btn" onClick={() => setEditingEntry(null)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveChanges} className="modal-form">
              {showDeleteConfirm ? (
                <div className="delete-confirm-section">
                  <div className="delete-icon-wrapper">
                    <AlertTriangle size={36} color="var(--accent-secondary)" />
                  </div>
                  <h4>Delete this entry?</h4>
                  <p className="subtitle">Are you sure you want to delete this meal log? This action cannot be undone.</p>
                  <div className="confirm-buttons">
                    <button 
                      type="button" 
                      className="btn-danger"
                      onClick={handleDelete}
                    >
                      <Trash2 size={16} /> Yes, Delete
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>
                      <Calendar size={14} /> Date
                    </label>
                    <input 
                      type="date" 
                      className="input-field date-input"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Clock size={14} /> Time
                    </label>
                    <div className="time-picker-row">
                      <select 
                        className="time-block"
                        value={editHour}
                        onChange={(e) => setEditHour(e.target.value)}
                      >
                        {Array.from({length: 24}, (_, i) => i).map(h => {
                          const val = h.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                      <span className="time-separator">:</span>
                      <select 
                        className="time-block"
                        value={editMinute}
                        onChange={(e) => setEditMinute(e.target.value)}
                      >
                        {[0, 10, 20, 30, 40, 50].map(m => {
                          const val = m.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                  </div>


                  <div className="form-group">
                    <label htmlFor="modal-food-input">
                      <Utensils size={14} /> What did you eat?
                    </label>
                    <input 
                      id="modal-food-input"
                      type="text" 
                      className="input-field" 
                      value={editFood}
                      onChange={(e) => setEditFood(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Tag size={14} /> Labels
                    </label>
                    <div className="labels-container">
                      {allLabels.map(({ id, label, colorVar }) => {
                        const isSelected = editLabels.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            className={`label-chip ${isSelected ? 'selected' : ''}`}
                            style={{
                              '--label-color': colorVar,
                              backgroundColor: isSelected ? 'var(--label-color)' : 'transparent',
                              color: isSelected ? '#000' : 'var(--text-secondary)',
                              borderColor: isSelected ? 'var(--label-color)' : 'var(--border-color)',
                            }}
                            onClick={() => toggleEditLabel(id)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn-danger-outline" 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                    
                    <div className="footer-right-buttons">
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setEditingEntry(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={!editFood.trim()}
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
