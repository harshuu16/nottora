import { getSupabase, uploadMaterialFile, MATERIALS_STORAGE_BUCKET } from './supabase';
import { 
  CreateSubjectInput, 
  CreateMaterialInput, 
  DbSubject, 
  DbMaterial,
  MaterialCategory 
} from '../types';
import { resolveSubjectIdentifier, CANONICAL_SEMESTER_1_MAP } from '../data/academicData';

/**
 * ============================================================================
 * NOTTORA ADMIN SERVICE (SECURE MUTATION & MANAGEMENT LAYER)
 * ============================================================================
 * Handles all backend administrative workflows for Nottora:
 * - Real file uploads to private 'materials' bucket (PDF, DOCX, ZIP)
 * - Material CRUD and published status toggling
 * - Deletion from both Postgres 'materials' and Supabase Storage bucket
 * - Enforces app_metadata.is_admin via Supabase RLS
 */

export interface AdminUploadInput {
  college_id?: string;
  college_slug?: string;
  branch_id?: string;
  branch_slug?: string;
  semester_id?: string;
  semester_slug?: string;
  subject_id: string;
  subject_slug?: string;
  category: MaterialCategory;
  title: string;
  unit?: number | null;
  topic?: string | null;
  description?: string | null;
  published?: boolean;
}

