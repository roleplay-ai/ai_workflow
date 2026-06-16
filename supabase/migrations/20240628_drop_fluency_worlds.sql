-- Modules are standalone topic cards; worlds are no longer used.

ALTER TABLE public.fluency_modules
  DROP CONSTRAINT IF EXISTS fluency_modules_world_id_fkey;

ALTER TABLE public.fluency_modules
  DROP COLUMN IF EXISTS world_id;

DROP POLICY IF EXISTS "Public read published worlds" ON public.fluency_worlds;
DROP POLICY IF EXISTS "Superadmin manage worlds" ON public.fluency_worlds;

DROP TABLE IF EXISTS public.fluency_worlds;
