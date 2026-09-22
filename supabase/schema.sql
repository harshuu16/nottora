-- ==============================================================================
-- NOTTORA — SECURE PRODUCTION SUPABASE MIGRATION & SEED SCRIPT (FINAL)
-- ==============================================================================
-- Hierarchy: College -> Branch -> Year/Semester -> Subject -> Category -> Material
-- Target Database: PostgreSQL 15+ (Supabase)
-- View Security: security_invoker = true (Strict RLS enforcement on materials_view)
-- Storage: Private bucket; Public reads restricted to published materials;
--          Admins (app_metadata is_admin=true) retain upload, update, and delete.
-- Seed: College, Branch, Semester, and 8 Core Subjects only (Zero fake materials)
-- Safety: Non-destructive, uses IF NOT EXISTS and ON CONFLICT
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- 2.1 COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    city TEXT DEFAULT 'Jaipur',
    state TEXT DEFAULT 'Rajasthan',
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    slug TEXT NOT NULL,
    degree TEXT DEFAULT 'B.Tech',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_branch_college_code UNIQUE (college_id, code)
);

-- 2.3 SEMESTERS TABLE
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    year_number INTEGER NOT NULL CHECK (year_number >= 1),
    year_name TEXT NOT NULL DEFAULT '1st Year',
    semester_number INTEGER NOT NULL CHECK (semester_number >= 1),
    name TEXT NOT NULL DEFAULT 'Semester 1',
    slug TEXT NOT NULL DEFAULT 'sem-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_semester_branch_num UNIQUE (branch_id, semester_number)
);

-- 2.4 SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    icon_name TEXT DEFAULT 'BookOpen',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_subject_semester_code UNIQUE (semester_id, code)
);

-- 2.5 MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('notes', 'important-questions', 'pyqs', 'lab-manuals', 'other')),
    unit INTEGER CHECK (unit IS NULL OR unit >= 0),
    topic TEXT,
    description TEXT,
    file_url TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    file_size TEXT DEFAULT '1.4 MB',
    download_count INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_branches_college_id ON public.branches(college_id);
CREATE INDEX IF NOT EXISTS idx_semesters_branch_id ON public.semesters(branch_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON public.subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON public.subjects(slug);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_published ON public.materials(published);
CREATE INDEX IF NOT EXISTS idx_materials_unit ON public.materials(unit);

-- Composite GIN full-text search index for high-speed material discovery
CREATE INDEX IF NOT EXISTS idx_materials_search ON public.materials USING gin(
    to_tsvector('english', title || ' ' || coalesce(topic, '') || ' ' || coalesce(description, ''))
);

-- ==============================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_materials_updated_at ON public.materials;
CREATE TRIGGER trigger_materials_updated_at
    BEFORE UPDATE ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION public.set_materials_updated_at();

-- ==============================================================================
-- 5. SECURE ADMIN VERIFICATION FUNCTION
-- ==============================================================================
-- Validates admin privileges strictly via Supabase Auth app_metadata (never user_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 6.1 Colleges RLS
DROP POLICY IF EXISTS "Public can view colleges" ON public.colleges;
CREATE POLICY "Public can view colleges"
    ON public.colleges FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin manage colleges" ON public.colleges;
CREATE POLICY "Admin manage colleges"
    ON public.colleges FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.2 Branches RLS
DROP POLICY IF EXISTS "Public can view branches" ON public.branches;
CREATE POLICY "Public can view branches"
    ON public.branches FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin manage branches" ON public.branches;
CREATE POLICY "Admin manage branches"
    ON public.branches FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.3 Semesters RLS
DROP POLICY IF EXISTS "Public can view semesters" ON public.semesters;
CREATE POLICY "Public can view semesters"
    ON public.semesters FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin manage semesters" ON public.semesters;
CREATE POLICY "Admin manage semesters"
    ON public.semesters FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.4 Subjects RLS
DROP POLICY IF EXISTS "Public can view subjects" ON public.subjects;
CREATE POLICY "Public can view subjects"
    ON public.subjects FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin manage subjects" ON public.subjects;
CREATE POLICY "Admin manage subjects"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.5 Materials RLS: Students only see published materials; only admins can mutate
DROP POLICY IF EXISTS "Public can view published materials" ON public.materials;
CREATE POLICY "Public can view published materials"
    ON public.materials FOR SELECT
    USING (published = true);

DROP POLICY IF EXISTS "Admin manage materials" ON public.materials;
CREATE POLICY "Admin manage materials"
    ON public.materials FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. PRIVATE SUPABASE STORAGE BUCKET & SECURE POLICIES
-- ==============================================================================
-- Configure the materials bucket as PRIVATE (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materials', 
    'materials', 
    false, -- Private bucket
    52428800, -- 50 MB max per material file
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 52428800;

-- Public/Student Read: restricted exclusively to files associated with published materials
DROP POLICY IF EXISTS "Public Read Published Materials from Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Read from Materials Bucket" ON storage.objects;
CREATE POLICY "Public Read Published Materials from Bucket"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'materials' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.materials m
                WHERE m.published = true
                  AND (
                      m.file_path = storage.objects.name
                      OR m.file_url LIKE '%' || storage.objects.name
                  )
            )
        )
    );

