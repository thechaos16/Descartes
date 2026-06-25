import { useState } from 'react';
import { Clock, Smile, Tag, PlusCircle, Calendar, Briefcase, Users, Gamepad, Sparkles, Sun } from 'lucide-react';
import './HappinessTracker.css';

const getInitialTime = () => {
  const now = new Date();
  let h = now.getHours();
  let m = Math.round(now.getMinutes() / 10) * 10;
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return {
    hour: h.toString().padStart(2, '0'),
    minute: m.toString().padStart(2, '0'),
  };
};

const getInitialDate = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
};

const HappinessTracker = ({ onAddEntry }) => {
  const initialTime = getInitialTime();
  const [date, setDate] = useState(getInitialDate());
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [moment, setMoment] = useState('');
  const [category, setCategory] = useState('other');

  const categories = [
    { id: 'work', label: 'Work & Learning', icon: Briefcase, colorVar: 'var(--label-work)' },
    { id: 'social', label: 'Relationships & Social', icon: Users, colorVar: 'var(--label-social)' },
    { id: 'leisure', label: 'Hobbies & Leisure', icon: Gamepad, colorVar: 'var(--label-leisure)' },
    { id: 'health', label: 'Self-Care & Health', icon: Sparkles, colorVar: 'var(--label-health)' },
    { id: 'nature', label: 'Nature & Environment', icon: Sun, colorVar: 'var(--label-nature)' },
    { id: 'other', label: 'Other Joy', icon: Smile, colorVar: 'var(--label-other)' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!moment.trim()) return;
    
    const timeStr = `${hour}:${minute}`;
    const newEntry = {
      id: Date.now().toString(),
      date,
      timeStr,
      moment: moment.trim(),
      category,
      timestamp: new Date()
    };
    
    if (onAddEntry) onAddEntry(newEntry);
    
    // Clear the form except date and category
    setMoment('');
  };

  return (
    <div className="tracker-wrapper">
      <div className="glass-panel tracker-card animate-fade-in">
        <div className="tracker-header">
          <div className="icon-wrapper happiness-icon-wrapper">
            <Smile size={24} color="var(--accent-primary)" />
          </div>
          <h2>Capture Your Happiness</h2>
          <p className="subtitle">Log the happiest moment of your day.</p>
        </div>

        <form onSubmit={handleSubmit} className="tracker-form">
          <div className="form-group-row">
            <div className="form-group flex-1">
              <label>
                <Calendar size={16} /> Date
              </label>
              <input 
                type="date" 
                className="input-field date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-2">
              <label>
                <Clock size={16} /> Time
              </label>
              <div className="time-picker-row">
                <select 
                  className="time-block"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                >
                  {Array.from({length: 24}, (_, i) => i).map(h => {
                    const val = h.toString().padStart(2, '0');
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
                <span className="time-separator">:</span>
                <select 
                  className="time-block"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
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
            <label htmlFor="moment-input">
              <Smile size={16} /> What made you happy?
            </label>
            <textarea 
              id="moment-input"
              className="input-field textarea-field" 
              placeholder="e.g. Took a long walk in the park during lunchtime and saw the cherry blossoms in full bloom."
              value={moment}
              onChange={(e) => setMoment(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} /> Category
            </label>
            <div className="categories-grid">
              {categories.map(({ id, label, icon: IconComponent, colorVar }) => {
                const isSelected = category === id;
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
                    onClick={() => setCategory(id)}
                  >
                    <IconComponent size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary submit-btn"
            disabled={!moment.trim()}
          >
            <PlusCircle size={18} /> Record Moment
          </button>
        </form>
      </div>
    </div>
  );
};

export default HappinessTracker;
