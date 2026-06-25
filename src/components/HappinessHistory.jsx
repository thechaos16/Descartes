import { useState, useRef } from 'react';
import { 
  Clock, 
  Smile, 
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
  AlertTriangle,
  Briefcase,
  Users,
  Gamepad,
  Sparkles,
  Sun
} from 'lucide-react';
import './HappinessHistory.css';

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

const HappinessHistory = ({ entries, onDeleteEntry, onUpdateEntry }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  });

  // Edit / Delete states
  const [editingEntry, setEditingEntry] = useState(null);
  const [editMoment, setEditMoment] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHour, setEditHour] = useState('12');
  const [editMinute, setEditMinute] = useState('00');
  const [editCategory, setEditCategory] = useState('other');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gesture refs
  const pressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const categories = [
    { id: 'work', label: 'Work & Learning', icon: Briefcase, colorVar: 'var(--label-work)' },
    { id: 'social', label: 'Relationships & Social', icon: Users, colorVar: 'var(--label-social)' },
    { id: 'leisure', label: 'Hobbies & Leisure', icon: Gamepad, colorVar: 'var(--label-leisure)' },
    { id: 'health', label: 'Self-Care & Health', icon: Sparkles, colorVar: 'var(--label-health)' },
    { id: 'nature', label: 'Nature & Environment', icon: Sun, colorVar: 'var(--label-nature)' },
    { id: 'other', label: 'Other Joy', icon: Smile, colorVar: 'var(--label-other)' },
  ];

  const navigateDays = (days) => {
    const d = new Date(selectedDate);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setDate(d.getDate() + days);
    
    const tzOffset = d.getTimezoneOffset() * 60000;
    const newDateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const formattedDisplayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { 
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
  });

  const filteredEntries = entries.filter(e => e.date === selectedDate);

  const getCategoryDetails = (catId) => {
    return categories.find(c => c.id === catId) || {
      id: 'other',
      label: 'Other Joy',
      icon: Smile,
      colorVar: 'var(--label-other)'
    };
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditMoment(entry.moment);
    setEditDate(entry.date);
    const { hour, minute } = parseTimeStr(entry.timeStr);
    setEditHour(hour);
    setEditMinute(minute);
    setEditCategory(entry.category || 'other');
    setShowDeleteConfirm(false);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editMoment.trim() || !editingEntry) return;
    
    const timeStr = `${editHour}:${editMinute}`;
    await onUpdateEntry(editingEntry.id, {
      date: editDate,
      timeStr,
      moment: editMoment.trim(),
      category: editCategory
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
        window.navigator.vibrate(50);
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
          <CalendarDays size={32} color="var(--accent-secondary)" className="header-icon" />
          <h2>Your Happiness Log</h2>
          <p className="subtitle">Look back on moments of joy.</p>
        </div>

        <div className="date-navigator glass-panel">
          <button className="date-nav-btn" onClick={() => navigateDays(-1)}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="current-date-display">
            <Calendar size={18} color="var(--accent-secondary)" />
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
          <div className="empty-state animate-fade-in">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No moments logged</h3>
            <p>Did anything make you smile on this day? Try adding a memory!</p>
          </div>
        ) : (
          <>
            <div className="history-tip">
              <span>Tip: Long-press any card to edit or delete</span>
            </div>
            <div className="entries-list">
              {filteredEntries.map((entry, idx) => {
                const cat = getCategoryDetails(entry.category);
                const CategoryIcon = cat.icon;
                return (
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
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="Edit or Delete"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    
                    <div className="entry-details">
                      <h3 className="entry-moment">
                        <Smile size={18} color="var(--accent-secondary)" style={{ flexShrink: 0 }} />
                        <span>{entry.moment}</span>
                      </h3>
                      
                      <div className="entry-labels">
                        <span 
                          className="history-label-chip"
                          style={{
                            '--label-color': cat.colorVar,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderColor: 'var(--label-color)',
                            color: 'var(--label-color)'
                          }}
                        >
                          <CategoryIcon size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Edit / Delete Modal */}
      {editingEntry && (
        <div className="modal-backdrop" onClick={() => setEditingEntry(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Happy Moment</h3>
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
                  <p className="subtitle">Are you sure you want to delete this moment? This action cannot be undone.</p>
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
                  <div className="form-group-row">
                    <div className="form-group flex-1">
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

                    <div className="form-group flex-2">
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
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-moment-input">
                      <Smile size={14} /> What made you happy?
                    </label>
                    <textarea 
                      id="modal-moment-input"
                      className="input-field textarea-field" 
                      value={editMoment}
                      onChange={(e) => setEditMoment(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Tag size={14} /> Category
                    </label>
                    <div className="categories-grid">
                      {categories.map(({ id, label, icon: IconComponent, colorVar }) => {
                        const isSelected = editCategory === id;
                        return (
                          <button
                            type="button"
                            key={id}
                            className={`category-chip ${isSelected ? 'selected' : ''}`}
                            style={{
                              '--cat-color': colorVar,
                              backgroundColor: isSelected ? 'var(--cat-color)' : 'rgba(255,255,255,0.02)',
                              color: isSelected ? '#000' : 'var(--text-secondary)',
                              borderColor: isSelected ? 'var(--cat-color)' : 'var(--border-color)',
                            }}
                            onClick={() => setEditCategory(id)}
                          >
                            <IconComponent size={12} />
                            <span>{label}</span>
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
                        disabled={!editMoment.trim()}
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

export default HappinessHistory;