export interface AdminMaterialRecord extends DbMaterial {
  subject_name?: string;
  subject_code?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

// ----------------------------------------------------------------------------
// 1. MATERIAL ADMINISTRATION & REAL FILE UPLOADS
// ----------------------------------------------------------------------------

/**
 * Formats byte size into human readable string (e.g. '2.4 MB', '650 KB')
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '1.0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Uploads a real file (PDF, DOCX, ZIP) to the private 'materials' bucket
 * and registers the corresponding row in the public.materials table.
 */
export async function adminUploadMaterial(
  input: AdminUploadInput,
  file: File
): Promise<DbMaterial> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  // 1. Determine file type from extension
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const allowedExtensions = ['pdf', 'docx', 'zip'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type ".${ext}". Please select a PDF, DOCX, or ZIP file.`);
  }

  const fileSizeFormatted = formatFileSize(file.size);

  // 2. Resolve subject_id to guaranteed Supabase subjects.id UUID
  let resolvedSubjectId = input.subject_id;
  let resolvedSubjectSlug = input.subject_slug;

  const CANONICAL_SEMESTER_DEFS = [
    {
      id: '261FY507',
      uuid: '83daf8a2-62a3-42a3-8149-2e9a5e10cd50',
      code: '261FY507',
      name: 'Communication Skills',
      slug: 'communication-skills',
      credits: 2,
      icon: 'MessagesSquare',
      desc: 'Technical Writing, Business Correspondence, Phonetics & Presentation.',
      matchers: ['261fy507', '1fy1-05', 'communication-skills', 'communication skills'],
    },
    {
      id: '261FY101',
      uuid: 'f9e3096c-fb5c-428a-bf63-be6561d204ab',
      code: '261FY101',
      name: 'Chemistry',
      slug: 'chemistry',
      credits: 4,
      icon: 'Beaker',
      desc: 'Water Technology, Fuels, Polymers, Corrosion & Nanomaterials.',
      matchers: ['261fy101', '1fy2-03', 'chemistry', 'engineering chemistry'],
    },
    {
      id: '261CR104',
      uuid: 'ea50315f-f2a7-4964-85c8-8eb8e526e51f',
      code: '261CR104',
      name: 'BEEE',
      slug: 'beee',
      credits: 3,
      icon: 'Zap',
      desc: 'Basic Electrical & Electronics Engineering — DC/AC Circuits, Transformers & Diodes.',
      matchers: ['261cr104', '1fy3-07', 'beee', 'basic electrical & electronics engineering'],
    },
    {
      id: '261FY103',
      uuid: '7112bf1f-43a4-4ee0-8a90-303de1fb05bc',
      code: '261FY103',
      name: 'Mathematics',
      slug: 'mathematics',
      credits: 4,
      icon: 'Calculator',
      desc: 'Calculus, Matrices, Vector Calculus & Differential Equations.',
      matchers: ['261fy103', '1fy2-01', 'mathematics', 'engineering mathematics', 'engineering-mathematics'],
    },
    {
      id: '261FY629',
      uuid: '2d6358b4-e5c5-47f3-bb7e-e6cf5097ed9f',
      code: '261FY629',
      name: 'MPWS',
      slug: 'mpws',
      credits: 2,
      icon: 'Wrench',
      desc: 'Manufacturing Practices Workshop — Fitting, Carpentry, Foundry & Welding.',
      matchers: ['261fy629', '1fy4-21', 'mpws', 'manufacturing practices workshop'],
    },
    {
      id: '261FY106',
      uuid: '4d45360f-ab27-4a7b-a63f-89ce15aab471',
      code: '261FY106',
      name: 'C Programming',
      slug: 'c-programming',
      credits: 3,
      icon: 'Code2',
      desc: 'Syntax, Control Flow, Functions, Pointers, Arrays & File Handling.',
      matchers: ['261fy106', '1fy3-06', 'c-programming', 'programming in c', 'programming-in-c'],
    },
    {
      id: '261FY526',
      uuid: '26100526-0000-4000-8000-000000000526',
      code: '261FY526',
      name: 'Language Lab',
      slug: 'language-lab',
      credits: 2,
      icon: 'Languages',
      desc: 'Phonetics, Listening Comprehension, Accent Training & Conversational Practice',
      matchers: ['261fy526', 'language-lab', 'language lab'],
    },
    {
      id: '261CR124',
      uuid: '26100124-0000-4000-8000-000000000124',
      code: '261CR124',
      name: 'WPL',
      slug: 'wpl',
      credits: 2,
      icon: 'Globe',
      desc: 'Web Programming Lab — HTML5, CSS3, JavaScript Basics, Responsive Design & DOM',
      matchers: ['261cr124', 'wpl', 'web-programming-lab', 'web programming lab'],
    },
    {
      id: 'design-thinking',
      uuid: '26100000-0000-4000-8000-000000000009',
      code: null, // DO NOT INVENT A CODE
      name: 'Design Thinking',
      slug: 'design-thinking',
      credits: 2,
      icon: 'Lightbulb',
      desc: 'Human-Centered Design, Empathy Mapping, Problem Definition, Ideation & Iterative Prototyping',
      matchers: ['design-thinking', 'design thinking', 'dt'],
    },
    {
      id: 'non-syllabus-project',
      uuid: '30d211c6-3e3a-47c5-a9ab-cdc4bb89d989', // Existing row in database
      code: null, // DO NOT INVENT A CODE
      name: 'Non-Syllabus Project',
      slug: 'non-syllabus-project',
      credits: 2,
      icon: 'FolderKanban',
      desc: 'Hands-on Project Work, Technical Implementation & Practical Innovation',
      matchers: ['non-syllabus-project', 'non-syllabus project', 'nsp', '1fy3-08'],
    },
  ];

  // Try checking in Supabase subjects table first
  let targetSubjectRow: any = null;

  if (isValidUuid(resolvedSubjectId)) {
    const { data: dbSub } = await client
      .from('subjects')
      .select('id, slug, code, name')
      .eq('id', resolvedSubjectId)
      .maybeSingle();
    targetSubjectRow = dbSub;
  }

  if (!targetSubjectRow) {
    const cleanId = (resolvedSubjectId || '').toLowerCase().trim();
    const cleanSlug = (resolvedSubjectSlug || '').toLowerCase().trim();

    // Check canonical definition
    const canonical = CANONICAL_SEMESTER_DEFS.find((c) =>
      c.uuid === resolvedSubjectId ||
      c.id.toLowerCase() === cleanId ||
      c.slug === cleanSlug ||
      c.matchers.includes(cleanId) ||
      c.matchers.includes(cleanSlug)
    );

    if (canonical) {
      resolvedSubjectSlug = canonical.slug;

      // Look in DB by canonical UUID, code, or slug
      const { data: foundInDb } = await client
        .from('subjects')
        .select('id, slug, code, name')
        .or(`id.eq.${canonical.uuid},slug.eq.${canonical.slug}${canonical.code ? `,code.eq.${canonical.code}` : ''}`)
        .maybeSingle();

      if (foundInDb && isValidUuid(foundInDb.id)) {
        targetSubjectRow = foundInDb;
        resolvedSubjectId = foundInDb.id;
      } else {
        // Safe insert using authenticated admin session to preserve FK integrity
        const semId = input.semester_id || '424fcf6e-e43a-457a-b98a-a95a0492ebc8';
        try {
          const { data: inserted, error: insErr } = await client
            .from('subjects')
            .insert([{
              id: canonical.uuid,
              semester_id: semId,
              code: canonical.code,
              name: canonical.name,
              slug: canonical.slug,
              description: canonical.desc,
              credits: canonical.credits,
              icon_name: canonical.icon,
            }])
            .select('id, slug, code, name')
            .maybeSingle();

          if (!insErr && inserted) {
            targetSubjectRow = inserted;
            resolvedSubjectId = inserted.id;
          }
        } catch {
          // If insert fails (e.g. race condition or already exists), re-query
          const { data: retrySub } = await client
            .from('subjects')
            .select('id, slug, code, name')
            .or(`id.eq.${canonical.uuid},slug.eq.${canonical.slug}`)
            .maybeSingle();
          if (retrySub) {
            targetSubjectRow = retrySub;
            resolvedSubjectId = retrySub.id;
          }
        }
      }
    }
  }

  if (targetSubjectRow && isValidUuid(targetSubjectRow.id)) {
    resolvedSubjectId = targetSubjectRow.id;
    if (!resolvedSubjectSlug) {
      resolvedSubjectSlug = targetSubjectRow.slug || undefined;
    }
  } else if (!isValidUuid(resolvedSubjectId)) {
    throw new Error(
      `Invalid subject identifier "${input.subject_id}". Expected a valid Supabase subjects.id UUID.`
    );
  }

  // 3. Upload to private Supabase Storage bucket 'materials'
  const { fileUrl, filePath, fileName: sanitizedFileName } = await uploadMaterialFile(file, {
    desiredFileName: fileName,
    collegeSlug: input.college_slug || 'poornima-college-of-engineering',
    branchSlug: input.branch_slug || 'btech-cse',
    semesterSlug: input.semester_slug || 'sem-1',
    subjectSlug: resolvedSubjectSlug || 'subject',
    category: input.category,
  });

  // 4. Insert record into Postgres 'materials' table with valid subject UUID
  const insertPayload: Record<string, any> = {
    title: input.title.trim(),
    subject_id: resolvedSubjectId,
    category: input.category,
    unit: input.unit ?? null,
    topic: input.topic?.trim() || null,
    description: input.description?.trim() || null,
    file_url: fileUrl,
    file_path: filePath,
    file_name: sanitizedFileName,
    file_type: ext,
    file_size: fileSizeFormatted,
    published: input.published !== undefined ? input.published : true,
    download_count: 0,
  };

  const { data, error } = await client
    .from('materials')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('[adminUploadMaterial Database Error]', error);
    // Attempt rollback of uploaded file if db insert fails
    try {
      await client.storage.from(MATERIALS_STORAGE_BUCKET).remove([filePath]);
    } catch {
      // ignore cleanup error
    }
    throw new Error(`Database error while registering material: ${error.message}`);
  }

  return data as DbMaterial;
}

/**
 * Fetch all materials for administrator view (includes both published & unpublished).
 */
export async function adminFetchAllMaterials(): Promise<AdminMaterialRecord[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('materials')
      .select(`
        *,
        subjects:subject_id (
          id,
          name,
          code,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[adminFetchAllMaterials Error]', error);
      throw error;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      ...row,
      subject_name: row.subjects?.name || 'Subject',
      subject_code: row.subjects?.code || '',
    })) as AdminMaterialRecord[];
  } catch (err: any) {
    console.error('[adminFetchAllMaterials Exception]', err);
    throw err;
  }
}

