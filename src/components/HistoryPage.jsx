import { useState } from 'react';
import { Clock, Utensils, CalendarDays, Inbox, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './HistoryPage.css';

const HistoryPage = ({ entries }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  });

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
          <div className="entries-list">
            {filteredEntries.map((entry, idx) => (
              <div 
                key={entry.id} 
                className="entry-card glass-panel"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="entry-time">
                  <Clock size={16} />
                  <span>{entry.timeStr}</span>
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
        )}

      </div>
    </div>
  );
};

export default HistoryPage;
