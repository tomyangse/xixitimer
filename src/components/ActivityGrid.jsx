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

    const getCardImage = (index) => {
        const images = [
            '/assets/card_knit_blue.png',
            '/assets/card_knit_brown.png',
            '/assets/card_knit_green.png'
        ];
        return images[index % images.length];
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
                    <div
                        key={activity.id}
                        className={`knit-card-container ${isActive ? 'animate-pop' : ''}`}
                        onClick={() => handleCardClick(activity.id)}
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: '100% 100%', /* Stretch to fill completely */
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        {/* Checkmark Badge if Active */}
                        {isActive && (
                            <div className="active-badge">✅</div>
                        )}

                        {/* Icon Badge (Now absolutely positioned by CSS) */}
                        <div className="card-icon-patch">
                            {activity.icon}
                        </div>

                        <div className="knit-card-content">
                            <div className="card-title-shadow">{activity.name}</div>

                            <div className="card-time-pill">
                                {formatDuration(duration)}
                            </div>

                            {/* Recessed Energy Bar */}
                            <div className="energy-bar-track">
                                <div className="energy-bar-fill">
                                    ⚡⚡⚡
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Empty State */}
            {state.activities.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8d6e63', padding: '40px', background: 'rgba(255,255,255,0.6)', borderRadius: '24px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>暂无活动，请点击下方按钮添加！</p>
                </div>
            )}
        </div>
    );
}
