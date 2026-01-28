import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';

export default function StatsView() {
    const { t, i18n } = useTranslation();
    const { state, deleteLog } = useData();
    const { logs, activities } = state;

    // Helper to get locale string for date/time formatting
    const getDateLocale = () => {
        if (i18n.language.startsWith('zh')) return 'zh-CN';
        if (i18n.language.startsWith('sv')) return 'sv-SE';
        return 'en-US';
    };

    const [weekOffset, setWeekOffset] = useState(0);
    const [expandedActivity, setExpandedActivity] = useState(null);

    // Calculate current week's Monday based on offset
    const currentWeekMonday = useMemo(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff + (weekOffset * 7));
        d.setHours(0, 0, 0, 0);
        return d; // This is a Date object
    }, [weekOffset]);

    // Generate array of date strings for the week
    const weekDates = useMemo(() => {
        const dates = [];
        const d = new Date(currentWeekMonday);
        for (let i = 0; i < 7; i++) {
            dates.push(d.toISOString().split('T')[0]);
            d.setDate(d.getDate() + 1);
        }
        return dates;
    }, [currentWeekMonday]);

    // Group logs by date and activity
    const dailyStats = useMemo(() => {
        const stats = {}; // { '2023-10-27': { 'actId1': 30000, 'actId2': 10000 } }

        // Filter logs that fall within this week
        // Optimization: We could filter logs by range first, but iterating all logs isn't too expensive for MVP
        logs.forEach(log => {
            // Simple string check if log date is in weekDates
            if (weekDates.includes(log.dateStr)) {
                if (!stats[log.dateStr]) stats[log.dateStr] = {};
                if (!stats[log.dateStr][log.activityId]) stats[log.dateStr][log.activityId] = 0;
                stats[log.dateStr][log.activityId] += log.duration;
            }
        });
        return stats;
    }, [logs, weekDates]);

    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    // Helper to render icon (image or emoji)
    const renderIcon = (icon) => {
        if (icon && icon.startsWith('/assets/')) {
            return <img src={icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px', verticalAlign: 'middle', marginRight: '5px' }} />;
        }
        return <span style={{ marginRight: '5px' }}>{icon}</span>;
    };

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr);
        // Display format: "Mon, Jan 24"
        return date.toLocaleDateString(getDateLocale(), { weekday: 'short', month: 'numeric', day: 'numeric' });
    };

    const getWeekRangeDisplay = () => {
        const start = new Date(currentWeekMonday);
        const end = new Date(currentWeekMonday);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString(getDateLocale(), { month: 'numeric', day: 'numeric' })} - ${end.toLocaleDateString(getDateLocale(), { month: 'numeric', day: 'numeric' })}`;
    };

    return (
        <div className="stats-container animate-fade-in" style={{ paddingBottom: '30px' }}>
            <div className="stats-header" style={{ marginBottom: '20px' }}>
                <h2 style={{ textAlign: 'center', color: '#5d4037', marginBottom: '10px' }}>📊 {t('stats.weeklyStats')}</h2>

                {/* Week Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '20px' }}>
                    <button
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px 15px' }}
                    >
                        ◀
                    </button>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#8d6e63' }}>
                        {getWeekRangeDisplay()}
                    </span>
                    <button
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px 15px' }}
                        disabled={weekOffset === 0} // Disable future weeks if desired, or keep enabled
                    >
                        ▶
                    </button>
                </div>
            </div>

            <div className="stats-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {weekDates.map((dateStr) => {
                    const dayStats = dailyStats[dateStr] || {};
                    const hasData = Object.keys(dayStats).length > 0;
                    const dayTotal = Object.values(dayStats).reduce((a, b) => a + b, 0);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                        <div key={dateStr} className="daily-card" style={{
                            background: isToday ? '#fff8e1' : 'white',
                            borderRadius: '16px',
                            padding: '15px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            border: isToday ? '2px solid #ffe082' : '1px solid rgba(0,0,0,0.05)'
                        }}>
                            {/* Daily Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasData ? '15px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#5d4037' }}>
                                        {formatDateDisplay(dateStr)}
                                    </span>
                                    {isToday && <span style={{ fontSize: '0.8rem', background: '#ffe082', padding: '2px 8px', borderRadius: '10px', color: '#bf360c' }}>{t('stats.today')}</span>}
                                </div>
                                {hasData && (
                                    <span style={{ fontWeight: 'bold', color: '#8d6e63', background: '#efebe9', padding: '4px 10px', borderRadius: '12px' }}>
                                        {t('stats.total')}: {formatDuration(dayTotal)}
                                    </span>
                                )}
                            </div>

                            {/* Activities List */}
                            {hasData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {Object.entries(dayStats).map(([actId, duration]) => {
                                        const activity = activities.find(a => String(a.id) === String(actId));
                                        // Handle deleted activities gracefully
                                        const activityName = activity ? activity.name : 'Unknown Activity';
                                        const activityIcon = activity ? activity.icon : '❓';

                                        // Check if this activity is currently expanded
                                        const isExpanded = expandedActivity &&
                                            expandedActivity.date === dateStr &&
                                            expandedActivity.id === actId;

                                        return (
                                            <div key={actId}>
                                                {/* Activity Row - Click to toggle expansion */}
                                                <div
                                                    onClick={() => {
                                                        if (isExpanded) {
                                                            setExpandedActivity(null);
                                                        } else {
                                                            setExpandedActivity({ date: dateStr, id: actId });
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        background: isExpanded ? '#fff3e0' : 'rgba(0,0,0,0.02)',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                        border: isExpanded ? '1px solid #ffe0b2' : '1px solid transparent'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {renderIcon(activityIcon)}
                                                        <span style={{ fontWeight: '600', color: '#5d4037' }}>{activityName}</span>
                                                        <span style={{ fontSize: '0.8rem', color: '#8d6e63', marginLeft: '5px' }}>
                                                            {isExpanded ? '▼' : '▶'}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontFamily: 'Nunito', fontWeight: 'bold', color: '#8d6e63' }}>
                                                        {formatDuration(duration)}
                                                    </span>
                                                </div>

                                                {/* Expanded Details - Log Entries */}
                                                {isExpanded && (
                                                    <div className="log-details-list" style={{
                                                        marginTop: '5px',
                                                        marginLeft: '15px',
                                                        borderLeft: '2px solid #ffe0b2',
                                                        paddingLeft: '10px'
                                                    }}>
                                                        {logs.filter(l => {
                                                            const d = new Date(l.startTime);
                                                            const lDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                            return lDate === dateStr && String(l.activityId) === String(actId);
                                                        }).map(log => (
                                                            <div key={log.id} style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '6px 0',
                                                                borderBottom: '1px dashed #eee',
                                                                fontSize: '0.9rem',
                                                                color: '#6d4c41'
                                                            }}>
                                                                <span>
                                                                    {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {' - '}
                                                                    {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 'bold' }}>{formatDuration(log.duration)}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(t('stats.deleteConfirm'))) {
                                                                                deleteLog(log.id);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            border: 'none',
                                                                            background: '#ffcdd2',
                                                                            color: '#c62828',
                                                                            borderRadius: '6px',
                                                                            width: '24px',
                                                                            height: '24px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            fontSize: '12px'
                                                                        }}
                                                                        title="Delete this record"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.9rem', color: '#bcaaa4', fontStyle: 'italic', paddingLeft: '5px' }}>
                                    {t('stats.noRecords')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
