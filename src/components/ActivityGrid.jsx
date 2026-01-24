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

                const bgImage = getCardImage(index);

                return (
                    <div
                        key={activity.id}
                        className={`knit-card-container ${isActive ? 'animate-pop' : ''}`}
                        onClick={() => handleCardClick(activity.id)}
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            // The image aspect ratio is roughly square or 4:3. We enforce a ratio.
                        }}
                    >
                        {/* Checkmark Badge if Active */}
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#81c784',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                ✅
                            </div>
                        )}

                        <div className="knit-card-content">
                            {/* Icon (on a little paper/leather patch style) */}
                            <div className="card-icon-patch">
                                {activity.icon}
                            </div>

                            <div className="card-title-shadow">{activity.name}</div>

                            <div className="card-time-pill">
                                今天: {formatDuration(duration)}
                            </div>

                            {/* Energy Bar (Dark pill with glowing yellow progress) */}
                            <div className="energy-bar-track">
                                <div className="energy-bar-fill">
                                    ⚡⚡⚡
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Add Button as the last item if you want it inline, OR keep it separate. 
                The design has it separate at bottom. We'll stick to separate "Add" button usually,
                but if list is empty: */}
            {state.activities.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#5d4037', padding: '40px', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
                    <p style={{ fontWeight: 'bold' }}>No activities start yet!</p>
                </div>
            )}
        </div>
    );
}
