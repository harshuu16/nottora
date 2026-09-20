export type MaterialCategory = 'notes' | 'important-questions' | 'pyqs' | 'lab-manuals' | 'other';

export interface CategoryInfo {
  id: MaterialCategory;
  label: string;
  pluralLabel: string;
  iconName: string;
  tagline: string;
  description: string;
}

export interface Unit {
  unitNumber: number;
  title: string;
  keyTopics: string[];
}

export interface Subject {
  id: string;
  slug?: string;
  code: string;
  shortName?: string;
  uuid?: string;
  name: string;
  shortDescription: string;
  semester: number;
  year: number;
  branch: string;
  college: string;
  iconName: string;
  units: Unit[];
  credits: number;
  totalMaterials: number;
}

export interface Material {
  id: string;
  title: string;
  subjectId: string;
  subjectCode?: string;
  subjectUuid?: string;
  subjectSlug?: string;
  subjectName: string;
  category: MaterialCategory;
  unitNumber?: number; // 1, 2, 3, 4, 5
  topic: string;
  description: string;
  fileType: 'pdf' | 'docx' | 'zip';
  fileName: string;
  fileUrl: string;
  filePath?: string;
  fileSize: string;
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
  academicYear: string;
  verifiedBy?: string;
  keyHighlights?: string[];
  contentPreview?: string;
  downloadCount: number;
}

export interface AcademicContext {
  college: string;
  collegeShort: string;
  branch: string;
  branchCode: string;
  year: number;
  semester: number;
  session?: string;
}

export type ViewMode = 
  | { type: 'home' }
  | { type: 'subject'; subjectId: string; initialCategory?: MaterialCategory }
  | { type: 'category'; category: MaterialCategory }
  | { type: 'search'; query: string };

// ==========================================
// SUPABASE DATABASE & BACKEND ARCHITECTURE
// ==========================================

export interface DbCollege {
  id: string;
  name: string;
  code: string;
  slug: string;
  city?: string | null;
  state?: string | null;
  created_at: string;
}

export interface DbBranch {
  id: string;
  college_id: string;
  name: string;
  code: string;
  slug: string;
  degree?: string | null;
  created_at: string;
}

export interface DbSemester {
  id: string;
  branch_id: string;
  year_number: number;
  year_name: string;
  semester_number: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface DbClass {
  id: string;
  college: string;
  branch: string;
  year: string;
  semester: string;
  created_at: string;
}

export interface DbSubject {
  id: string;
  name: string;
  code: string;
  short_name?: string | null;
  slug?: string | null;
  semester?: string | null;
  branch?: string | null;
  year?: string | null;
  description: string | null;
  class_id?: string | null;
  semester_id?: string | null;
  credits?: number | null;
  icon_name?: string | null;
  created_at: string;
}

export interface DbMaterial {
  id: string;
  title: string;
  subject_id: string;
  category: MaterialCategory;
  unit: number | null;
  topic: string | null;
  description: string | null;
  file_url: string;
  file_path?: string | null;
  file_name: string;
  file_type: string;
  file_size?: string | null;
  download_count?: number;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export interface CreateSubjectInput {
  id?: string;
  name: string;
  code: string;
  slug?: string;
  semester?: string;
  branch?: string;
  year?: string;
  semester_id?: string;
  description?: string;
  credits?: number;
  icon_name?: string;
}

export interface CreateMaterialInput {
  title: string;
  subject_id: string;
  category: MaterialCategory;
  unit?: number | null;
  topic?: string;
  description?: string;
  file_url: string;
  file_path?: string;
  file_name: string;
  file_type?: string;
  file_size?: string;
  published?: boolean;
}
