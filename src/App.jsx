import React, { useState, useMemo } from 'react';
import { DataProvider, useData } from './context/DataContext';
import ActivityGrid from './components/ActivityGrid';
import SettingsView from './components/SettingsView';

function AppContent() {
  const { state } = useData();
  const [showSettings, setShowSettings] = useState(false);
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

  if (showSettings) {
    return <SettingsView onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="app-container">
      <header className="main-header">
        <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️</button>
        <div className="reward-banner-large">
          <div className="reward-title">{rewardName} Time</div>
          <div className="reward-time">{formatDuration(totalRewardTime)}</div>
        </div>
      </header>
      <main>
        <ActivityGrid />
      </main>
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
