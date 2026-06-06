-- ============================================================
-- Migration 005: normalise tools array to lowercase
-- ============================================================

-- 1. Fix all existing rows
UPDATE public.activities
SET tools = (
  SELECT array_agg(lower(t))
  FROM unnest(tools) t
)
WHERE tools IS NOT NULL;

-- 2. Trigger: auto-lowercase tools on every insert / update
CREATE OR REPLACE FUNCTION public.normalise_tools_lowercase()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tools IS NOT NULL THEN
    NEW.tools := (
      SELECT array_agg(lower(t))
      FROM unnest(NEW.tools) t
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalise_tools
  BEFORE INSERT OR UPDATE OF tools ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.normalise_tools_lowercase();
