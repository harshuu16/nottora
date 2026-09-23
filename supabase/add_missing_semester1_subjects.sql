-- ==============================================================================
-- NOTTORA SUPABASE MIGRATION: ADD MISSING SEMESTER 1 SUBJECTS & SAFE CODE SYNC
-- ==============================================================================
-- College:  Poornima College of Engineering (PCE)
-- Branch:   B.Tech Computer Science & Engineering (CSE)
-- Semester: Semester 1 (Autonomous Syllabus)
--
-- TARGET SEMESTER 1 SUBJECTS:
-- 1. Communication Skills — 261FY507
-- 2. Chemistry — 261FY101
-- 3. BEEE — 261CR104
-- 4. Mathematics / Engineering Mathematics — 261FY103
-- 5. MPWS — 261FY629
-- 6. C Programming / Programming in C — 261FY106
-- 7. Language Lab — 261FY526
-- 8. WPL — 261CR124
-- 9. Design Thinking (DT) — DO NOT INVENT A CODE (code is NULL)
-- 10. Non-Syllabus Project (NSP) — DO NOT INVENT A CODE (code is NULL)
--
-- SAFETY ASSURANCES:
-- - Idempotent: safe to run multiple times without creating duplicate rows
-- - Preserves all existing materials and subject UUID foreign keys
-- - Does not drop tables, columns, or RLS policies
-- ==============================================================================

-- 1. Allow 'code' column to be NULL so Design Thinking and NSP do not need invented codes
ALTER TABLE public.subjects ALTER COLUMN code DROP NOT NULL;

-- 2. Insert genuinely missing subjects into public.subjects (only if not already present)

-- Missing Subject 1: Language Lab
INSERT INTO public.subjects (id, semester_id, code, name, slug, description, credits, icon_name)
SELECT 
    '26100526-0000-4000-8000-000000000526'::uuid,
    '424fcf6e-e43a-457a-b98a-a95a0492ebc8'::uuid,
    '261FY526',
    'Language Lab',
    'language-lab',
    'Phonetics, Listening Comprehension, Accent Training & Conversational Practice',
    2,
    'Languages'
WHERE NOT EXISTS (
    SELECT 1 FROM public.subjects 
    WHERE slug = 'language-lab' OR code = '261FY526' OR name ILIKE 'Language Lab'
);

-- Missing Subject 2: Web Programming Lab (WPL)
INSERT INTO public.subjects (id, semester_id, code, name, slug, description, credits, icon_name)
SELECT 
    '26100124-0000-4000-8000-000000000124'::uuid,
    '424fcf6e-e43a-457a-b98a-a95a0492ebc8'::uuid,
    '261CR124',
    'WPL',
    'wpl',
    'Web Programming Lab — HTML5, CSS3, JavaScript Basics, Responsive Design & DOM',
    2,
    'Globe'
WHERE NOT EXISTS (
    SELECT 1 FROM public.subjects 
    WHERE slug = 'wpl' OR code = '261CR124' OR name ILIKE 'WPL' OR name ILIKE 'Web Programming Lab'
);

-- Missing Subject 3: Design Thinking (DT) — DO NOT INVENT A CODE
INSERT INTO public.subjects (id, semester_id, code, name, slug, description, credits, icon_name)
SELECT 
    '26100000-0000-4000-8000-000000000009'::uuid,
    '424fcf6e-e43a-457a-b98a-a95a0492ebc8'::uuid,
    NULL,
    'Design Thinking',
    'design-thinking',
    'Human-Centered Design, Empathy Mapping, Problem Definition, Ideation & Iterative Prototyping',
    2,
    'Lightbulb'
WHERE NOT EXISTS (
    SELECT 1 FROM public.subjects 
    WHERE slug = 'design-thinking' OR name ILIKE 'Design Thinking'
);

-- 3. Non-Syllabus Project (NSP): preserve existing UUID '30d211c6-3e3a-47c5-a9ab-cdc4bb89d989'
-- Update name to full descriptive format and ensure no invented code is used
UPDATE public.subjects
SET 
    name = 'Non-Syllabus Project',
    code = NULL,
    description = 'Hands-on Project Work, Technical Implementation & Practical Innovation',
    icon_name = 'FolderKanban'
WHERE id = '30d211c6-3e3a-47c5-a9ab-cdc4bb89d989'
  AND (code IS NOT NULL OR name != 'Non-Syllabus Project');

-- 4. Safely synchronize existing subject rows with official Autonomous Semester 1 codes
-- Preserves all existing IDs (so all existing materials retain foreign key integrity)
UPDATE public.subjects SET code = '261FY507' WHERE id = '83daf8a2-62a3-42a3-8149-2e9a5e10cd50' AND code != '261FY507'; -- Communication Skills
UPDATE public.subjects SET code = '261FY101' WHERE id = 'f9e3096c-fb5c-428a-bf63-be6561d204ab' AND code != '261FY101'; -- Chemistry
UPDATE public.subjects SET code = '261CR104' WHERE id = 'ea50315f-f2a7-4964-85c8-8eb8e526e51f' AND code != '261CR104'; -- BEEE
UPDATE public.subjects SET code = '261FY103' WHERE id = '7112bf1f-43a4-4ee0-8a90-303de1fb05bc' AND code != '261FY103'; -- Mathematics
UPDATE public.subjects SET code = '261FY629' WHERE id = '2d6358b4-e5c5-47f3-bb7e-e6cf5097ed9f' AND code != '261FY629'; -- MPWS
UPDATE public.subjects SET code = '261FY106' WHERE id = '4d45360f-ab27-4a7b-a63f-89ce15aab471' AND code != '261FY106'; -- Programming in C
