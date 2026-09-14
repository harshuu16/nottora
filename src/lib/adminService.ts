import { getSupabase, uploadMaterialFile, MATERIALS_STORAGE_BUCKET } from './supabase';
import { 
  CreateSubjectInput, 
  CreateMaterialInput, 
  DbSubject, 
  DbMaterial,
  MaterialCategory 
} from '../types';

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

  if (!isValidUuid(resolvedSubjectId)) {
    // Attempt lookup in Supabase subjects table by slug, code, or name
    const { data: dbSub } = await client
      .from('subjects')
      .select('id, slug, code, name')
      .or(`slug.eq.${input.subject_id},code.eq.${input.subject_id},name.ilike.${input.subject_id}`)
      .maybeSingle();

    if (dbSub && dbSub.id && isValidUuid(dbSub.id)) {
      resolvedSubjectId = dbSub.id;
      if (!resolvedSubjectSlug) {
        resolvedSubjectSlug = dbSub.slug || undefined;
      }
    } else {
      throw new Error(
        `Invalid subject identifier "${input.subject_id}". Expected a valid Supabase subjects.id UUID.`
      );
    }
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
