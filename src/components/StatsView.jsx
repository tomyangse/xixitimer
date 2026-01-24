import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';

export default function StatsView() {
    const { state } = useData();
    const { logs, activities } = state;

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
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [currentWeekMonday]);

    // Aggregate logs by date -> activityId
    const dailyStats = useMemo(() => {
        const stats = {};
        logs.forEach(log => {
            const date = log.dateStr; // YYYY-MM-DD
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

                                        return (
                                            <div key={actId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>{activityIcon}</span>
                                                    <span style={{ fontWeight: '600', color: '#5d4037' }}>{activityName}</span>
                                                </div>
                                                <span style={{ fontFamily: 'Nunito', fontWeight: 'bold', color: '#8d6e63' }}>
                                                    {formatDuration(duration)}
                                                </span>
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
