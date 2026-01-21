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
                    <div className="timer-icon-badge">
                        <div className="icon-main">⭐</div>
                        <div className="knitted-bar gold"></div>
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
