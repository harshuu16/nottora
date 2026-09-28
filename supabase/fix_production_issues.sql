-- ==============================================================================
-- NOTTORA AUDITED PRODUCTION MIGRATION
-- ==============================================================================
-- Scope & Justification:
-- 1. Create missing 'public.problem_reports' table with strict RLS:
--    - Fixes PGRST205 error ("Could not find the table 'public.problem_reports' in the schema cache").
--    - Anon/authenticated users can INSERT (with spoof-proof check: user_id IS NULL OR user_id = auth.uid()).
--    - Authenticated users can SELECT only their own reports.
--    - Admins (via public.is_admin()) have full management privileges.
-- 2. Genuinely safe check for 'Design Thinking' in public.subjects:
--    - Preserves existing 'code TEXT NOT NULL' constraint (no DROP NOT NULL).
--    - Dynamically queries Semester 1 from public.semesters (no hardcoded semester UUID).
--    - Uses WHERE NOT EXISTS so it will never create duplicate subjects.
--    - Preserves existing foreign key constraints on public.materials.
-- 3. Reloads PostgREST schema cache.
-- ==============================================================================

-- 1. CREATE PROBLEM REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.problem_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_type TEXT NOT NULL,
    description TEXT NOT NULL,
    page_url TEXT,
    route TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_created_at ON public.problem_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problem_reports_user_id ON public.problem_reports(user_id);

-- Enable Row Level Security
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public Submission (Anonymous and Logged-In Users)
-- Enforces that logged-in users cannot submit with someone else's user_id
DROP POLICY IF EXISTS "Public can submit problem reports" ON public.problem_reports;
CREATE POLICY "Public can submit problem reports"
    ON public.problem_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );

-- Policy 2: User Access (Users can view only their own submitted reports)
DROP POLICY IF EXISTS "Users can view own problem reports" ON public.problem_reports;
CREATE POLICY "Users can view own problem reports"
    ON public.problem_reports FOR SELECT
    TO authenticated
    USING (
        user_id IS NOT NULL AND auth.uid() = user_id
    );

-- Policy 3: Administrator Management (Full read, update, delete for admins)
DROP POLICY IF EXISTS "Admin manage problem reports" ON public.problem_reports;
CREATE POLICY "Admin manage problem reports"
    ON public.problem_reports FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table Grants for PostgREST
GRANT SELECT, INSERT ON public.problem_reports TO anon, authenticated;
GRANT ALL ON public.problem_reports TO authenticated;

-- 2. SAFE DESIGN THINKING SYNC (IDEMPOTENT & DYNAMIC)
-- Dynamically looks up Semester 1 ID from public.semesters (no hardcoded semester UUID).
-- Satisfies existing public.subjects.code NOT NULL constraint without altering column.
-- Checks WHERE NOT EXISTS to guarantee no duplicates if row already exists.
INSERT INTO public.subjects (semester_id, code, name, slug, description, credits, icon_name)
SELECT 
    sem.id,
    '',
    'Design Thinking',
    'design-thinking',
    'Human-Centered Design, Empathy Mapping, Problem Definition, Ideation & Iterative Prototyping',
    2,
    'Lightbulb'
FROM public.semesters sem
WHERE sem.semester_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE slug = 'design-thinking' 
         OR name ILIKE 'Design Thinking%'
  )
LIMIT 1;

-- 3. RELOAD SCHEMA CACHE (MUST BE RUN AFTER CHANGES)
NOTIFY pgrst, 'reload schema';
