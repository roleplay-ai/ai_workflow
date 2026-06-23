-- Add "What you'll walk away with" to activity_content (overview page)
ALTER TABLE activity_content
  ADD COLUMN IF NOT EXISTS what_you_will_get jsonb DEFAULT '[]'::jsonb;

-- Add "Try asking" suggestion chips to each step
ALTER TABLE activity_steps
  ADD COLUMN IF NOT EXISTS try_asking text[] DEFAULT '{}';
