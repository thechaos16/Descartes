import { useState } from 'react';
import { Clock, Utensils, Tag, PlusCircle, Calendar } from 'lucide-react';
import './FoodTracker.css';

const FoodTracker = ({ onAddEntry }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [food, setFood] = useState('');
  const [labels, setLabels] = useState([]);

  const allLabels = [
    { id: 'breakfast', label: 'Breakfast', colorVar: 'var(--label-breakfast)' },
    { id: 'lunch', label: 'Lunch', colorVar: 'var(--label-lunch)' },
    { id: 'dinner', label: 'Dinner', colorVar: 'var(--label-dinner)' },
    { id: 'snack', label: 'Snack', colorVar: 'var(--label-snack)' },
  ];

  const toggleLabel = (id) => {
    setLabels(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!food.trim()) return;
    
    // Create the entry
    const timeStr = `${hour}:${minute}`;
    const newEntry = {
      id: Date.now().toString(),
      date,
      timeStr,
      food: food.trim(),
      labels,
      timestamp: new Date()
    };
    
    if (onAddEntry) onAddEntry(newEntry);
    
    // Clear the form
    setFood('');
    setLabels([]);
  };

  return (
    <div className="tracker-wrapper">
      <div className="glass-panel tracker-card">
        <div className="tracker-header">
          <div className="icon-wrapper">
            <Utensils size={24} color="var(--accent-primary)" />
          </div>
          <h2>Log Your Meal</h2>
          <p className="subtitle">Track what you eat throughout the day.</p>
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
                {Array.from({length: 60}, (_, i) => i).map(m => {
                  const val = m.toString().padStart(2, '0');
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

          <div className="form-group">
            <label htmlFor="food-input">
              <Utensils size={16} /> What did you eat?
            </label>
            <input 
              id="food-input"
              type="text" 
              className="input-field" 
              placeholder="e.g. Avocado Toast with Poached Eggs"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} /> Labels
            </label>
            <div className="labels-container">
              {allLabels.map(({ id, label, colorVar }) => {
                const isSelected = labels.includes(id);
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
                    onClick={() => toggleLabel(id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary submit-btn"
            disabled={!food.trim()}
          >
            <PlusCircle size={18} /> Add Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default FoodTracker;
