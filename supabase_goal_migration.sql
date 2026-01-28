-- 目标管理功能迁移脚本
-- 为 activities 表添加周目标相关字段

-- 添加目标字段
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS weekly_goal_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goal_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_goal_enabled BOOLEAN DEFAULT FALSE;

-- 验证字段已添加
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN ('weekly_goal_sessions', 'goal_duration_minutes', 'is_goal_enabled');
