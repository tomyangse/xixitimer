
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

const initialState = {
  activities: [],
  logs: [],
  rewards: [], // New state for rewards
  settings: {
    // rewardName is deprecated in favor of rewards table, but keeping for compatibility if needed or removed
  },
  activeSession: null,
  user: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] };
    case 'DELETE_REWARD':
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };
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
        logs: action.payload.log ? [...state.logs, action.payload.log] : state.logs,
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

  // Fetch Data function
  const syncData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      dispatch({ type: 'SET_USER', payload: null });
      return;
    }

    dispatch({ type: 'SET_USER', payload: session.user });

    // Fetch Rewards
    const { data: rewards } = await supabase.from('rewards').select('*').order('created_at');

    // Fetch Activities
    const { data: activities } = await supabase.from('activities').select('*').order('created_at');
    const mappedActivities = (activities || []).map(a => ({
      ...a,
      rewardMultiplier: a.reward_multiplier,
      rewardId: a.reward_id,
      weeklyGoalSessions: a.weekly_goal_sessions || 0,
      goalDurationMinutes: a.goal_duration_minutes || 0,
      isGoalEnabled: a.is_goal_enabled || false
    }));

    // Fetch Logs
    const { data: logs } = await supabase.from('logs').select('*');
    const mappedLogs = (logs || []).map(l => ({
      ...l,
      activityId: l.activity_id,
      rewardId: l.reward_id,
      startTime: parseInt(l.start_time),
      endTime: parseInt(l.end_time),
      earnedReward: l.earned_reward,
      dateStr: l.date_str
    }));

    dispatch({
      type: 'LOAD_DATA',
      payload: {
        rewards: rewards || [],
        activities: mappedActivities,
        logs: mappedLogs
      }
    });
  };

  // Load Data from Supabase on mount
  useEffect(() => {
    syncData();

    // Listen for auth changes to re-fetch data
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        syncData();
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOAD_DATA', payload: { rewards: [], activities: [], logs: [] } });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const addReward = async (name, icon = '🏆') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase.from('rewards').insert([{
      user_id: session.user.id,
      name,
      icon
    }]).select().single();

    if (data) {
      dispatch({ type: 'ADD_REWARD', payload: data });
    }
  };

  const deleteReward = async (id) => {
    dispatch({ type: 'DELETE_REWARD', payload: id });
    await supabase.from('rewards').delete().eq('id', id);
  };

  const addActivity = async (name, color = '#FF6B6B', icon = '⭐', rewardMultiplier = 1, rewardId = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newActivity = {
      user_id: session.user.id,
      name,
      color,
      icon,
      reward_multiplier: rewardMultiplier,
      reward_id: rewardId
    };

    const { data } = await supabase.from('activities').insert([newActivity]).select().single();
    if (data) {
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          ...data,
          rewardMultiplier: data.reward_multiplier,
          rewardId: data.reward_id
        }
      });
    }
  };

  const editActivity = async (id, updates) => {
    dispatch({ type: 'EDIT_ACTIVITY', payload: { id, updates } });

    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.icon) dbUpdates.icon = updates.icon;
    if (updates.rewardMultiplier !== undefined) dbUpdates.reward_multiplier = updates.rewardMultiplier;
    if (updates.rewardId !== undefined) dbUpdates.reward_id = updates.rewardId;
    // Goal fields
    if (updates.weeklyGoalSessions !== undefined) dbUpdates.weekly_goal_sessions = updates.weeklyGoalSessions;
    if (updates.goalDurationMinutes !== undefined) dbUpdates.goal_duration_minutes = updates.goalDurationMinutes;
    if (updates.isGoalEnabled !== undefined) dbUpdates.is_goal_enabled = updates.isGoalEnabled;

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

    // Ignore sessions shorter than 1 minute (60,000 ms)
    if (duration < 60000) {
      alert("时间太短，不计入统计哦 (需超过1分钟) ⏰");
      dispatch({
        type: 'STOP_SESSION',
        payload: { log: null },
      });
      return;
    }

    const earnedReward = duration * (activity?.rewardMultiplier || 1);
    const rewardId = activity?.rewardId; // Get rewardId from activity

    const newLog = {
      user_id: session.user.id,
      activity_id: activityId,
      reward_id: rewardId, // Save reward_id directly to log
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
        rewardId: data.reward_id,
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

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <DataContext.Provider
      value={{
        state,
        addReward,
        deleteReward,
        addActivity,
        editActivity,
        deleteActivity,
        startActivity,
        stopActivity,
        deleteLog,
        resetToday,
        loadData,
        syncData,
        logout,
        user: state.user
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
