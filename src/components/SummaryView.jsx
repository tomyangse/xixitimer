import React from 'react';
import { useData } from '../context/DataContext';

export default function SummaryView() {
    const { state, deleteLog } = useData();

    // Group logs by date
    // For MVP, just showing "Today" vs "History" or simple list?
    // Let's do "Today's Summary" and then a list of recent logs.

    const todayStr = new Date().toISOString().split('T')[0];

    const todaysLogs = state.logs.filter(l => l.dateStr === todayStr);

    // Calculate totals by activity for today
    const totals = {};
    let totalRewardTime = 0;

    todaysLogs.forEach(log => {
        if (!totals[log.activityId]) totals[log.activityId] = 0;
        totals[log.activityId] += log.duration;
        if (log.earnedReward) {
            totalRewardTime += log.earnedReward;
        }
    });

    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    // Helper to render icon (image or emoji)
    const renderIcon = (icon) => {
        if (icon && icon.startsWith('/assets/')) {
            return <img src={icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px', verticalAlign: 'middle', marginRight: '5px' }} />;
        }
        return <span style={{ marginRight: '5px' }}>{icon}</span>;
    };

    return (
        <div className="summary-section">
            {totalRewardTime > 0 && (
                <div className="reward-banner">
                    <h3>🎉 Total Roblox Time Earned: {formatDuration(totalRewardTime)}</h3>
                </div>
            )}
            <h3>Today's Summary ({todayStr})</h3>
            {Object.keys(totals).length === 0 && <p className="empty-text">No activities yet today.</p>}

            <div className="summary-totals">
                {Object.entries(totals).map(([actId, duration]) => {
                    const activity = state.activities.find(a => a.id === actId);
                    if (!activity) return null; // Activity deleted?
                    return (
                        <div key={actId} className="summary-pill" style={{ backgroundColor: activity.color }}>
                            <span>{renderIcon(activity.icon)}{activity.name}</span>
                            <strong>{formatDuration(duration)}</strong>
                        </div>
                    );
                })}
            </div>

            <h4>Recent Logs</h4>
            <div className="logs-list">
                {[...state.logs].reverse().slice(0, 10).map(log => {
                    const activity = state.activities.find(a => a.id === log.activityId);
                    if (!activity) return null;
                    return (
                        <div key={log.id} className="log-item">
                            <span>{renderIcon(activity.icon)}{activity.name}</span>
                            <span>{formatDuration(log.duration)}</span>
                            <span className="log-date">{log.dateStr}</span>
                            <button className="small-delete" onClick={() => {
                                if (confirm('Delete this entry?')) deleteLog(log.id);
                            }}>×</button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
