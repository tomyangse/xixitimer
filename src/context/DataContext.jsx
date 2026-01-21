import React, { createContext, useContext, useReducer, useEffect } from 'react';

const DataContext = createContext();

const initialState = {
  settings: { rewardName: 'Roblox' },
  activities: [], // { id, name, color, icon, rewardMultiplier }
  logs: [], // { id, activityId, startTime, endTime, dateStr, duration, earnedReward }
  activeSession: null, // { activityId, startTime } or null
};

const STORAGE_KEY = 'kidstimer_data';

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        // Ensure settings exist if loading legacy data
        settings: { ...initialState.settings, ...action.payload.settings }
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'EDIT_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
        )
      };
    // ... existing cases ...
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.filter(a => a.id !== action.payload),
      };
    case 'START_SESSION':
      return {
        ...state,
        activeSession: {
          activityId: action.payload.activityId,
          startTime: action.payload.startTime,
        },
      };
    case 'STOP_SESSION':
      return {
        ...state,
        logs: [...state.logs, action.payload.log],
        activeSession: null,
      };
    case 'DELETE_LOG':
      return {
        ...state,
        logs: state.logs.filter(l => l.id !== action.payload),
      }
    case 'RESET_TODAY':
      const today = new Date().toISOString().split('T')[0];
      return {
        ...state,
        logs: state.logs.filter(l => l.dateStr !== today),
        activeSession: null
      };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_DATA', payload: parsed });
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (state !== initialState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const updateSettings = (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const addActivity = (name, color = '#FF6B6B', icon = '⭐', rewardMultiplier = 1) => {
    const newActivity = {
      id: crypto.randomUUID(),
      name,
      color,
      icon,
      rewardMultiplier,
    };
    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
  };

  const editActivity = (id, updates) => {
    dispatch({ type: 'EDIT_ACTIVITY', payload: { id, updates } });
  };
  // ... rest of functions ...

  const deleteActivity = (id) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: id });
  };

  const startActivity = (activityId) => {
    if (state.activeSession) return; // Already running
    dispatch({
      type: 'START_SESSION',
      payload: { activityId, startTime: Date.now() },
    });
  };

  const stopActivity = () => {
    if (!state.activeSession) return;
    const endTime = Date.now();
    const { activityId, startTime } = state.activeSession;

    // Calculate reward
    const activity = state.activities.find(a => a.id === activityId);
    const duration = endTime - startTime;
    const earnedReward = duration * (activity?.rewardMultiplier || 1);

    const newLog = {
      id: crypto.randomUUID(),
      activityId,
      startTime,
      endTime,
      dateStr: new Date(startTime).toISOString().split('T')[0],
      duration,
      earnedReward,
    };
    dispatch({
      type: 'STOP_SESSION',
      payload: { log: newLog },
    });
  };

  const deleteLog = (id) => {
    dispatch({ type: 'DELETE_LOG', payload: id });
  }

  const resetToday = () => {
    dispatch({ type: 'RESET_TODAY' });
  };

  return (
    <DataContext.Provider
      value={{
        state,
        addActivity,
        editActivity,
        deleteActivity,
        startActivity,
        stopActivity,
        deleteLog,
        resetToday,
        updateSettings
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
