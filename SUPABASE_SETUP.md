# Supabase Setup for Group Chat

Run the following SQL in your Supabase SQL Editor to enable group-scoped chat:

## 1. Add group_id column to messages table

```sql
-- Add group_id column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
```

## 2. Update RLS policies for messages table

First, disable existing policies and create group-scoped ones:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable delete for message owner" ON messages;

-- Create new group-scoped policies
CREATE POLICY "Group members can read group messages" ON messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE student_email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Group members can insert messages" ON messages
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE student_email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM groups WHERE created_by = auth.uid()
    ) AND sender_id = auth.uid()
  );

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());
```

## 3. Verify the setup

```sql
-- Check that messages table has group_id column
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'messages' ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT * FROM pg_tables WHERE tablename = 'messages';
```

After running these queries, the chat should work properly with group-scoped access.
