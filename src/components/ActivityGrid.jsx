import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function ActivityGrid() {
    const { state, startActivity, stopActivity, deleteActivity } = useData();
    const [now, setNow] = React.useState(Date.now());

    const activeId = state.activeSession?.activityId;

    // Tick every second if active
    React.useEffect(() => {
        let interval;
        if (activeId) {
            interval = setInterval(() => setNow(Date.now()), 1000);
        }
        return () => clearInterval(interval);
    }, [activeId]);

    // Calculate today's duration for each activity
    const activityDurations = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const map = {};
        state.logs.forEach(log => {
            if (log.dateStr !== todayStr) return;
            if (!map[log.activityId]) map[log.activityId] = 0;
            map[log.activityId] += log.duration;
        });
        return map;
    }, [state.logs]);

    const formatDuration = (ms) => {
        if (!ms) return '0m';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const displayMinutes = minutes % 60;
        const displaySeconds = totalSeconds % 60;

        if (hours > 0) return `${hours}h ${displayMinutes}m`;
        // Show seconds if active to give feedback
        return `${minutes}m ${displaySeconds}s`;
    };

    const handleCardClick = (id) => {
        if (activeId === id) {
            stopActivity();
        } else {
            startActivity(id);
        }
    };

    return (
        <div className="activity-grid-container-child">
            <div className="activity-grid-child">
                {state.activities.map(activity => {
                    const isActive = activeId === activity.id;
                    let duration = activityDurations[activity.id] || 0;

                    // Add current session time if active
                    if (isActive && state.activeSession) {
                        duration += (now - state.activeSession.startTime);
                    }

                    return (
                        <div
                            key={activity.id}
                            className={`activity-card-child ${isActive ? 'active-pulse' : ''}`}
                            style={{
                                backgroundColor: activity.color,
                                border: isActive ? '4px solid #333' : 'none'
                            }}
                            onClick={() => handleCardClick(activity.id)}
                        >
                            <div className="activity-icon-child">{activity.icon}</div>
                            <div className="activity-info-child">
                                <div className="activity-name-child">{activity.name}</div>
                                <div className="activity-time-child">
                                    {formatDuration(duration)}
                                </div>
                            </div>
                            {isActive && <div className="running-badge">Running...</div>}
                        </div>
                    );
                })}
                {state.activities.length === 0 && <p className="empty-text">Ask parents to add activities in Settings!</p>}
            </div>
        </div>
    );
}
