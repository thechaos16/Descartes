import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import FoodTracker from './components/FoodTracker';
import HistoryPage from './components/HistoryPage';
import { PlusCircle, List, LogOut } from 'lucide-react';
import './App.css';

function Navigation({ session }) {
  const location = useLocation();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <PlusCircle size={18} /> Add Entry
          </Link>
          <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
            <List size={18} /> History
          </Link>
        </div>
        <div className="nav-user">
          {avatarUrl && <img src={avatarUrl} alt="Avatar" className="user-avatar" />}
          <span className="user-name">{userName}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
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
              <Route path="/history" element={<HistoryPage entries={entries} />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
