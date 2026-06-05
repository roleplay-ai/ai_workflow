-- Add is_featured flag to activities so superadmins can explicitly
-- control which activities appear in the "New this week" section.
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
