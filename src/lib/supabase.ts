import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  DbCollege,
  DbBranch,
  DbSemester,
  DbClass, 
  DbSubject, 
  DbMaterial, 
  Subject, 
  Material, 
  MaterialCategory,
  CreateSubjectInput,
  CreateMaterialInput
} from '../types';
import { SUBJECTS as FALLBACK_SUBJECTS, ALL_MATERIALS as FALLBACK_MATERIALS, ACADEMIC_SESSION_DISPLAY } from '../data/academicData';

// Clean and normalize environment variable values
function cleanEnvString(val: unknown): string {
  if (typeof val !== 'string') return '';
  let trimmed = val.trim();
  // Strip outer quotes if wrapped
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  // If the secret value contains a variable assignment (e.g., "VARIABLE_NAME=actual_key"), extract the actual key
  if (trimmed.includes('=')) {
    const parts = trimmed.split('=');
    trimmed = parts.slice(1).join('=').trim();
  }
  return trimmed;
}

// Safely access environment variable across Vite client and Node/test environments
function getEnvValue(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // ignore
  }
  return '';
}

// 1. Supabase Project URL (primary: VITE_SUPABASE_URL)
const rawSupabaseUrl = 
  getEnvValue('VITE_SUPABASE_URL') || 
  getEnvValue('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnvValue('SUPABASE_URL') || 
  '';

export const supabaseUrl: string = cleanEnvString(rawSupabaseUrl);

// 2. Supabase Anon / Publishable Key (primary: VITE_SUPABASE_ANON_KEY)
// Normalizes across VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_ aliases
const rawSupabaseAnonKey = 
  getEnvValue('VITE_SUPABASE_ANON_KEY') || 
  getEnvValue('VITE_SUPABASE_PUBLISHABLE_KEY') || 
  getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  getEnvValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 
  getEnvValue('SUPABASE_ANON_KEY') || 
  '';

export const supabaseAnonKey: string = cleanEnvString(rawSupabaseAnonKey);

/**
 * Check whether Supabase environment variables are properly configured.
 * Validates that the public key is actually present (not a variable name or placeholder).
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  // Must not be a placeholder or variable name
  if (
    supabaseUrl.includes('YOUR_') || 
    supabaseAnonKey.includes('YOUR_') ||
    supabaseAnonKey.startsWith('NEXT_PUBLIC_') ||
    supabaseAnonKey.startsWith('VITE_') ||
    supabaseAnonKey.endsWith('=')
  ) {
    return false;
  }

  // Valid Supabase public keys are either modern publishable keys (sb_publishable_... / sb_...)
  // or standard JWT anon keys (eyJ...)
  const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_') || supabaseAnonKey.startsWith('sb_');
  const isJwtAnonKey = supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.includes('.');
  const isGenericValidKey = supabaseAnonKey.length >= 25 && !supabaseAnonKey.includes(' ');

  const isValidKey = isPublishableKey || isJwtAnonKey || isGenericValidKey;
  const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');

  return Boolean(isValidUrl && isValidKey);
};

// Singleton Supabase client (only created if configured with valid key)
let supabaseInstance: SupabaseClient | null = null;
let hasReportedInvalidKey = false;

function handleSupabaseApiError(context: string, errMessage?: string): void {
  if (!errMessage) return;
  if (errMessage.toLowerCase().includes('invalid api key') || errMessage.toLowerCase().includes('jwt')) {
    if (!hasReportedInvalidKey) {
      console.warn(`[Supabase Config Notice] VITE_SUPABASE_ANON_KEY is not an active public/anon key. Gracefully serving default academic curriculum.`);
      hasReportedInvalidKey = true;
    }
    supabaseInstance = null;
  } else {
    console.warn(`[Supabase ${context}]`, errMessage);
  }
}

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('[Supabase client init error]', e);
      return null;
    }
  }
  return supabaseInstance;
};

// Storage Bucket constant for PDF academic files
export const MATERIALS_STORAGE_BUCKET = 'materials';

// ==============================================================================
// STORAGE UTILITIES (Upload, Retrieve, Download)
// ==============================================================================

/**
 * Upload a PDF file to the Supabase Storage 'materials' bucket.
 * Returns public URL and saved file name.
 */
export async function uploadMaterialPdf(
  file: File | Blob, 
  options?: string | {
    collegeSlug?: string;
    branchSlug?: string;
    yearSlug?: string;
    semesterSlug?: string;
    subjectSlug?: string;
    category?: MaterialCategory;
    desiredFileName?: string;
  }
): Promise<{ fileUrl: string; fileName: string; filePath: string }> {
  const client = getSupabase();
  const optionsObj = typeof options === 'string' ? { desiredFileName: options } : options;
  const rawName = optionsObj?.desiredFileName || (file instanceof File ? file.name : `material_${Date.now()}.pdf`);
  const sanitizedName = rawName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // Structured hierarchical storage path:
  // college/branch/year/semester/subject/category/file.ext
  const collegeSlug = optionsObj?.collegeSlug || 'poornima-college-of-engineering';
  const branchSlug = optionsObj?.branchSlug || 'btech-cse';
  const yearSlug = optionsObj?.yearSlug || '1st-year';
  const semesterSlug = optionsObj?.semesterSlug || 'sem-1';
  const subjectSlug = optionsObj?.subjectSlug || 'general';
  const category = optionsObj?.category || 'notes';

  const ext = sanitizedName.split('.').pop()?.toLowerCase() || 'pdf';
  const contentType = file instanceof File && file.type 
    ? file.type 
    : ext === 'pdf' 
      ? 'application/pdf' 
      : ext === 'docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : ext === 'zip' 
          ? 'application/zip' 
          : 'application/octet-stream';

  const filePath = `colleges/${collegeSlug}/${branchSlug}/${yearSlug}/${semesterSlug}/${subjectSlug}/${category}/${Date.now()}_${sanitizedName}`;

  if (!client) {
    // Graceful offline/local mode: create an object URL
    console.info('[Supabase Storage] Supabase credentials not configured, creating local object URL');
    const localUrl = URL.createObjectURL(file);
    return { fileUrl: localUrl, fileName: sanitizedName, filePath };
  }

  const { data, error } = await client.storage
    .from(MATERIALS_STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[Supabase Storage Upload Error]', error);
    throw error;
  }

  // Because the storage bucket is private, use a signed URL (never getPublicUrl)
  const { data: signedData, error: signedErr } = await client.storage
    .from(MATERIALS_STORAGE_BUCKET)
    .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7-day initial signed URL

  if (signedErr) {
    console.warn('[Supabase createSignedUrl upload notice]:', signedErr.message);
  }

  return {
    fileUrl: signedData?.signedUrl || data.path,
    fileName: sanitizedName,
    filePath: data.path,
  };
}

export const uploadMaterialFile = uploadMaterialPdf;

/**
 * Creates a temporary signed URL to download or open a file from the private 'materials' bucket.
 * Conforms strictly to private bucket security (never calls getPublicUrl).
 */
export async function getMaterialSignedUrl(filePathOrUrl: string, expiresIn = 3600): Promise<string> {
  const client = getSupabase();
  if (!client || !filePathOrUrl) {
    return filePathOrUrl || '';
  }

  // If already a signed URL or blob/data URL, return as-is
  if (
    filePathOrUrl.includes('token=') ||
    filePathOrUrl.startsWith('blob:') ||
    filePathOrUrl.startsWith('data:')
  ) {
    return filePathOrUrl;
  }

  // Extract clean storage path if a full Supabase URL was passed
  let path = filePathOrUrl;
  if (path.includes('/storage/v1/object/')) {
    const parts = path.split('/storage/v1/object/');
    const afterObject = parts[1] || '';
    const subParts = afterObject.split('/');
    if (['public', 'authenticated', 'sign'].includes(subParts[0])) {
      subParts.shift();
    }
    if (subParts[0] === MATERIALS_STORAGE_BUCKET) {
      subParts.shift();
    }
    path = subParts.join('/');
  }

  try {
    const { data, error } = await client.storage
      .from(MATERIALS_STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn('[Supabase Signed URL Notice]:', error?.message);
      return filePathOrUrl;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('[Supabase getMaterialSignedUrl Exception]', err);
    return filePathOrUrl;
  }
}

/**
 * Retrieve signed download URL from Supabase storage (replaces insecure publicUrl).
 */
export async function getMaterialPublicUrl(filePath: string): Promise<string> {
  return getMaterialSignedUrl(filePath);
}

/**
 * Safe download helper for academic files using temporary signed URLs.
 */
export async function triggerFileDownload(
  fileUrl: string, 
  fileName: string,
  filePath?: string
): Promise<void> {
  try {
    let resolvedUrl = fileUrl;
    if (filePath) {
      resolvedUrl = await getMaterialSignedUrl(filePath, 3600);
    } else if (fileUrl && fileUrl.includes(MATERIALS_STORAGE_BUCKET)) {
      resolvedUrl = await getMaterialSignedUrl(fileUrl, 3600);
    }

    // If it's a blob/object URL or data URL
    if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Try fetching the file with the signed URL for clean inline download
    const response = await fetch(resolvedUrl);
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } else {
      // Fallback: direct window download trigger with signed link
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.warn('[Download fallback] Direct link navigation:', err);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}

// ==============================================================================
// DATABASE CONVERTERS (Supabase DB rows -> Frontend Models)
// ==============================================================================

/**
 * Maps a Supabase `subjects` row into the frontend Subject interface,
 * hydrating units and metadata appropriately.
 */
export function mapDbSubjectToSubject(dbSubject: any, totalMaterialsCount = 0): Subject {
  const fallback = FALLBACK_SUBJECTS.find(
    s => s.id === dbSubject.id || s.slug === (dbSubject.slug || '') || s.code === dbSubject.code || s.name === dbSubject.name
  );

  const semesterNum = typeof dbSubject.semester === 'number' 
    ? dbSubject.semester 
    : (parseInt(String(dbSubject.semester || '1').replace(/\D/g, ''), 10) || 1);

  const yearNum = typeof dbSubject.year === 'number'
    ? dbSubject.year
    : (parseInt(String(dbSubject.year || '1').replace(/\D/g, ''), 10) || 1);

  return {
    id: dbSubject.id,
    slug: dbSubject.slug || fallback?.slug || fallback?.id || dbSubject.id,
    name: dbSubject.name,
    code: dbSubject.code,
    semester: semesterNum,
    year: yearNum,
    branch: dbSubject.branch || fallback?.branch || 'B.Tech CSE',
    college: fallback?.college || 'Poornima College of Engineering',
    shortDescription: dbSubject.description || fallback?.shortDescription || `${dbSubject.name} curriculum`,
    iconName: dbSubject.icon_name || fallback?.iconName || 'BookOpen',
    credits: dbSubject.credits || fallback?.credits || 3,
    totalMaterials: typeof totalMaterialsCount === 'number' ? totalMaterialsCount : 0,
    units: fallback?.units || [
      { unitNumber: 1, title: 'Unit 1 Fundamentals', keyTopics: ['Core Theory', 'Key Definitions'] },
      { unitNumber: 2, title: 'Unit 2 Advanced Concepts', keyTopics: ['Formulations', 'Derivations'] },
      { unitNumber: 3, title: 'Unit 3 Applied Principles', keyTopics: ['Analysis', 'Problem Solving'] },
      { unitNumber: 4, title: 'Unit 4 Core Topics', keyTopics: ['System Design', 'Implementations'] },
      { unitNumber: 5, title: 'Unit 5 Advanced Applications', keyTopics: ['Case Studies', 'Recent Developments'] },
    ],
  };
}

/**
 * Maps a Supabase `materials` row into the frontend Material interface.
 */
export function mapDbMaterialToMaterial(dbMaterial: DbMaterial, subjectName?: string): Material {
  const fallbackSubject = FALLBACK_SUBJECTS.find(
    s => s.id === dbMaterial.subject_id || (s as any).slug === dbMaterial.subject_id
  );
  const resolvedSubjectName = subjectName || fallbackSubject?.name || 'Course Study Material';

  return {
    id: dbMaterial.id,
    title: dbMaterial.title,
    subjectId: dbMaterial.subject_id,
    subjectName: resolvedSubjectName,
    category: dbMaterial.category as MaterialCategory,
    unitNumber: dbMaterial.unit || undefined,
    topic: dbMaterial.topic || `${resolvedSubjectName} Study Material`,
    description: dbMaterial.description || 'Verified academic study document.',
    fileType: (dbMaterial.file_type as any) || 'pdf',
    fileName: dbMaterial.file_name,
    fileUrl: dbMaterial.file_url,
    filePath: dbMaterial.file_path || undefined,
    fileSize: dbMaterial.file_size || '1.4 MB',
    createdAt: dbMaterial.created_at,
    updatedAt: dbMaterial.updated_at,
    academicYear: ACADEMIC_SESSION_DISPLAY,
    downloadCount: dbMaterial.download_count || 0,
  };
}

// ==============================================================================
// PUBLIC DATABASE QUERIES (Hierarchical Navigation)
// ==============================================================================

/**
 * Fetch all colleges from Supabase.
 */
export async function fetchColleges(): Promise<DbCollege[]> {
  const client = getSupabase();
  if (!client) {
    return [
      {
        id: 'c1000000-0000-0000-0000-000000000001',
        name: 'Poornima College of Engineering',
        code: 'PCE',
        slug: 'poornima-college-of-engineering',
        city: 'Jaipur',
        state: 'Rajasthan',
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    const { data, error } = await client
      .from('colleges')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) handleSupabaseApiError('fetchColleges', error.message);
      return [
        {
          id: 'c1000000-0000-0000-0000-000000000001',
          name: 'Poornima College of Engineering',
          code: 'PCE',
          slug: 'poornima-college-of-engineering',
          city: 'Jaipur',
          state: 'Rajasthan',
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Filter out RTU or PIET if legacy rows exist in DB, keeping PCE and any future colleges
    const filtered = (data as DbCollege[]).filter((c) => {
      const lower = (c.name || '').toLowerCase();
      return !lower.includes('rajasthan technical university') && !lower.includes('poornima institute');
    });

    return filtered.length > 0 ? filtered : (data as DbCollege[]);
  } catch (err) {
    console.error('[Supabase fetchColleges Exception]', err);
    return [];
  }
}

/**
 * Fetch branches from Supabase, optionally filtered by college.
 */
export async function fetchBranches(collegeId?: string): Promise<DbBranch[]> {
  const client = getSupabase();
  if (!client) {
    return [
      {
        id: 'b1000000-0000-0000-0000-000000000001',
        college_id: collegeId || 'c1000000-0000-0000-0000-000000000001',
        name: 'Computer Science & Engineering',
        code: 'B.Tech CSE',
        slug: 'btech-cse',
        degree: 'B.Tech',
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    let query = client.from('branches').select('*').order('name', { ascending: true });
    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (error) handleSupabaseApiError('fetchBranches', error.message);
      return [
        {
          id: 'b1000000-0000-0000-0000-000000000001',
          college_id: collegeId || 'c1000000-0000-0000-0000-000000000001',
          name: 'Computer Science & Engineering',
          code: 'B.Tech CSE',
          slug: 'btech-cse',
          degree: 'B.Tech',
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data as DbBranch[];
  } catch (err) {
    console.error('[Supabase fetchBranches Exception]', err);
    return [];
  }
}

/**
 * Fetch semesters from Supabase, optionally filtered by branch.
 */
export async function fetchSemesters(branchId?: string): Promise<DbSemester[]> {
  const client = getSupabase();
  if (!client) {
    return [
      {
        id: 's1000000-0000-0000-0000-000000000001',
        branch_id: branchId || 'b1000000-0000-0000-0000-000000000001',
        year_number: 1,
        year_name: '1st Year',
        semester_number: 1,
        name: 'Semester 1',
        slug: 'sem-1',
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    let query = client.from('semesters').select('*').order('semester_number', { ascending: true });
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (error) handleSupabaseApiError('fetchSemesters', error.message);
      return [
        {
          id: 's1000000-0000-0000-0000-000000000001',
          branch_id: branchId || 'b1000000-0000-0000-0000-000000000001',
          year_number: 1,
          year_name: '1st Year',
          semester_number: 1,
          name: 'Semester 1',
          slug: 'sem-1',
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data as DbSemester[];
  } catch (err) {
    console.error('[Supabase fetchSemesters Exception]', err);
    return [];
  }
}

/**
 * Fetch the active academic hierarchy (College -> Branch -> Semester).
 */
export async function fetchAcademicHierarchy(): Promise<{
  college: DbCollege;
  branch: DbBranch;
  semester: DbSemester;
} | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const colleges = await fetchColleges();
    if (colleges.length === 0) return null;
    const currentCollege = colleges[0];

    const branches = await fetchBranches(currentCollege.id);
    if (branches.length === 0) return null;
    const currentBranch = branches[0];

    const semesters = await fetchSemesters(currentBranch.id);
    if (semesters.length === 0) return null;
    const currentSemester = semesters[0];

    return {
      college: currentCollege,
      branch: currentBranch,
      semester: currentSemester,
    };
  } catch (err) {
    console.warn('[Supabase hierarchy query notice]', err);
    return null;
  }
}

/**
 * Fetch classes from Supabase (backward compatibility helper).
 */
export async function fetchClasses(): Promise<DbClass[]> {
  const client = getSupabase();
  if (!client) {
    return [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        college: 'Poornima College of Engineering',
        branch: 'B.Tech CSE',
        year: '1st Year',
        semester: 'Semester 1',
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    const { data, error } = await client
      .from('classes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          college: 'Poornima College of Engineering',
          branch: 'B.Tech CSE',
          year: '1st Year',
          semester: 'Semester 1',
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data as DbClass[];
  } catch {
    return [];
  }
}

/**
 * Fetch all subjects from Supabase, or fall back to static list.
 */
export async function fetchSubjects(): Promise<Subject[]> {
  const client = getSupabase();
  if (!client) {
    return FALLBACK_SUBJECTS;
  }

  try {
    const { data: dbSubjects, error: subjectsErr } = await client
      .from('subjects')
      .select(`
        *,
        semesters:semester_id (
          id,
          semester_number,
          year_number,
          year_name,
          name,
          branches:branch_id (
            id,
            name,
            code,
            colleges:college_id (
              id,
              name,
              code
            )
          )
        )
      `)
      .order('name', { ascending: true });

    if (subjectsErr || !dbSubjects || dbSubjects.length === 0) {
      // Try fallback simple select in case schema without joins is used
      const { data: simpleSubjects } = await client
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (simpleSubjects && simpleSubjects.length > 0) {
        return (simpleSubjects as DbSubject[]).map(s => mapDbSubjectToSubject(s));
      }

      if (subjectsErr) handleSupabaseApiError('fetchSubjects', subjectsErr.message);
      return FALLBACK_SUBJECTS;
    }

    // Also fetch material counts per subject
    const { data: materialsData } = await client
      .from('materials')
      .select('subject_id')
      .eq('published', true);

    const countsMap: Record<string, number> = {};
    if (materialsData) {
      for (const item of materialsData) {
        countsMap[item.subject_id] = (countsMap[item.subject_id] || 0) + 1;
      }
    }

    return dbSubjects.map((row: any) => {
      const semObj = row.semesters;
      const branchObj = semObj?.branches;
      const collegeObj = branchObj?.colleges;

      const mapped = mapDbSubjectToSubject(row, countsMap[row.id] || 0);
      if (semObj) {
        mapped.semester = semObj.semester_number || 1;
        mapped.year = semObj.year_number || 1;
      }
      if (branchObj) {
        mapped.branch = branchObj.code || branchObj.name || mapped.branch;
      }
      if (collegeObj) {
        mapped.college = collegeObj.name || mapped.college;
      }
      return mapped;
    });
  } catch (err) {
    console.error('[Supabase fetchSubjects Exception]', err);
    return FALLBACK_SUBJECTS;
  }
}

/**
 * Fetch materials from Supabase with flexible filters (subject, category, unit).
 */
export async function fetchMaterials(options?: {
  subjectId?: string;
  category?: MaterialCategory | 'all';
  unit?: number;
}): Promise<Material[]> {
  const client = getSupabase();
  if (!client) {
    return [];
  }

  try {
    let query = client
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
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (options?.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }

    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    if (options?.unit !== undefined && options?.unit !== null) {
      query = query.eq('unit', options.unit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseApiError('fetchMaterials', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as any[]).map(row => {
      const subjectName = row.subjects?.name;
      return mapDbMaterialToMaterial(row as DbMaterial, subjectName);
    });
  } catch (err) {
    console.error('[Supabase fetchMaterials Exception]', err);
    return [];
  }
}

/**
 * Search across materials table (title, subject name, category, unit, topic, description).
 * First attempts the PostgreSQL search RPC function, with fallback to ILIKE query.
 */
export async function searchMaterialsDb(
  searchQuery: string,
  category?: MaterialCategory | 'all',
  subjectId?: string
): Promise<Material[]> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const client = getSupabase();
  if (!client) {
    return [];
  }

  try {
    // 1. Attempt RPC call to Postgres search function
    const { data: rpcData, error: rpcError } = await client.rpc('search_academic_materials', {
      search_query: trimmed,
      filter_category: category && category !== 'all' ? category : null,
      filter_subject_id: subjectId || null,
    });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((row: any) =>
        mapDbMaterialToMaterial(row as DbMaterial, row.subject_name)
      );
    }

    // 2. Fallback to Supabase ILIKE query
    let query = client
      .from('materials')
      .select(`
        *,
        subjects:subject_id (
          id,
          name,
          code
        )
      `)
      .eq('published', true);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    // ILIKE search on title, topic, or description
    query = query.or(`title.ilike.%${trimmed}%,topic.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return [];
    }

    return (data as any[]).map(row => {
      const subjectName = row.subjects?.name;
      return mapDbMaterialToMaterial(row as DbMaterial, subjectName);
    });
  } catch (err) {
    console.error('[Supabase searchMaterialsDb Exception]', err);
    return [];
  }
}

// ==============================================================================
// ADMINISTRATIVE FOUNDATION (Auth-Gated, No service_role key exposed on client)
// ==============================================================================

/**
 * Creates a new subject (requires authenticated admin session).
 */
export async function adminCreateSubject(input: CreateSubjectInput): Promise<Subject | null> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { data, error } = await client
    .from('subjects')
    .insert([{
      name: input.name,
      code: input.code,
      slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      semester_id: input.semester_id,
      description: input.description || null,
      credits: input.credits || 3,
      icon_name: input.icon_name || 'BookOpen',
    }])
    .select()
    .single();

  if (error) throw error;
  return mapDbSubjectToSubject(data as DbSubject);
}

/**
 * Updates an existing subject.
 */
export async function adminEditSubject(id: string, updates: Partial<CreateSubjectInput>): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { error } = await client
    .from('subjects')
    .update({
      ...updates,
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Deletes a subject and cascades to associated materials.
 */
export async function adminDeleteSubject(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { error } = await client
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Creates a material entry.
 */
export async function adminUploadMaterial(input: CreateMaterialInput): Promise<Material | null> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { data, error } = await client
    .from('materials')
    .insert([{
      title: input.title,
      subject_id: input.subject_id,
      category: input.category,
      unit: input.unit ?? null,
      topic: input.topic || null,
      description: input.description || null,
      file_url: input.file_url,
      file_path: input.file_path || null,
      file_name: input.file_name,
      file_type: input.file_type || 'pdf',
      file_size: input.file_size || '1.4 MB',
      published: input.published ?? true,
    }])
    .select(`
      *,
      subjects:subject_id (
        name
      )
    `)
    .single();

  if (error) throw error;
  return mapDbMaterialToMaterial(data as DbMaterial, (data as any).subjects?.name);
}

/**
 * Updates an existing material.
 */
export async function adminEditMaterial(id: string, updates: Partial<CreateMaterialInput>): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { error } = await client
    .from('materials')
    .update({
      ...updates,
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Sets publication status (published/draft).
 */
export async function adminSetMaterialPublished(id: string, published: boolean): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { error } = await client
    .from('materials')
    .update({ published })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Deletes a material from the database.
 */
export async function adminDeleteMaterial(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client not initialized.');

  const { error } = await client
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