-- Only verified admins can upload files
DROP POLICY IF EXISTS "Admin Upload to Materials Bucket" ON storage.objects;
CREATE POLICY "Admin Upload to Materials Bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'materials' AND public.is_admin());

-- Only verified admins can update files
DROP POLICY IF EXISTS "Admin Update in Materials Bucket" ON storage.objects;
CREATE POLICY "Admin Update in Materials Bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'materials' AND public.is_admin());

-- Only verified admins can delete files
DROP POLICY IF EXISTS "Admin Delete from Materials Bucket" ON storage.objects;
CREATE POLICY "Admin Delete from Materials Bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'materials' AND public.is_admin());

-- ==============================================================================
-- 8. RLS-SAFE DATABASE VIEW: materials_view (WITH security_invoker = true)
-- ==============================================================================
-- security_invoker = true enforces the underlying RLS policies on public.materials
-- for whichever user or role executes the query.
CREATE OR REPLACE VIEW public.materials_view 
WITH (security_invoker = true) AS
SELECT 
    m.id,
    m.title,
    m.subject_id,
    m.category,
    m.unit,
    m.topic,
    m.description,
    m.file_url,
    m.file_path,
    m.file_name,
    m.file_type,
    m.file_size,
    m.download_count,
    m.published,
    m.created_at,
    m.updated_at,
    s.name AS subject_name,
    s.code AS subject_code,
    s.slug AS subject_slug,
    sem.semester_number,
    sem.name AS semester_name,
    sem.year_number,
    sem.year_name,
    b.name AS branch_name,
    b.code AS branch_code,
    c.name AS college_name
FROM public.materials m
JOIN public.subjects s ON m.subject_id = s.id
JOIN public.semesters sem ON s.semester_id = sem.id
JOIN public.branches b ON sem.branch_id = b.id
JOIN public.colleges c ON b.college_id = c.id;

