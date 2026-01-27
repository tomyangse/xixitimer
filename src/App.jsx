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



  return (
    <div className="app-container">
      {/* Active Timer Overlay */}
      <ActiveTimerOverlay />

      <header className="app-header">
        <div className="header-title">
          你好, {displayName || '朋友'}! <span className="weather-icon">⛅</span>
        </div>
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
                  {/* Fallback for unallocated time */}
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

        {currentView === 'me' && <SettingsView />}
      </main>

      {/* Mockup Bottom Navigation */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          <img
            src="/assets/icon_nav_home.png"
            alt="Home"
            style={{
              width: '40px',
              height: '40px',
              marginBottom: '-5px',
              filter: currentView === 'home' ? 'none' : 'grayscale(100%) opacity(0.6)'
            }}
          />
          <span style={{ marginTop: '4px' }}>主页</span>
        </div>
        <div
          className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          <img
            src="/assets/icon_nav_stats.png"
            alt="Stats"
            style={{
              width: '40px',
              height: '40px',
              marginBottom: '-5px',
              filter: currentView === 'stats' ? 'none' : 'grayscale(100%) opacity(0.6)'
            }}
          />
          <span style={{ marginTop: '4px' }}>统计</span>
        </div>
        <div
          className={`nav-item ${currentView === 'me' ? 'active' : ''}`}
          onClick={() => setCurrentView('me')}
        >
          <img
            src="/assets/icon_nav_user.png"
            alt="Me"
            style={{
              width: '40px',
              height: '40px',
              marginBottom: '-5px',
              filter: currentView === 'me' ? 'none' : 'grayscale(100%) opacity(0.6)'
            }}
          />
          <span style={{ marginTop: '4px' }}>我的</span>
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
