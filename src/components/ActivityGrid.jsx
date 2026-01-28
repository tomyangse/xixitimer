import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';

export default function ActivityGrid() {
    const { t } = useTranslation();
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

    // Fallback background images for activities without custom icons
    const getCardImage = (activity, index) => {
        // If activity has a custom icon image, use it as background
        if (activity.icon && activity.icon.startsWith('/assets/card_')) {
            return activity.icon;
        }
        // Fallback to default knit patterns
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

                const bgImage = getCardImage(activity, index);

                return (
                    <div
                        key={activity.id}
                        className={`knit-card-container ${isActive ? 'animate-pop' : ''}`}
                        onClick={() => handleCardClick(activity.id)}
                        style={{
                            backgroundImage: `url(${bgImage})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        {/* Checkmark Badge if Active */}
                        {isActive && (
                            <div className="active-badge">✅</div>
                        )}

                        <div className="knit-card-content">
                            <div className="card-title-shadow">{activity.name}</div>

                            <div className="card-time-label">
                                {t('activity.today')}：{formatDuration(duration)}
                            </div>

                            {/* Recessed Energy Bar / Weekly Goal */}
                            <div className="energy-bar-track">
                                {activity.isGoalEnabled ? (
                                    <div className="energy-bar-fill" style={{ width: '100%', justifyContent: 'flex-start', paddingLeft: '8px' }}>
                                        <span style={{ fontSize: '0.9rem', marginRight: '4px' }}>⚡</span>
                                        {Array.from({ length: Math.max(activity.weeklyGoalSessions || 3, 1) }).map((_, i) => {
                                            // Calculate completed sessions for this week
                                            const today = new Date();
                                            const day = today.getDay();
                                            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
                                            const monday = new Date(today.setDate(diff));
                                            monday.setHours(0, 0, 0, 0);

                                            // Filter logs for this week and this activity
                                            const weekLogs = state.logs.filter(l => {
                                                const lDate = new Date(l.startTime);
                                                return l.activityId === activity.id && lDate >= monday;
                                            });
                                            const completedCount = weekLogs.length;

                                            const isFilled = i < completedCount;
                                            return (
                                                <span key={i} style={{
                                                    color: isFilled ? '#ffeb3b' : 'rgba(255,255,255,0.3)',
                                                    textShadow: isFilled ? '0 0 5px rgba(255, 235, 59, 0.5)' : 'none',
                                                    fontSize: '1rem',
                                                    marginRight: '1px'
                                                }}>★</span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="energy-bar-fill">
                                        {/* Show multiplier if no goal set, or keep static stars? User asked to "let these stars be dynamic", implies replacing them. 
                                            If no goal, maybe just show multiplier text? 
                                            Let's show multiplier with a lightning bolt.
                                         */}
                                        <span style={{ fontSize: '0.9rem' }}>⚡</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginLeft: '4px', color: '#ffeb3b' }}>
                                            x{activity.rewardMultiplier || 1}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Empty State */}
            {state.activities.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8d6e63', padding: '40px', background: 'rgba(255,255,255,0.6)', borderRadius: '24px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{t('activity.noActivities')}</p>
                </div>
            )}
        </div>
    );
}
