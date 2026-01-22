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
          你好! <span className="weather-icon">⛅</span>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️</button>
      </header>

      <main className="main-content">
        {currentView === 'home' && (
          <>
            <ActivityGrid />
            {/* Leather Patch Reward Section Moved to Bottom/Main */}
            <div className="reward-section">
              <div className="reward-info">
                <h3>⭐ My Reward</h3>
                <div className="reward-total">
                  {formatDuration(totalRewardTime)} <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>({rewardName})</span>
                </div>
              </div>
              <div className="reward-coin">®️</div>
            </div>
          </>
        )}

        {currentView === 'stats' && <StatsView />}

        {currentView === 'me' && (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#8d6e63' }}>
            <h2>User Profile</h2>
            <p>Logged in as: {session.user.email}</p>
            <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '20px', padding: '10px 20px' }}>
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
