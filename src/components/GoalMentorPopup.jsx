import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { getGoalMentorAdvice } from '../geminiClient';
import { speak } from '../ttsClient';

export default function GoalMentorPopup({ onClose }) {
    const { state } = useData();
    const { activities, logs } = state;

    const [loading, setLoading] = useState(true);
    const [advice, setAdvice] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const loadAdvice = async () => {
            // Calculate week boundaries
            const now = new Date();
            const dayOfWeekNum = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeekNum === 0 ? 6 : dayOfWeekNum - 1));
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            // Filter activities with goals
            const goalActivities = activities.filter(a => a.isGoalEnabled && a.weeklyGoalSessions > 0);

            if (goalActivities.length === 0) {
                setLoading(false);
                return;
            }

            // Calculate progress for each goal activity
            const progress = goalActivities.map(activity => {
                // Get this week's logs for this activity
                const weekLogs = logs.filter(log => {
                    const logDate = new Date(log.dateStr);
                    return log.activityId === activity.id &&
                        logDate >= monday &&
                        logDate <= sunday;
                });

                // Count sessions (each log entry = 1 session)
                const completedSessions = weekLogs.length;

                // Total duration in minutes
                const totalMinutes = Math.floor(weekLogs.reduce((sum, log) => sum + log.duration, 0) / 60000);

                // Target
                const targetSessions = activity.weeklyGoalSessions;
                const targetMinutesPerSession = activity.goalDurationMinutes;
                const targetTotalMinutes = targetSessions * targetMinutesPerSession;

                return {
                    name: activity.name,
                    icon: activity.icon,
                    completedSessions,
                    targetSessions,
                    totalMinutes,
                    targetTotalMinutes,
                    progressPercent: Math.min(100, Math.round((completedSessions / targetSessions) * 100))
                };
            });

            setProgressData(progress);

            // Generate goals data string for AI
            const goalsDataStr = progress.map(p =>
                `- ${p.name}: 目标每周${p.targetSessions}次（每次${Math.round(p.targetTotalMinutes / p.targetSessions)}分钟），已完成${p.completedSessions}次，共${p.totalMinutes}分钟`
            ).join('\n');

            // Get day info
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayOfWeek = dayNames[now.getDay()];
            const daysLeft = 7 - (dayOfWeekNum === 0 ? 7 : dayOfWeekNum);
            const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;

            // Call Gemini API
            const result = await getGoalMentorAdvice(goalsDataStr, dateStr, dayOfWeek, daysLeft);
            setAdvice(result);
            setLoading(false);

            // Auto-play voice when advice is ready
            if (result) {
                const text = `${result.summary} ${result.suggestion} ${result.encouragement}`;
                // Pre-load audio but don't force play if browser blocks it
                const audio = await speak(text);
                if (audio) {
                    audioRef.current = audio;
                    try {
                        await audio.play();
                        setIsSpeaking(true);
                        audio.onended = () => setIsSpeaking(false);
                    } catch (e) {
                        console.log("Auto-play blocked by browser, waiting for user interaction");
                        setIsSpeaking(false); // Play failed, so not speaking
                    }
                }
            }
        };

        loadAdvice();
    }, [activities, logs]);

    // Helper to render activity icon
    const renderIcon = (icon) => {
        if (icon && icon.startsWith('/assets/')) {
            return <img src={icon} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '6px' }} />;
        }
        return <span>{icon}</span>;
    };

    // Handle voice playback
    const handleSpeak = async () => {
        if (!advice) return;

        if (isSpeaking && audioRef.current) {
            audioRef.current.pause();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        const text = `${advice.summary} ${advice.suggestion} ${advice.encouragement}`;
        const audio = await speak(text);

        if (audio) {
            audioRef.current = audio;
            try {
                await audio.play();
                audio.onended = () => setIsSpeaking(false);
            } catch (e) {
                console.error("Playback failed:", e);
                setIsSpeaking(false);
            }
        } else {
            setIsSpeaking(false);
        }
    };

    return (
        <div className="mentor-popup-overlay">
            <div className="mentor-popup animate-pop">
                <div className="mentor-header">
                    <span className="mentor-avatar">🧸</span>
                    <h2>小智导师</h2>
                    {advice && (
                        <button
                            className={`mentor-voice-btn ${isSpeaking ? 'speaking' : ''}`}
                            onClick={handleSpeak}
                            title={isSpeaking ? '停止播放' : '语音播放'}
                        >
                            {isSpeaking ? '🔊' : '🔈'}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="mentor-loading">
                        <div className="loading-spinner"></div>
                        <p>正在分析你的目标进度...</p>
                    </div>
                ) : progressData.length === 0 ? (
                    <div className="mentor-no-goals">
                        <p>还没有设置任何目标哦！</p>
                        <p>去"我的设置"中为活动设置周目标吧 🎯</p>
                    </div>
                ) : (
                    <>
                        {/* Progress Section */}
                        <div className="mentor-progress-section">
                            <h3>📊 本周进度</h3>
                            {progressData.map((item, idx) => (
                                <div key={idx} className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-icon">{renderIcon(item.icon)}</span>
                                        <span className="progress-name">{item.name}</span>
                                        <span className="progress-count">{item.completedSessions}/{item.targetSessions}次</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${item.progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI Advice Section */}
                        {advice && (
                            <div className="mentor-advice-section">
                                <div className="advice-card summary">
                                    <span className="advice-emoji">📋</span>
                                    <p>{advice.summary}</p>
                                </div>
                                <div className="advice-card suggestion">
                                    <span className="advice-emoji">💡</span>
                                    <p>{advice.suggestion}</p>
                                </div>
                                <div className="advice-card encouragement">
                                    <span className="advice-emoji">💪</span>
                                    <p>{advice.encouragement}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button className="mentor-close-btn" onClick={onClose}>
                    开始今天的学习！
                </button>
            </div>
        </div>
    );
}
