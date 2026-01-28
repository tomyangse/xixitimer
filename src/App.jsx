import React, { useState, useMemo, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import ActivityGrid from './components/ActivityGrid';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';
import ActiveTimerOverlay from './components/ActiveTimerOverlay';
import StatsView from './components/StatsView';
import GoalMentorPopup from './components/GoalMentorPopup';
import { supabase } from './supabaseClient';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

function AppContent() {
  const { t } = useTranslation();
  const { state } = useData();
  const [session, setSession] = useState(null);

  // ... (keep useEffects and state logic same)

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
  const [showMentor, setShowMentor] = useState(false);

  // Check if we should show mentor popup (on every page load if goals exist)
  useEffect(() => {
    if (session && state.activities.length > 0) {
      const hasGoals = state.activities.some(a => a.isGoalEnabled && a.weeklyGoalSessions > 0);
      if (hasGoals) {
        setShowMentor(true);
      }
    }
  }, [session, state.activities]);

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

      {/* Goal Mentor Popup */}
      {showMentor && (
        <GoalMentorPopup onClose={() => setShowMentor(false)} />
      )}

      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title">
          {t('app.greeting')}, {displayName || 'Friend'}! <span className="weather-icon">⛅</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="main-content">
        {currentView === 'home' && (
          <>
            <ActivityGrid />
            <div className="reward-section">
              <div className="reward-info" style={{ width: '100%' }}>
                <h3 style={{ marginBottom: '10px' }}>⭐ {t('settings.manageRewards')}</h3>

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
          <span style={{ marginTop: '4px' }}>{t('nav.timer')}</span>
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
          <span style={{ marginTop: '4px' }}>{t('nav.stats')}</span>
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
          <span style={{ marginTop: '4px' }}>{t('nav.settings')}</span>
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