/**
 * Toggle whether a material is published or unpublished.
 */
export async function adminToggleMaterialPublished(
  materialId: string,
  published: boolean
): Promise<DbMaterial> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not configured.');

  const { data, error } = await client
    .from('materials')
    .update({ 
      published,
      updated_at: new Date().toISOString()
    })
    .eq('id', materialId)
    .select()
    .single();

  if (error) {
    console.error('[adminToggleMaterialPublished Error]', error);
    throw new Error(error.message);
  }

  return data as DbMaterial;
}

/**
 * Deletes a material from both the database and Supabase Storage bucket.
 */
export async function adminDeleteMaterial(
  materialId: string,
  filePath?: string
): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not configured.');

  // 1. If filePath wasn't passed, find the material to get its file_path
  let pathToDelete = filePath;
  if (!pathToDelete) {
    const { data: item } = await client
      .from('materials')
      .select('file_path')
      .eq('id', materialId)
      .maybeSingle();

    pathToDelete = item?.file_path;
  }

  // 2. Delete storage file from private bucket if present
  if (pathToDelete) {
    try {
      await client.storage.from(MATERIALS_STORAGE_BUCKET).remove([pathToDelete]);
    } catch (err) {
      console.warn('[adminDeleteMaterial Storage Warning]', err);
    }
  }

  // 3. Delete database record
  const { error } = await client
    .from('materials')
    .delete()
    .eq('id', materialId);

  if (error) {
    console.error('[adminDeleteMaterial Database Error]', error);
    throw new Error(error.message);
  }
}

/**
 * Edit material metadata.
 */
export async function adminEditMaterial(
  materialId: string,
  updates: Partial<CreateMaterialInput>
): Promise<DbMaterial> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not configured.');

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.subject_id !== undefined) payload.subject_id = updates.subject_id;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.topic !== undefined) payload.topic = updates.topic ? updates.topic.trim() : null;
  if (updates.description !== undefined) payload.description = updates.description ? updates.description.trim() : null;
  if (updates.published !== undefined) payload.published = updates.published;

  const { data, error } = await client
    .from('materials')
    .update(payload)
    .eq('id', materialId)
    .select()
    .single();

  if (error) {
    console.error('[adminEditMaterial Error]', error);
    throw new Error(error.message);
  }

  return data as DbMaterial;
}

// ----------------------------------------------------------------------------
// 2. SUBJECT MANAGEMENT
// ----------------------------------------------------------------------------

export async function adminCreateSubject(input: CreateSubjectInput): Promise<DbSubject> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not configured.');

  const slugId = input.id || input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  const { data, error } = await client
    .from('subjects')
    .insert([
      {
        id: slugId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        semester: input.semester,
        branch: input.branch,
        year: input.year,
        description: input.description || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as DbSubject;
}
