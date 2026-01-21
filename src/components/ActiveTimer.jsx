import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';

export default function ActiveTimer() {
    const { state, stopActivity } = useData();
    const [elapsed, setElapsed] = useState(0);

    const { activeSession } = state;

    useEffect(() => {
        let interval;
        if (activeSession) {
            // Update every second
            const update = () => {
                const now = Date.now();
                setElapsed(now - activeSession.startTime);
            };
            update(); // Initial call
            interval = setInterval(update, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    if (!activeSession) return null;

    const activity = state.activities.find(a => a.id === activeSession.activityId);
    if (!activity) return null;

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="active-timer-overlay">
            <div className="timer-card" style={{ borderColor: activity.color }}>
                <div className="timer-icon">{activity.icon}</div>
                <h2>{activity.name}</h2>
                {activity.rewardMultiplier > 1 && (
                    <div className="timer-badge" style={{ color: activity.color }}>
                        🎁 Earning x{activity.rewardMultiplier} Reward!
                    </div>
                )}
                <div className="time-display">{formatTime(elapsed)}</div>
                <button className="stop-btn" onClick={stopActivity}>
                    Stop ⏹️
                </button>
            </div>
        </div>
    );
}
