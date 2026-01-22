import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function StatsView() {
    const { state } = useData();
    const { logs, activities } = state;

    const dailyStats = useMemo(() => {
        const stats = {};
        // Copy and sort logs by start time descending (newest first)
        const sortedLogs = [...logs].sort((a, b) => b.startTime - a.startTime);

        sortedLogs.forEach(log => {
            const date = log.dateStr; // YYYY-MM-DD
            if (!stats[date]) {
                stats[date] = {};
            }
            if (!stats[date][log.activityId]) {
                stats[date][log.activityId] = 0;
            }
            stats[date][log.activityId] += log.duration;
        });
        return stats;
    }, [logs]);

    const getActivity = (id) => activities.find(a => a.id === id);

    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const dates = Object.keys(dailyStats);

    return (
        <div className="stats-container animate-fade-in">
            <div className="stats-header">
                <h2>📝 History</h2>
            </div>

            <div className="stats-list">
                {dates.length === 0 && (
                    <div className="empty-state">
                        No activities yet. Start playing! 🎈
                    </div>
                )}

                {dates.map((date) => {
                    const activitiesMap = dailyStats[date];
                    const dayTotal = Object.values(activitiesMap).reduce((a, b) => a + b, 0);

                    return (
                        <div key={date} className="daily-card">
                            <div className="daily-header">
                                <span className="date-label">{formatDate(date)}</span>
                                <span className="day-total-badge">{formatDuration(dayTotal)}</span>
                            </div>
                            <div className="paper-lines">
                                {Object.entries(activitiesMap).map(([actId, duration]) => {
                                    const activity = getActivity(parseInt(actId));
                                    if (!activity) return null;
                                    return (
                                        <div key={actId} className="stat-row">
                                            <div className="stat-info">
                                                <span className="stat-icon">{activity.icon}</span>
                                                <span className="stat-name">{activity.name}</span>
                                            </div>
                                            <span className="stat-time">{formatDuration(duration)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
