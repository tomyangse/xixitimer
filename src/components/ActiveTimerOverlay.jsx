import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

export default function ActiveTimerOverlay() {
    const { state, stopActivity } = useData();
    const { activeSession, activities } = state;
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!activeSession) return null;

    const activity = activities.find(a => a.id === activeSession.activityId);
    if (!activity) return null;

    const duration = now - activeSession.startTime;

    // Format H:MM:SS
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => n.toString().padStart(2, '0');
        if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        return `${pad(minutes)}:${pad(seconds)}`;
    };

    return (
        <div className="timer-overlay">
            <div className="timer-content animate-pop">

                {/* Icons Row */}
                <div className="timer-icons-row">
                    <div className="timer-icon-badge">
                        <div className="icon-main">{activity.icon}</div>
                        <div className="knitted-bar"></div>
                    </div>
                    {/* Arrow between icons */}
                    <div style={{ fontSize: '2rem', color: '#8d6e63', fontWeight: 'bold' }}>➜</div>

                    <div className="timer-icon-badge">
                        {(() => {
                            const reward = state.rewards.find(r => r.id === activity.rewardId);
                            // Fallback to default star if no specific reward linked (or reward deleted)
                            // But usually we want to show generic reward if multiplier > 0

                            if (reward) {
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="icon-main" title={reward.name}>{reward.icon}</div>
                                        <div className="knitted-bar gold"></div>
                                        <div style={{
                                            position: 'absolute',
                                            left: '110%',
                                            whiteSpace: 'nowrap',
                                            fontSize: '1rem',
                                            color: '#5d4037',
                                            fontWeight: 'bold',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {reward.name}
                                        </div>
                                    </div>
                                );
                            } else {
                                // Legacy/Default Case
                                return (
                                    <>
                                        <div className="icon-main">⭐</div>
                                        <div className="knitted-bar gold"></div>
                                    </>
                                );
                            }
                        })()}
                    </div>
                </div>

                {/* Big Wood Timer */}
                <div className="wood-timer-ring">
                    <div className="timer-glow"></div>
                    <div className="timer-display">
                        {formatTime(duration)}
                    </div>
                </div>

                <div className="timer-label">
                    Doing {activity.name}...
                </div>

                <button className="stop-btn-large" onClick={stopActivity}>
                    ⏹ Done
                </button>
            </div>
        </div>
    );
}