-- ==============================================================================
-- 9. SEARCH RPC FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.search_academic_materials(
    search_query TEXT,
    filter_category TEXT DEFAULT NULL,
    filter_subject_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subject_id UUID,
    subject_name TEXT,
    subject_code TEXT,
    category TEXT,
    unit INTEGER,
    topic TEXT,
    description TEXT,
    file_url TEXT,
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size TEXT,
    download_count INTEGER,
    published BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        m.id,
        m.title,
        m.subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        m.category,
        m.unit,
        m.topic,
        m.description,
        m.file_url,
        m.file_path,
        m.file_name,
        m.file_type,
        m.file_size,
        m.download_count,
        m.published,
        m.created_at
    FROM public.materials m
    JOIN public.subjects s ON m.subject_id = s.id
    WHERE m.published = true
      AND (filter_category IS NULL OR m.category = filter_category)
      AND (filter_subject_id IS NULL OR m.subject_id = filter_subject_id)
      AND (
          search_query IS NULL 
          OR search_query = ''
          OR m.title ILIKE '%' || search_query || '%'
          OR s.name ILIKE '%' || search_query || '%'
          OR s.code ILIKE '%' || search_query || '%'
          OR coalesce(m.topic, '') ILIKE '%' || search_query || '%'
          OR coalesce(m.description, '') ILIKE '%' || search_query || '%'
      )
    ORDER BY m.created_at DESC;
$$;

-- ==============================================================================
-- 10. INITIAL NOTTORA ACADEMIC SEED DATA (SAFE UPSERT, ZERO FAKE MATERIALS)
-- ==============================================================================
DO $$
DECLARE
    v_college_id UUID;
    v_branch_id UUID;
    v_semester_id UUID;
BEGIN
    -- 10.1 College: Poornima College of Engineering
    INSERT INTO public.colleges (name, code, slug, city, state)
    VALUES ('Poornima College of Engineering', 'PCE', 'poornima-college-of-engineering', 'Jaipur', 'Rajasthan')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_college_id;

    -- 10.2 Branch: B.Tech CSE
    INSERT INTO public.branches (college_id, name, code, slug, degree)
    VALUES (v_college_id, 'Computer Science & Engineering', 'B.Tech CSE', 'btech-cse', 'B.Tech')
    ON CONFLICT (college_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_branch_id;

    -- 10.3 Level: 1st Year, Semester 1
    INSERT INTO public.semesters (branch_id, year_number, year_name, semester_number, name, slug)
    VALUES (v_branch_id, 1, '1st Year', 1, 'Semester 1', 'sem-1')
    ON CONFLICT (branch_id, semester_number) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_semester_id;

    -- 10.4 The 8 Core Subjects (Academic structure only, zero fake materials)
    -- 1. Communication Skills
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY507', 'Communication Skills', 'communication-skills', 2, 'MessagesSquare', 'Technical Writing, Business Correspondence, Phonetics & Presentation.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 2. Chemistry
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY101', 'Chemistry', 'chemistry', 4, 'Beaker', 'Water Technology, Fuels, Polymers, Corrosion & Nanomaterials.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 3. BEEE
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261CR104', 'BEEE', 'beee', 3, 'Zap', 'Basic Electrical & Electronics Engineering — DC/AC Circuits, Transformers & Diodes.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 4. Mathematics
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY103', 'Mathematics', 'mathematics', 4, 'Calculator', 'Calculus, Matrices, Vector Calculus & Differential Equations.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 5. MPWS
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY629', 'MPWS', 'mpws', 2, 'Wrench', 'Manufacturing Practices Workshop — Fitting, Carpentry, Foundry & Welding.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 6. C Programming
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY106', 'C Programming', 'c-programming', 3, 'Code2', 'Syntax, Control Flow, Functions, Pointers, Arrays & File Handling.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 7. Language Lab
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261FY526', 'Language Lab', 'language-lab', 2, 'Languages', 'Phonetics, Listening Comprehension, Accent Training & Conversational Practice.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

    -- 8. WPL
    INSERT INTO public.subjects (semester_id, code, name, slug, credits, icon_name, description)
    VALUES (v_semester_id, '261CR124', 'WPL', 'wpl', 2, 'Globe', 'Web Programming Lab — HTML5, CSS3, JavaScript Basics, Responsive Design & DOM.')
    ON CONFLICT (semester_id, code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, credits = EXCLUDED.credits, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description;

END $$;

-- ==============================================================================
-- 11. PROBLEM REPORTS & FEEDBACK TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.problem_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_type TEXT NOT NULL,
    description TEXT NOT NULL,
    page_url TEXT,
    route TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_created_at ON public.problem_reports(created_at DESC);

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- Allow students (including anonymous visitors) to submit problem reports
DROP POLICY IF EXISTS "Public can submit problem reports" ON public.problem_reports;
CREATE POLICY "Public can submit problem reports"
    ON public.problem_reports FOR INSERT
    TO public
    WITH CHECK (true);

-- Admins can view and manage problem reports
DROP POLICY IF EXISTS "Admin manage problem reports" ON public.problem_reports;
CREATE POLICY "Admin manage problem reports"
    ON public.problem_reports FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
