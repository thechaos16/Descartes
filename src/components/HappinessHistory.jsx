import { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  Smile, 
  CalendarDays, 
  Inbox, 
  Search,
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
  Sun,
  ChevronLeft,
  ChevronRight
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

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
};

const HappinessHistory = ({ entries, onDeleteEntry, onUpdateEntry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Calendar states
  const [navDate, setNavDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Pagination state (infinite scroll)
  const [visibleCount, setVisibleCount] = useState(15);

  // Today date state (lazy initializer to satisfy react purity check)
  const [todayDateStr] = useState(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  });

  // Edit / Delete states
  const [editingEntry, setEditingEntry] = useState(null);
  const [editMoment, setEditMoment] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gesture refs
  const pressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const observerRef = useRef(null);

  const categories = [
    { id: 'work', label: 'Work & Learning', icon: Briefcase, colorVar: 'var(--label-work)' },
    { id: 'social', label: 'Relationships & Social', icon: Users, colorVar: 'var(--label-social)' },
    { id: 'leisure', label: 'Hobbies & Leisure', icon: Gamepad, colorVar: 'var(--label-leisure)' },
    { id: 'health', label: 'Self-Care & Health', icon: Sparkles, colorVar: 'var(--label-health)' },
    { id: 'nature', label: 'Nature & Environment', icon: Sun, colorVar: 'var(--label-nature)' },
    { id: 'other', label: 'Other Joy', icon: Smile, colorVar: 'var(--label-other)' },
  ];

  const getCategoryDetails = (catId) => {
    return categories.find(c => c.id === catId) || {
      id: 'other',
      label: 'Other Joy',
      icon: Smile,
      colorVar: 'var(--label-other)'
    };
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.moment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.date.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesCalendar = !selectedCalendarDate || entry.date === selectedCalendarDate;
    return matchesSearch && matchesCategory && matchesCalendar;
  });

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 15, filteredEntries.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = observerRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [filteredEntries.length]);

  // Calendar logic helpers
  const getCalendarGridRange = () => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = [];
    
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
    
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        dateStr: `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }
    
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
    setSelectedCalendarDate(todayStr);
    setVisibleCount(15);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditMoment(entry.moment);
    setEditDate(entry.date);
    setEditCategory(entry.category || 'other');
    setShowDeleteConfirm(false);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editMoment.trim() || !editingEntry) return;
    
    const timeStr = '23:30';
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarGrid = getCalendarGridRange();

  // Group entries by date for calendar indicators
  const entriesMap = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const displayedEntries = filteredEntries.slice(0, visibleCount);

  return (
    <div className="history-wrapper">
      <div className="history-container wide-layout">
        
        <div className="history-header">
          <CalendarDays size={32} color="var(--accent-secondary)" className="header-icon" />
          <h2>Your Happiness Log</h2>
          <p className="subtitle">Look back on moments of joy.</p>
        </div>

        <div className="history-layout-container">
          
          {/* Left Column: Calendar Panel */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="nav-arrow-btn" onClick={handlePrevMonth} title="Previous Month">
                <ChevronLeft size={18} />
              </button>
              <span className="month-label">
                {monthNames[navDate.getMonth()]} {navDate.getFullYear()}
              </span>
              <button className="nav-arrow-btn" onClick={handleNextMonth} title="Next Month">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <div key={i} className="grid-weekday-header">{day}</div>
              ))}

              {calendarGrid.map((cell) => {
                const dayEntries = entriesMap[cell.dateStr] || [];
                const isSelected = cell.dateStr === selectedCalendarDate;
                const isToday = cell.dateStr === todayDateStr;
                
                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => {
                      setSelectedCalendarDate(prev => prev === cell.dateStr ? null : cell.dateStr);
                      setVisibleCount(15);
                    }}
                    className={`grid-day-cell ${cell.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <span className="day-number">{cell.dayNum}</span>
                    
                    {dayEntries.length > 0 && (
                      <div className="calendar-dots">
                        {dayEntries.slice(0, 3).map((entry) => {
                          const cat = getCategoryDetails(entry.category);
                          return (
                            <span 
                              key={entry.id} 
                              className="calendar-dot" 
                              style={{ backgroundColor: cat.colorVar }}
                              title={entry.moment}
                            />
                          );
                        })}
                        {dayEntries.length > 3 && <span className="calendar-dot-more">+</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="calendar-footer">
              <button className="btn-today" onClick={handleGoToToday}>
                Today
              </button>
              {selectedCalendarDate && (
                <button className="btn-clear-selection" onClick={() => {
                  setSelectedCalendarDate(null);
                  setVisibleCount(15);
                }}>
                  Clear selection
                </button>
              )}
            </div>
          </div>

          {/* Right Column: List View Panel */}
          <div className="list-section">
            <div className="history-toolbar glass-panel">
              <div className="search-box">
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search happy moments..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(15);
                  }}
                  className="search-input"
                />
              </div>
              <div className="filter-select-wrapper">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setVisibleCount(15);
                  }}
                  className="category-filter-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCalendarDate && (
              <div className="filter-banner glass-panel">
                <span>Showing joy from <strong>{formatDateStr(selectedCalendarDate)}</strong></span>
                <button className="clear-filter-btn" onClick={() => {
                  setSelectedCalendarDate(null);
                  setVisibleCount(15);
                }}>
                  Show All Days
                </button>
              </div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="empty-state animate-fade-in">
                <Inbox size={48} color="var(--text-muted)" />
                <h3>No moments logged</h3>
                <p>
                  {searchQuery.trim() !== '' || categoryFilter !== 'all' || selectedCalendarDate
                    ? "No matching entries found for your search."
                    : "You haven't logged any happy moments yet. Go to the Record page to start!"}
                </p>
              </div>
            ) : (
              <>
                <div className="history-tip">
                  <span>Tip: Click or long-press a row to edit or delete</span>
                </div>
                <div className="table-wrapper glass-panel">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Moment</th>
                        <th className="actions-header"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedEntries.map((entry, idx) => {
                        const cat = getCategoryDetails(entry.category);
                        const CategoryIcon = cat.icon;
                        return (
                          <tr 
                            key={entry.id} 
                            className="table-row"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            onMouseDown={(e) => handleStart(e, entry)}
                            onTouchStart={(e) => handleStart(e, entry)}
                            onMouseMove={handleMove}
                            onTouchMove={handleMove}
                            onMouseUp={handleEnd}
                            onTouchEnd={handleEnd}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            <td className="col-date">
                              <div className="date-cell">
                                <span className="date-text">{formatDateStr(entry.date)}</span>
                                {entry.timeStr && (
                                  <span className="time-subtext">
                                    <Clock size={10} style={{ marginRight: '3px' }} />
                                    {formatTimeStr(entry.timeStr)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="col-category">
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
                            </td>
                            <td className="col-text">
                              <span className="moment-text">{entry.moment}</span>
                            </td>
                            <td className="col-actions">
                              <button 
                                className="card-menu-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(entry);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                id={`edit-btn-${entry.id}`}
                                onTouchStart={(e) => e.stopPropagation()}
                                title="Edit or Delete"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredEntries.length > visibleCount && (
                  <div ref={observerRef} className="infinite-scroll-sentinel">
                    <div className="spinner-small"></div>
                    <span>Loading more moments...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
                      {/* eslint-disable-next-line no-unused-vars */}
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
