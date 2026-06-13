import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Inbox,
  BookOpen
} from 'lucide-react';
import './BookmarksPage.css';

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      console.error('Error fetching bookmarks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRead = async (id, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from('bookmarks')
        .update({ is_read: nextStatus })
        .eq('id', id);

      if (error) throw error;
      setBookmarks(prev => 
        prev.map(b => b.id === id ? { ...b, is_read: nextStatus } : b)
      );
    } catch (err) {
      console.error('Error toggling read status:', err.message);
    }
  };

  const handleDeleteBookmark = async (id) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting bookmark:', err.message);
    }
  };

  const getHostname = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  };

  const formatSavedDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter calculations
  const totalCount = bookmarks.length;
  const unreadCount = bookmarks.filter(b => !b.is_read).length;
  const readCount = bookmarks.filter(b => b.is_read).length;

  const filteredBookmarks = bookmarks.filter(b => {
    // 1. Filter by tab selection
    if (filterType === 'unread' && b.is_read) return false;
    if (filterType === 'read' && !b.is_read) return false;

    // 2. Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = b.title && b.title.toLowerCase().includes(query);
      const urlMatch = b.url && b.url.toLowerCase().includes(query);
      return titleMatch || urlMatch;
    }

    return true;
  });

  return (
    <div className="bookmarks-wrapper">
      <div className="bookmarks-container">
        
        {/* Header */}
        <div className="bookmarks-header">
          <Bookmark size={32} color="var(--accent-primary)" className="header-icon" />
          <h2>Your Bookmarks</h2>
          <p className="subtitle">Articles, links, and resources saved for later.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="bookmarks-toolbar glass-panel">
          {/* Search Box */}
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search title or URL..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All <span className="tab-badge">{totalCount}</span>
            </button>
            <button 
              className={`filter-tab ${filterType === 'unread' ? 'active' : ''}`}
              onClick={() => setFilterType('unread')}
            >
              Unread <span className="tab-badge">{unreadCount}</span>
            </button>
            <button 
              className={`filter-tab ${filterType === 'read' ? 'active' : ''}`}
              onClick={() => setFilterType('read')}
            >
              Read <span className="tab-badge">{readCount}</span>
            </button>
          </div>
        </div>

        {/* Bookmarks Grid List */}
        {loading ? (
          <div className="bookmarks-loading-state">
            <div className="spinner"></div>
            <p>Loading bookmarks...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="bookmarks-empty-state glass-panel">
            <Inbox size={48} color="var(--text-muted)" />
            <h3>No bookmarks found</h3>
            <p>
              {searchQuery.trim() !== '' 
                ? "No matching entries found for your search." 
                : filterType === 'unread' 
                ? "All caught up! You have no unread bookmarks." 
                : filterType === 'read' 
                ? "You haven't marked any bookmarks as read yet." 
                : "Save links from your Chrome Extension to see them here!"}
            </p>
          </div>
        ) : (
          <div className="bookmarks-grid">
            {filteredBookmarks.map((bookmark, idx) => {
              const hostname = getHostname(bookmark.url);
              const savedDate = formatSavedDate(bookmark.created_at);
              
              return (
                <div 
                  key={bookmark.id} 
                  className={`bookmark-card glass-panel ${bookmark.is_read ? 'read' : 'unread'}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="card-top">
                    <span className="bookmark-domain" title={bookmark.url}>
                      {hostname}
                    </span>
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="external-link-btn"
                      title="Open page in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <h3 className="bookmark-title">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                      {bookmark.title || "Untitled Link"}
                    </a>
                  </h3>

                  <div className="card-footer">
                    <span className="bookmark-date">
                      {savedDate}
                    </span>
                    
                    <div className="bookmark-card-actions">
                      {/* Toggle Read status */}
                      <button 
                        onClick={() => handleToggleRead(bookmark.id, bookmark.is_read)}
                        className={`card-action-btn check-status-btn ${bookmark.is_read ? 'read-active' : ''}`}
                        title={bookmark.is_read ? "Mark as Unread" : "Mark as Read"}
                      >
                        {bookmark.is_read ? (
                          <CheckCircle2 size={18} color="var(--label-lunch)" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>

                      {/* Delete Bookmark */}
                      <button 
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="card-action-btn delete-bookmark-btn"
                        title="Delete Bookmark"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default BookmarksPage;
