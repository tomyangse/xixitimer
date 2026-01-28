import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../supabaseClient';

export default function SettingsView() {
    const { state, addReward, deleteReward, addActivity, deleteActivity, editActivity, resetToday, user, logout } = useData();
    const { rewards } = state;

    // Reward State
    const [newRewardName, setNewRewardName] = useState('');

    // New Activity State
    const [isEditing, setIsEditing] = useState(null); // id of activity being edited
    const [actName, setActName] = useState('');
    const [actIcon, setActIcon] = useState('/assets/card_piano.png');

    // Instead of boolean, we now select a reward ID or null
    const [selectedRewardId, setSelectedRewardId] = useState(''); // '' means no reward
    const [actMult, setActMult] = useState(1);

    // Goal settings state
    const [goalEnabled, setGoalEnabled] = useState(false);
    const [goalSessions, setGoalSessions] = useState(3);
    const [goalMinutes, setGoalMinutes] = useState(20);

    // Display Name State
    const [displayName, setDisplayName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name);
        }
    }, [user]);

    const handleUpdateName = async () => {
        if (!displayName.trim()) return;
        setIsUpdatingName(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: displayName }
        });
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('姓名已更新! ✨');
        }
        setIsUpdatingName(false);
    };

    // Activity icon images
    const iconImages = [
        { path: '/assets/card_piano.png', label: 'Piano' },
        { path: '/assets/card_book.png', label: 'Book' },
        { path: '/assets/card_football.png', label: 'Football' },
        { path: '/assets/card_paiting.png', label: 'Painting' },
        { path: '/assets/card_ipad.png', label: 'iPad' },
    ];

    // Helper to render icon (image or emoji)
    const renderIcon = (icon) => {
        if (icon && icon.startsWith('/assets/')) {
            return <img src={icon} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px', verticalAlign: 'middle', marginRight: '8px' }} />;
        }
        return <span style={{ marginRight: '8px' }}>{icon}</span>;
    };

    const handleAddReward = () => {
        if (newRewardName.trim()) {
            addReward(newRewardName);
            setNewRewardName('');
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setActName('');
        setActIcon('/assets/card_piano.png');
        setSelectedRewardId(''); // Default to no reward
        setActMult(1);
    };

    const handleEditClick = (act) => {
        setIsEditing(act.id);
        setActName(act.name);
        setActIcon(act.icon);
        // If activity has a rewardId, set it. Otherwise check if it has a multiplier > 0 and try to default to first reward if exists?
        // Better to rely on rewardId. If migrating, old activities might have null rewardId but multiplier > 0.
        // The migration script should have set rewardId for all activities with multipliers.
        setSelectedRewardId(act.rewardId || '');
        setActMult((act.rewardMultiplier && act.rewardMultiplier > 0) ? act.rewardMultiplier : 1);
        // Load goal settings
        setGoalEnabled(act.isGoalEnabled || false);
        setGoalSessions(act.weeklyGoalSessions || 3);
        setGoalMinutes(act.goalDurationMinutes || 20);
    };

    const handleSaveActivity = (e) => {
        e.preventDefault();
        if (actName.trim()) {
            const rewardId = selectedRewardId || null;
            const multiplier = rewardId ? parseFloat(actMult) : 0;

            if (isEditing) {
                editActivity(isEditing, {
                    name: actName,
                    icon: actIcon,
                    rewardMultiplier: multiplier,
                    rewardId: rewardId,
                    isGoalEnabled: goalEnabled,
                    weeklyGoalSessions: parseInt(goalSessions) || 0,
                    goalDurationMinutes: parseInt(goalMinutes) || 0
                });
            } else {
                const hue = Math.floor(Math.random() * 360);
                const color = `hsl(${hue}, 70%, 80%)`;
                addActivity(actName, color, actIcon, multiplier, rewardId);
            }
            resetForm();
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>🧶 我的设置</h2>
            </div>

            {/* User Account Section */}
            <div className="settings-section account-section">
                <h3>Account</h3>
                <div className="user-info">
                    <span className="user-email">{user?.email}</span>
                    <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </div>
                <div className="name-edit-row">
                    <label>显示名称</label>
                    <div className="name-input-group">
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="输入显示名称"
                        />
                        <button
                            className="save-name-btn"
                            onClick={handleUpdateName}
                            disabled={isUpdatingName}
                        >
                            {isUpdatingName ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Manage Rewards Section */}
            <div className="settings-section">
                <h3>Manage Rewards</h3>
                <div className="settings-activity-list" style={{ maxHeight: '150px' }}>
                    {rewards.map(r => (
                        <div key={r.id} className="settings-activity-item">
                            <span>{r.icon} {r.name}</span>
                            <button className="delete-btn-small" onClick={() => deleteReward(r.id)}>Delete</button>
                        </div>
                    ))}
                    {rewards.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No rewards yet.</p>}
                </div>
                <div className="add-activity-in-settings" style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            placeholder="New Reward (e.g. YouTube)"
                            value={newRewardName}
                            onChange={(e) => setNewRewardName(e.target.value)}
                        />
                        <button className="add-btn-settings" onClick={handleAddReward} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                            + Add
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h3>Manage Activities</h3>
                <div className="settings-activity-list">
                    {state.activities.map(act => {
                        const linkedReward = rewards.find(r => r.id === act.rewardId);
                        const rewardLabel = linkedReward ? ` -> ${linkedReward.name}` : '';
                        return (
                            <div key={act.id} className="settings-activity-item">
                                <span>{renderIcon(act.icon)}{act.name} {act.rewardMultiplier > 0 ? `(x${act.rewardMultiplier}${rewardLabel})` : '(No Reward)'}</span>
                                <div className="item-actions">
                                    <button className="edit-btn-small" onClick={() => handleEditClick(act)}>Edit</button>
                                    <button className="delete-btn-small" onClick={() => deleteActivity(act.id)}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="add-activity-in-settings">
                    <h4>{isEditing ? 'Edit Activity' : 'Add New Activity'}</h4>
                    <input
                        placeholder="Name"
                        value={actName}
                        onChange={e => setActName(e.target.value)}
                    />

                    <div className="reward-toggle-row">
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                            <span style={{ fontWeight: 'bold' }}>Earns Reward:</span>
                            <select
                                value={selectedRewardId}
                                onChange={(e) => setSelectedRewardId(e.target.value)}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    width: '100%',
                                    fontFamily: 'Nunito'
                                }}
                            >
                                <option value="">(None)</option>
                                {rewards.map(r => (
                                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {selectedRewardId && (
                        <div className="multiplier-row">
                            <label>Multiplier:</label>
                            <input
                                type="number"
                                step="0.1"
                                value={actMult}
                                onChange={e => setActMult(e.target.value)}
                                style={{ width: '60px' }}
                            />
                        </div>
                    )}

                    {/* Goal Settings Section - Moved up for better visibility */}
                    <div className="goal-settings-group" style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: '#f1f8e9',
                        borderRadius: '12px',
                        border: '2px solid #a5d6a7'
                    }}>
                        <div className="goal-toggle-row">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={goalEnabled}
                                    onChange={(e) => setGoalEnabled(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>🎯 启用周目标 (Enable Goals)</span>
                            </label>
                        </div>
                        {goalEnabled && (
                            <div className="goal-inputs-row" style={{ marginTop: '10px' }}>
                                <div className="goal-input-group">
                                    <label>每周次数 (Sessions/Week)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="14"
                                        value={goalSessions}
                                        onChange={(e) => setGoalSessions(e.target.value)}
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>每次时长 (Minutes/Session)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={goalMinutes}
                                        onChange={(e) => setGoalMinutes(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="icon-row" style={{ marginTop: '15px' }}>
                        <p style={{ width: '100%', marginBottom: '5px', fontWeight: 'bold', color: '#5d4037' }}>Choose Icon:</p>
                        {iconImages.map(icon => (
                            <div
                                key={icon.path}
                                className={`icon-option ${actIcon === icon.path ? 'selected' : ''}`}
                                onClick={() => setActIcon(icon.path)}
                                title={icon.label}
                            >
                                <img src={icon.path} alt={icon.label} />
                            </div>
                        ))}
                    </div>

                    <div className="form-buttons">
                        <button className="add-btn-settings" onClick={handleSaveActivity}>
                            {isEditing ? 'Save Changes' : '+ Add Activity'}
                        </button>
                        {isEditing && (
                            <button className="cancel-btn-settings" onClick={resetForm}>Cancel</button>
                        )}
                    </div>
                </div>
            </div>
            <div className="settings-section">
                <h3>Reset Data</h3>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Reset today's timer to 0m.</p>
                <button
                    className="reset-btn"
                    onClick={() => {
                        if (window.confirm("Are you sure you want to reset today's time?")) {
                            resetToday();
                            onClose();
                        }
                    }}
                >
                    ONE-CLICK CLEAR TIME (Reset Today) ️
                </button>
            </div>
        </div>
    );
}
