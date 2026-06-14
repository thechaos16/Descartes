import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import FoodTracker from './components/FoodTracker';
import HistoryPage from './components/HistoryPage';
import TodoCalendar from './components/TodoCalendar';
import BookmarksPage from './components/BookmarksPage';
import { PlusCircle, List, LogOut, CheckSquare, Utensils, Bookmark } from 'lucide-react';
import './App.css';

function Navigation({ session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const isFoodTracker = location.pathname === '/' || location.pathname === '/history';

  // Determine active tab for dropdown
  let currentTab = '/';
  if (location.pathname === '/todos') currentTab = '/todos';
  else if (location.pathname === '/bookmarks') currentTab = '/bookmarks';

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
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
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
      fetchEntries();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [session]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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
      
      // Re-fetch to guarantee sync, or optimistically update
      fetchEntries();
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
      fetchEntries();
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
      fetchEntries();
    } catch (error) {
      console.error('Error updating entry:', error.message);
      alert('Failed to update entry.');
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
