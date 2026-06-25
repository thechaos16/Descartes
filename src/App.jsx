import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import FoodTracker from './components/FoodTracker';
import HistoryPage from './components/HistoryPage';
import TodoCalendar from './components/TodoCalendar';
import BookmarksPage from './components/BookmarksPage';
import HappinessTracker from './components/HappinessTracker';
import HappinessHistory from './components/HappinessHistory';
import { PlusCircle, List, LogOut, CheckSquare, Utensils, Bookmark, Smile } from 'lucide-react';
import './App.css';

function Navigation({ session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const isFoodTracker = location.pathname === '/' || location.pathname === '/history';
  const isHappinessTracker = location.pathname === '/happiness' || location.pathname === '/happiness/history';

  // Determine active tab for dropdown
  let currentTab = '/';
  if (location.pathname === '/todos') currentTab = '/todos';
  else if (location.pathname === '/bookmarks') currentTab = '/bookmarks';
  else if (location.pathname === '/happiness' || location.pathname === '/happiness/history') currentTab = '/happiness';

  return (
    <>
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-links">
            <Link 
              to="/" 
              className={`nav-link ${isFoodTracker ? 'active' : ''}`}
            >
              <Utensils size={18} /> Food Tracker
            </Link>
            <Link 
              to="/happiness" 
              className={`nav-link ${isHappinessTracker ? 'active' : ''}`}
            >
              <Smile size={18} /> Happiness
            </Link>
            <Link 
              to="/todos" 
              className={`nav-link ${location.pathname === '/todos' ? 'active' : ''}`}
            >
              <CheckSquare size={18} /> Todo List
            </Link>
            <Link 
              to="/bookmarks" 
              className={`nav-link ${location.pathname === '/bookmarks' ? 'active' : ''}`}
            >
              <Bookmark size={18} /> Bookmarks
            </Link>
          </div>

          <select 
            value={currentTab} 
            onChange={(e) => navigate(e.target.value)}
            className="nav-select"
            aria-label="Navigation menu"
          >
            <option value="/">🍽️ Food Tracker</option>
            <option value="/happiness">😊 Happiness Log</option>
            <option value="/todos">📅 Todo List</option>
            <option value="/bookmarks">🔖 Bookmarks</option>
          </select>
          <div className="nav-user">
            {avatarUrl && <img src={avatarUrl} alt="Avatar" className="user-avatar" />}
            <span className="user-name">{userName}</span>
            <button className="btn-logout" onClick={() => supabase.auth.signOut()} title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      {isFoodTracker && (
        <div className="sub-nav-bar">
          <div className="sub-nav-container">
            <Link to="/" className={`sub-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <PlusCircle size={16} /> Record
            </Link>
            <Link to="/history" className={`sub-nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
              <List size={16} /> History
            </Link>
          </div>
        </div>
      )}
      {isHappinessTracker && (
        <div className="sub-nav-bar">
          <div className="sub-nav-container">
            <Link to="/happiness" className={`sub-nav-link ${location.pathname === '/happiness' ? 'active' : ''}`}>
              <PlusCircle size={16} /> Record
            </Link>
            <Link to="/happiness/history" className={`sub-nav-link ${location.pathname === '/happiness/history' ? 'active' : ''}`}>
              <List size={16} /> History
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [happinessEntries, setHappinessEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
          fetchEntries(false),
          fetchHappinessEntries(false)
        ]);
        setLoading(false);
      };
      loadAllData();
    } else {
      setEntries([]);
      setHappinessEntries([]);
      setLoading(false);
    }
  }, [session]);

  const fetchEntries = async (shouldSetLoading = true) => {
    try {
      if (shouldSetLoading) setLoading(true);
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedData = (data || []).map(row => ({
        id: row.id,
        date: row.date,
        timeStr: row.time_str,
        food: row.food,
        labels: row.labels,
        createdAt: row.created_at
      }));
      setEntries(formattedData);
    } catch (error) {
      console.error('Error fetching entries:', error.message);
    } finally {
      if (shouldSetLoading) setLoading(false);
    }
  };

  const fetchHappinessEntries = async (shouldSetLoading = true) => {
    try {
      if (shouldSetLoading) setLoading(true);
      const { data, error } = await supabase
        .from('happiness')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedData = (data || []).map(row => ({
        id: row.id,
        date: row.date,
        timeStr: row.time_str,
        moment: row.moment,
        category: row.category,
        createdAt: row.created_at
      }));
      setHappinessEntries(formattedData);
    } catch (error) {
      console.error('Error fetching happiness entries:', error.message);
    } finally {
      if (shouldSetLoading) setLoading(false);
    }
  };

  const addEntry = async (entry) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .insert([{
          date: entry.date,
          time_str: entry.timeStr,
          food: entry.food,
          labels: entry.labels
        }]);

      if (error) throw error;
      fetchEntries(true);
    } catch (error) {
      console.error('Error adding entry:', error.message);
      alert('Failed to add entry.');
    }
  };

  const deleteEntry = async (id) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEntries(true);
    } catch (error) {
      console.error('Error deleting entry:', error.message);
      alert('Failed to delete entry.');
    }
  };

  const updateEntry = async (id, updatedEntry) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .update({
          date: updatedEntry.date,
          time_str: updatedEntry.timeStr,
          food: updatedEntry.food,
          labels: updatedEntry.labels
        })
        .eq('id', id);

      if (error) throw error;
      fetchEntries(true);
    } catch (error) {
      console.error('Error updating entry:', error.message);
      alert('Failed to update entry.');
    }
  };

  const addHappinessEntry = async (entry) => {
    try {
      const { error } = await supabase
        .from('happiness')
        .insert([{
          date: entry.date,
          time_str: entry.timeStr,
          moment: entry.moment,
          category: entry.category
        }]);

      if (error) throw error;
      fetchHappinessEntries(true);
    } catch (error) {
      console.error('Error adding happiness entry:', error.message);
      alert('Failed to add happiness entry.');
    }
  };

  const deleteHappinessEntry = async (id) => {
    try {
      const { error } = await supabase
        .from('happiness')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchHappinessEntries(true);
    } catch (error) {
      console.error('Error deleting happiness entry:', error.message);
      alert('Failed to delete happiness entry.');
    }
  };

  const updateHappinessEntry = async (id, updatedEntry) => {
    try {
      const { error } = await supabase
        .from('happiness')
        .update({
          date: updatedEntry.date,
          time_str: updatedEntry.timeStr,
          moment: updatedEntry.moment,
          category: updatedEntry.category
        })
        .eq('id', id);

      if (error) throw error;
      fetchHappinessEntries(true);
    } catch (error) {
      console.error('Error updating happiness entry:', error.message);
      alert('Failed to update happiness entry.');
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation session={session} />
        <main className="main-content">
          {loading ? (
            <div className="loading-state">Loading your data...</div>
          ) : (
            <Routes>
              <Route path="/" element={<FoodTracker onAddEntry={addEntry} />} />
              <Route path="/history" element={<HistoryPage entries={entries} onDeleteEntry={deleteEntry} onUpdateEntry={updateEntry} />} />
              <Route path="/happiness" element={<HappinessTracker onAddEntry={addHappinessEntry} />} />
              <Route path="/happiness/history" element={<HappinessHistory entries={happinessEntries} onDeleteEntry={deleteHappinessEntry} onUpdateEntry={updateHappinessEntry} />} />
              <Route path="/todos" element={<TodoCalendar />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
