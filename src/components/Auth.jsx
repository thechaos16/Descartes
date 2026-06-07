import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn } from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div>
          <h2>Welcome to Descartes</h2>
          <p className="subtitle">Sign in to sync your personal log securely.</p>
        </div>
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn-primary auth-btn"
        >
          <LogIn size={20} />
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
