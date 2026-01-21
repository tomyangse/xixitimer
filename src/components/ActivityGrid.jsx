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
        <div className="activity-grid">
            {state.activities.map((activity, index) => {
                const isActive = activeId === activity.id;
                let duration = activityDurations[activity.id] || 0;

                // Add current session time if active
                if (isActive && state.activeSession) {
                    duration += (now - state.activeSession.startTime);
                }

                return (
                    <button
                        key={activity.id}
                        className={`stitched-card card-color-${index % 5} ${isActive ? 'animate-pop' : ''}`}
                        onClick={() => handleCardClick(activity.id)}
                    >
                        <div className="card-icon">{activity.icon}</div>
                        <div className="card-title">{activity.name}</div>
                        <div className="card-time">Today: {formatDuration(duration)}</div>

                        {/* Progress Slot Visual */}
                        <div className="progress-slot">
                            <div
                                className="progress-fill"
                                style={{
                                    width: isActive ? '100%' : '0%',
                                    opacity: isActive ? 1 : 0,
                                    transition: 'width 2s linear' // Fake progress for visual feedback
                                }}
                            />
                        </div>
                        {isActive && <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>⚡ Active</div>}
                    </button>
                );
            })}
            {state.activities.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                    <p>No activities yet!</p>
                    <p>Tap ⚙️ to add some.</p>
                </div>
            )}
        </div>
    );
}
