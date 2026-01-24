-- 1. Create rewards table
create table rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text default '🏆',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table rewards enable row level security;

-- 3. RLS Policies
create policy "Users can view own rewards" on rewards for select using (auth.uid() = user_id);
create policy "Users can insert own rewards" on rewards for insert with check (auth.uid() = user_id);
create policy "Users can update own rewards" on rewards for update using (auth.uid() = user_id);
create policy "Users can delete own rewards" on rewards for delete using (auth.uid() = user_id);

-- 4. Add reward_id to activities and logs
alter table activities add column reward_id uuid references rewards(id);
alter table logs add column reward_id uuid references rewards(id);

-- 5. Migration: Create default reward from existing settings and link data
do $$
declare
  r record;
  new_reward_id uuid;
begin
  for r in select * from user_settings loop
    -- Create reward based on old setting
    insert into rewards (user_id, name, icon)
    values (r.user_id, coalesce(r.reward_name, 'Roblox'), '🏆')
    returning id into new_reward_id;

    -- Link existing activities
    update activities set reward_id = new_reward_id where user_id = r.user_id;

    -- Link existing logs
    update logs set reward_id = new_reward_id where user_id = r.user_id;
  end loop;
end;
$$;
