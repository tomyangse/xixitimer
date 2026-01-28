import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';

export default function StatsView() {
    const { state, deleteLog } = useData();
    const { logs, activities } = state;

    // State for expanded activity details
    const [expandedActivity, setExpandedActivity] = useState(null);

    // Helper to render icon (image or emoji)
    const renderIcon = (icon) => {
        if (icon && icon.startsWith('/assets/')) {
            return <img src={icon} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '6px' }} />;
        }
        return <span style={{ fontSize: '1.5rem' }}>{icon}</span>;
    };

    // State for week navigation (0 = current week, -1 = last week, etc.)
    const [weekOffset, setWeekOffset] = useState(0);

    // Helper: Get Monday of the week for a given offset
    const currentWeekMonday = useMemo(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        // Apply offset
        monday.setDate(monday.getDate() + (weekOffset * 7));
        return monday;
    }, [weekOffset]);

    // Helper: Generate array of 7 date strings (YYYY-MM-DD) for the selected week
    const weekDates = useMemo(() => {
        const dates = [];
        const current = new Date(currentWeekMonday);
        for (let i = 0; i < 7; i++) {
            // Manually construct YYYY-MM-DD in local time to avoid UTC shift
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);

            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [currentWeekMonday]);

    // Aggregate logs by date -> activityId
    const dailyStats = useMemo(() => {
        const stats = {};
        logs.forEach(log => {
            // Use local date from startTime instead of stored UTC dateStr
            // This ensures stats align with the user's local calendar view
            const d = new Date(log.startTime);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const date = `${year}-${month}-${day}`;

            if (date) {
                if (!stats[date]) stats[date] = {};
                if (!stats[date][log.activityId]) stats[date][log.activityId] = 0;
                stats[date][log.activityId] += log.duration;
            }
        });
        return stats;
    }, [logs]);

    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr);
        // Display format: "Mon, Jan 24"
        return date.toLocaleDateString('zh-CN', { weekday: 'short', month: 'numeric', day: 'numeric' });
    };

    const getWeekRangeDisplay = () => {
        const start = new Date(currentWeekMonday);
        const end = new Date(currentWeekMonday);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}`;
    };

    return (
        <div className="stats-container animate-fade-in" style={{ paddingBottom: '30px' }}>
            <div className="stats-header" style={{ marginBottom: '20px' }}>
                <h2 style={{ textAlign: 'center', color: '#5d4037', marginBottom: '10px' }}>📊 每周统计</h2>

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
                                    {isToday && <span style={{ fontSize: '0.8rem', background: '#ffe082', padding: '2px 8px', borderRadius: '10px', color: '#bf360c' }}>今天</span>}
                                </div>
                                {hasData && (
                                    <span style={{ fontWeight: 'bold', color: '#8d6e63', background: '#efebe9', padding: '4px 10px', borderRadius: '12px' }}>
                                        总计: {formatDuration(dayTotal)}
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
                                                                            if (window.confirm('确定要删除这条记录吗？(无法撤销)')) {
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
                                                                        title="删除这条记录"
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
                                    暂无活动记录
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
