import React, { useState, useMemo, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import ActivityGrid from './components/ActivityGrid';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';
import ActiveTimerOverlay from './components/ActiveTimerOverlay';
import StatsView from './components/StatsView';
import { supabase } from './supabaseClient';

function AppContent() {
  const { state } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [session, setSession] = useState(null);

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

  const todaysLogs = state.logs.filter(l => l.dateStr === new Date().toISOString().split('T')[0]);

  // Calculate Total Reward Time
  const totalRewardTime = useMemo(() => {
    return todaysLogs.reduce((acc, log) => acc + (log.earnedReward || 0), 0);
  }, [state.logs, todaysLogs]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const rewardName = state.settings?.rewardName || 'Reward';

  const [currentView, setCurrentView] = useState('home');
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setDisplayName(session.user.user_metadata.full_name);
      setEditingName(session.user.user_metadata.full_name);
    }
  }, [session]);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: editingName }
    });

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setDisplayName(editingName);
      alert('Profile updated! ✨');
    }
    setIsUpdatingProfile(false);
  };

  if (!session) {
    return <Auth />;
  }

  if (showSettings) {
    return <SettingsView onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="app-container">
      {/* Active Timer Overlay */}
      <ActiveTimerOverlay />

      <header className="app-header">
        <div className="header-title">
          你好, {displayName || '朋友'}! <span className="weather-icon">⛅</span>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️</button>
      </header>

      <main className="main-content">
        {currentView === 'home' && (
          <>
            <ActivityGrid />
            {/* Leather Patch Reward Section Moved to Bottom/Main */}
            {/* Leather Patch Reward Section Moved to Bottom/Main */}
            <div className="reward-section">
              <div className="reward-info" style={{ width: '100%' }}>
                <h3 style={{ marginBottom: '10px' }}>⭐ My Rewards</h3>

                {/* Reward Balances List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.rewards.map(reward => {
                    const rewardTotal = todaysLogs
                      .filter(log => log.rewardId === reward.id)
                      .reduce((acc, log) => acc + (log.earnedReward || 0), 0);

                    if (rewardTotal === 0) return null; // Optional: Hide zero balances

                    return (
                      <div key={reward.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '1.2rem', color: '#faedcd' }}>{reward.icon} {reward.name}</span>
                        <span className="reward-total" style={{ fontSize: '1.5rem' }}>
                          {formatDuration(rewardTotal)}
                        </span>
                      </div>
                    );
                  })}
                  {/* Fallback for unallocated time or if no rewards defined yet */}
                  {state.rewards.length === 0 && (
                    <div className="reward-total">
                      {formatDuration(totalRewardTime)} <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>({rewardName})</span>
                    </div>
                  )}
                </div>
              </div>
              {/* <div className="reward-coin">®️</div> Removed coin to make space for list */}
            </div>
          </>
        )}

        {currentView === 'stats' && <StatsView />}

        {currentView === 'me' && (
          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            color: '#8d6e63',
            background: 'white',
            padding: '40px 20px',
            borderRadius: '24px',
            boxShadow: '0 4px 6px rgba(93, 64, 55, 0.1)'
          }}>
            <h2 style={{ marginBottom: '30px' }}>User Profile</h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <div style={{ width: '100%', maxWidth: '300px', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Display Name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Enter your name (e.g. Felicia)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid #e6ccb2',
                    fontSize: '1rem',
                    fontFamily: 'Nunito'
                  }}
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
                className="animate-pop"
                style={{
                  background: '#a7c957',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #7cb342'
                }}
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Name'}
              </button>
            </div>

            <p style={{ opacity: 0.7, marginBottom: '30px' }}>Logged in as: {session.user.email}</p>

            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                marginTop: '10px',
                padding: '10px 25px',
                background: '#ef5350',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 0 #c62828'
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Mockup Bottom Navigation */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div
          className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          <span className="nav-icon">📊</span>
          <span>Stats</span>
        </div>
        <div
          className={`nav-item ${currentView === 'me' ? 'active' : ''}`}
          onClick={() => setCurrentView('me')}
        >
          <span className="nav-icon">👤</span>
          <span>Me</span>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
