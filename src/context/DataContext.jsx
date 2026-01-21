
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

const initialState = {
  settings: { rewardName: 'Roblox' },
  activities: [],
  logs: [],
  activeSession: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload.settings },
        activities: action.payload.activities,
        logs: action.payload.logs
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

  // Load active session from local storage on mount (Persistence for timer)
  useEffect(() => {
    const storedSession = localStorage.getItem('kidstimer_active_session');
    if (storedSession) {
      try {
        dispatch({ type: 'START_SESSION', payload: JSON.parse(storedSession) });
      } catch (e) { }
    }
  }, []);

  // Save active session to local storage
  useEffect(() => {
    if (state.activeSession) {
      localStorage.setItem('kidstimer_active_session', JSON.stringify(state.activeSession));
    } else {
      localStorage.removeItem('kidstimer_active_session');
    }
  }, [state.activeSession]);

  // Load Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch Settings
      let { data: settings } = await supabase.from('user_settings').select('*').single();
      if (!settings) {
        const { data: newSettings } = await supabase.from('user_settings').insert([{ user_id: session.user.id }]).select().single();
        settings = newSettings;
      }

      // Fetch Activities
      const { data: activities } = await supabase.from('activities').select('*').order('created_at');
      const mappedActivities = (activities || []).map(a => ({
        ...a,
        rewardMultiplier: a.reward_multiplier
      }));

      // Fetch Logs
      const { data: logs } = await supabase.from('logs').select('*');
      const mappedLogs = (logs || []).map(l => ({
        ...l,
        activityId: l.activity_id,
        startTime: parseInt(l.start_time),
        endTime: parseInt(l.end_time),
        earnedReward: l.earned_reward,
        dateStr: l.date_str
      }));

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          settings: { rewardName: settings?.reward_name || 'Roblox' },
          activities: mappedActivities,
          logs: mappedLogs
        }
      });
    };

    fetchData();
  }, []);

  const updateSettings = async (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    const { data: { session } } = await supabase.auth.getSession();
    if (session && settings.rewardName) {
      await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        reward_name: settings.rewardName
      });
    }
  };

  const addActivity = async (name, color = '#FF6B6B', icon = '⭐', rewardMultiplier = 1) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newActivity = {
      user_id: session.user.id,
      name,
      color,
      icon,
      reward_multiplier: rewardMultiplier
    };

    const { data } = await supabase.from('activities').insert([newActivity]).select().single();
    if (data) {
      dispatch({ type: 'ADD_ACTIVITY', payload: { ...data, rewardMultiplier: data.reward_multiplier } });
    }
  };

  const editActivity = async (id, updates) => {
    dispatch({ type: 'EDIT_ACTIVITY', payload: { id, updates } });

    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.icon) dbUpdates.icon = updates.icon;
    if (updates.rewardMultiplier !== undefined) dbUpdates.reward_multiplier = updates.rewardMultiplier;

    await supabase.from('activities').update(dbUpdates).eq('id', id);
  };

  const deleteActivity = async (id) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: id });
    await supabase.from('activities').delete().eq('id', id);
  };

  const startActivity = (activityId) => {
    if (state.activeSession) return;
    dispatch({
      type: 'START_SESSION',
      payload: { activityId, startTime: Date.now() },
    });
  };

  const stopActivity = async () => {
    if (!state.activeSession) return;
    const { data: { session } } = await supabase.auth.getSession();
    const endTime = Date.now();
    const { activityId, startTime } = state.activeSession;

    const activity = state.activities.find(a => a.id === activityId);
    const duration = endTime - startTime;
    const earnedReward = duration * (activity?.rewardMultiplier || 1);

    const newLog = {
      user_id: session.user.id,
      activity_id: activityId,
      start_time: startTime,
      end_time: endTime,
      duration,
      earned_reward: earnedReward,
      date_str: new Date(startTime).toISOString().split('T')[0]
    };

    const { data } = await supabase.from('logs').insert([newLog]).select().single();

    if (data) {
      const displayLog = {
        ...data,
        activityId: data.activity_id,
        startTime: parseInt(data.start_time),
        endTime: parseInt(data.end_time),
        earnedReward: data.earned_reward,
        dateStr: data.date_str
      };

      dispatch({
        type: 'STOP_SESSION',
        payload: { log: displayLog },
      });
    }
  };

  const deleteLog = async (id) => {
    dispatch({ type: 'DELETE_LOG', payload: id });
    await supabase.from('logs').delete().eq('id', id);
  }

  const resetToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    dispatch({ type: 'RESET_TODAY' });
    await supabase.from('logs').delete().eq('date_str', today);
  };

  const loadData = () => {
    window.location.reload();
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
        loadData,
        updateSettings
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
