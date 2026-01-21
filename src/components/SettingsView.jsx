import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export default function SettingsView({ onClose }) {
    const { state, addActivity, deleteActivity, updateSettings, editActivity, resetToday } = useData();

    const [rewardName, setRewardName] = useState(state.settings?.rewardName || 'Roblox');

    // New Activity State
    const [isEditing, setIsEditing] = useState(null); // id of activity being edited
    const [actName, setActName] = useState('');
    const [actIcon, setActIcon] = useState('⭐');
    const [earnsReward, setEarnsReward] = useState(true);
    const [actMult, setActMult] = useState(1);

    const icons = ['🎹', '📚', '⚽', '🎨', '🧩', '🚲', '🏊', '🧘', '💻'];

    const handleSaveSettings = () => {
        updateSettings({ rewardName });
        onClose();
    };

    const resetForm = () => {
        setIsEditing(null);
        setActName('');
        setActIcon('⭐');
        setEarnsReward(true);
        setActMult(1);
    };

    const handleEditClick = (act) => {
        setIsEditing(act.id);
        setActName(act.name);
        setActIcon(act.icon);
        setEarnsReward((act.rewardMultiplier || 0) > 0);
        setActMult((act.rewardMultiplier && act.rewardMultiplier > 0) ? act.rewardMultiplier : 1);
    };

    const handleSaveActivity = (e) => {
        e.preventDefault();
        if (actName.trim()) {
            const multiplier = earnsReward ? parseFloat(actMult) : 0;

            if (isEditing) {
                editActivity(isEditing, {
                    name: actName,
                    icon: actIcon,
                    rewardMultiplier: multiplier
                });
            } else {
                const hue = Math.floor(Math.random() * 360);
                const color = `hsl(${hue}, 70%, 80%)`;
                addActivity(actName, color, actIcon, multiplier);
            }
            resetForm();
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>⚙️ Settings</h2>
                <button onClick={handleSaveSettings}>Done</button>
            </div>

            <div className="settings-section">
                <label>Reward Name (e.g. Roblox, TV)</label>
                <input
                    type="text"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                />
            </div>

            <div className="settings-section">
                <h3>Manage Activities</h3>
                <div className="settings-activity-list">
                    {state.activities.map(act => (
                        <div key={act.id} className="settings-activity-item">
                            <span>{act.icon} {act.name} {act.rewardMultiplier > 0 ? `(x${act.rewardMultiplier})` : '(No Reward)'}</span>
                            <div className="item-actions">
                                <button className="edit-btn-small" onClick={() => handleEditClick(act)}>Edit</button>
                                <button className="delete-btn-small" onClick={() => deleteActivity(act.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="add-activity-in-settings">
                    <h4>{isEditing ? 'Edit Activity' : 'Add New Activity'}</h4>
                    <input
                        placeholder="Name"
                        value={actName}
                        onChange={e => setActName(e.target.value)}
                    />

                    <div className="reward-toggle-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={earnsReward}
                                onChange={e => setEarnsReward(e.target.checked)}
                            />
                            Earns Reward?
                        </label>
                    </div>

                    {earnsReward && (
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

                    <div className="icon-row">
                        {icons.map(icon => (
                            <span
                                key={icon}
                                className={actIcon === icon ? 'selected' : ''}
                                onClick={() => setActIcon(icon)}
                            >
                                {icon}
                            </span>
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
