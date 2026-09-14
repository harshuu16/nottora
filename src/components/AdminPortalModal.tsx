import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';
import { MaterialCategory, Subject, DbCollege, DbBranch, DbSemester, DbSubject } from '../types';
import {
  AdminUser,
  getCurrentAdminUser,
  adminSignIn,
  adminSignOut,
  subscribeToAuthChanges,
} from '../lib/adminAuth';
import {
  adminUploadMaterial,
  adminFetchAllMaterials,
  adminToggleMaterialPublished,
  adminDeleteMaterial,
  AdminMaterialRecord,
  AdminUploadInput,
  isValidUuid,
} from '../lib/adminService';
import {
  fetchColleges,
  fetchBranches,
  fetchSemesters,
  getMaterialSignedUrl,
  getSupabase,
} from '../lib/supabase';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onMaterialsUpdated: () => void;
}

const CATEGORY_OPTIONS: { id: MaterialCategory; label: string }[] = [
  { id: 'notes', label: 'Lecture Notes' },
  { id: 'important-questions', label: 'Important Questions' },
  { id: 'pyqs', label: 'Previous Year Questions (PYQs)' },
  { id: 'lab-manuals', label: 'Lab Manuals' },
  { id: 'other', label: 'Other Reference Material' },
];

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onMaterialsUpdated,
}) => {
  // Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Active view tab in admin panel: 'upload' or 'manage'
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');

  // Cascade selector data
  const [colleges, setColleges] = useState<DbCollege[]>([]);
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [semesters, setSemesters] = useState<DbSemester[]>([]);
  // Database subjects loaded from Supabase to provide authoritative UUIDs
  const [dbSubjects, setDbSubjects] = useState<DbSubject[]>([]);

  // Form inputs
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('notes');
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage materials state
  const [adminMaterials, setAdminMaterials] = useState<AdminMaterialRecord[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [manageFilterSubject, setManageFilterSubject] = useState<string>('all');
  const [manageFilterCategory, setManageFilterCategory] = useState<string>('all');
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Check initial authentication
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const user = await getCurrentAdminUser();
        if (mounted) {
          setAdminUser(user);
          setIsCheckingAuth(false);
        }
      } catch {
        if (mounted) setIsCheckingAuth(false);
      }
    };
    checkSession();

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (mounted) {
        setAdminUser(user);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Load cascade options (Colleges, Branches, Semesters)
  useEffect(() => {
    if (!isOpen) return;

    const loadHierarchy = async () => {
      try {
        const fetchedColleges = await fetchColleges();
        setColleges(fetchedColleges);
        if (fetchedColleges.length > 0 && !selectedCollegeId) {
          setSelectedCollegeId(fetchedColleges[0].id);
        }

        const fetchedBranches = await fetchBranches(fetchedColleges[0]?.id);
        setBranches(fetchedBranches);
        if (fetchedBranches.length > 0 && !selectedBranchId) {
          setSelectedBranchId(fetchedBranches[0].id);
        }

        const fetchedSemesters = await fetchSemesters(fetchedBranches[0]?.id);
        setSemesters(fetchedSemesters);
      } catch (err) {
        console.warn('[Admin Hierarchy Load Error]', err);
      }
    };

    loadHierarchy();
  }, [isOpen, selectedCollegeId, selectedBranchId]);

  // Load authoritative database subjects directly from Supabase to guarantee exact UUIDs
  useEffect(() => {
    if (!isOpen) return;

    const loadDbSubjects = async () => {
      const client = getSupabase();
      if (!client) return;
      try {
        const { data } = await client
          .from('subjects')
          .select('id, name, code, slug, semester_id, credits, icon_name')
          .order('name', { ascending: true });
        if (data && data.length > 0) {
          setDbSubjects(data as DbSubject[]);
        }
      } catch (err) {
        console.warn('[Admin Portal dbSubjects query notice]', err);
      }
    };

    loadDbSubjects();
  }, [isOpen]);

  // Map loaded subjects so that every option provides the authentic Supabase subjects.id UUID
  const availableSubjectOptions = useMemo(() => {
    if (dbSubjects.length > 0) {
      return dbSubjects.map((dbs) => ({
        id: dbs.id,
        uuid: dbs.id,
        slug: dbs.slug || dbs.id,
        name: dbs.name,
        code: dbs.code,
      }));
    }

    return subjects.map((s) => {
      const dbMatch = dbSubjects.find(
        (db) => db.slug === s.slug || db.slug === s.id || db.code === s.code || db.name.toLowerCase() === s.name.toLowerCase()
      );
      const uuid = (dbMatch && isValidUuid(dbMatch.id))
        ? dbMatch.id
        : (isValidUuid(s.id) ? s.id : s.id);

      return {
        id: uuid,
        uuid,
        slug: s.slug || s.id,
        name: s.name,
        code: s.code,
      };
    });
  }, [dbSubjects, subjects]);

  // Helper to map any selected subject value (slug, code, name, or UUID) to its real database UUID
  const getSubjectDatabaseUuid = useCallback((inputVal: string): { uuid: string; slug: string; name: string } | null => {
    if (!inputVal) return null;

    // 1. If it matches a database subject row by UUID
    const matchByUuid = dbSubjects.find((s) => s.id === inputVal) ||
      availableSubjectOptions.find((s) => s.uuid === inputVal || s.id === inputVal);
    if (matchByUuid && isValidUuid(matchByUuid.id)) {
      return { uuid: matchByUuid.id, slug: matchByUuid.slug || inputVal, name: matchByUuid.name };
    }

    // 2. Match by slug, code, or name in dbSubjects
    const matchInDb = dbSubjects.find(
      (s) => s.slug === inputVal || s.code === inputVal || s.name.toLowerCase() === inputVal.toLowerCase()
    );
    if (matchInDb && isValidUuid(matchInDb.id)) {
      return { uuid: matchInDb.id, slug: matchInDb.slug || inputVal, name: matchInDb.name };
    }

    // 3. Match in availableSubjectOptions
    const matchInResolved = availableSubjectOptions.find(
      (s) => s.slug === inputVal || s.code === inputVal || s.name.toLowerCase() === inputVal.toLowerCase()
    );
    if (matchInResolved && isValidUuid(matchInResolved.uuid)) {
      return { uuid: matchInResolved.uuid, slug: matchInResolved.slug, name: matchInResolved.name };
    }

    // 4. Match in raw subjects prop
    const matchInProp = subjects.find(
      (s) => s.id === inputVal || s.slug === inputVal || s.code === inputVal || s.name.toLowerCase() === inputVal.toLowerCase()
    );
    if (matchInProp) {
      if (isValidUuid(matchInProp.id)) {
        return { uuid: matchInProp.id, slug: matchInProp.slug || inputVal, name: matchInProp.name };
      }
      const crossMatch = dbSubjects.find(
        (db) => db.slug === matchInProp.slug || db.slug === matchInProp.id || db.code === matchInProp.code
      );
      if (crossMatch && isValidUuid(crossMatch.id)) {
        return { uuid: crossMatch.id, slug: crossMatch.slug || matchInProp.slug || inputVal, name: crossMatch.name };
      }
    }

    if (isValidUuid(inputVal)) {
      return { uuid: inputVal, slug: inputVal, name: 'Selected Subject' };
    }

    return null;
  }, [dbSubjects, availableSubjectOptions, subjects]);

  // Set default subject and synchronize selectedSubjectId so it is always a valid database UUID
  useEffect(() => {
    if (!selectedSubjectId) {
      if (availableSubjectOptions.length > 0) {
        setSelectedSubjectId(availableSubjectOptions[0].id);
      }
      return;
    }

    // If current selectedSubjectId is not a valid UUID (e.g. it was initialized to the slug "engineering-mathematics"):
    if (!isValidUuid(selectedSubjectId)) {
      const resolved = getSubjectDatabaseUuid(selectedSubjectId);
      if (resolved && isValidUuid(resolved.uuid)) {
        setSelectedSubjectId(resolved.uuid);
      }
    }
  }, [selectedSubjectId, availableSubjectOptions, getSubjectDatabaseUuid]);

  // Load all materials when switching to 'manage' tab or upon login
  const loadMaterials = useCallback(async () => {
    if (!adminUser) return;
    setIsLoadingMaterials(true);
    try {
      const data = await adminFetchAllMaterials();
      setAdminMaterials(data);
    } catch (err: any) {
      console.warn('[Load Admin Materials Error]', err);
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (isOpen && adminUser && activeTab === 'manage') {
      loadMaterials();
    }
  }, [isOpen, adminUser, activeTab, loadMaterials]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const { user, error } = await adminSignIn(loginEmail, loginPassword);
      if (error) {
        setLoginError(error);
      } else if (user) {
        setAdminUser(user);
        setLoginPassword('');
        setLoginError(null);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await adminSignOut();
    setAdminUser(null);
    setAdminMaterials([]);
  };

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'zip'].includes(ext || '')) {
        setUploadError(`Invalid file format ".${ext}". Only PDF, DOCX, and ZIP are supported.`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      // Auto-populate title if empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_|-]+/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  // Upload Material handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF, DOCX, or ZIP file to upload.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a descriptive material title.');
      return;
    }
    if (!selectedSubjectId) {
      setUploadError('Please select a target subject.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // 1. Verify and map Subject ID to real database UUID
      const subjectMapping = getSubjectDatabaseUuid(selectedSubjectId);
      const verifiedSubjectUuid = subjectMapping?.uuid || (isValidUuid(selectedSubjectId) ? selectedSubjectId : null);

      if (!verifiedSubjectUuid || !isValidUuid(verifiedSubjectUuid)) {
        setUploadError(`Could not resolve subject "${selectedSubjectId}" to a valid database UUID. Please re-select a course.`);
        setIsUploading(false);
        return;
      }

      // 2. Verify College UUID
      const collegeObj = colleges.find((c) => c.id === selectedCollegeId || c.slug === selectedCollegeId);
      const verifiedCollegeId = collegeObj && isValidUuid(collegeObj.id) ? collegeObj.id : (isValidUuid(selectedCollegeId) ? selectedCollegeId : undefined);

      // 3. Verify Branch UUID
      const branchObj = branches.find((b) => b.id === selectedBranchId || b.slug === selectedBranchId);
      const verifiedBranchId = branchObj && isValidUuid(branchObj.id) ? branchObj.id : (isValidUuid(selectedBranchId) ? selectedBranchId : undefined);

      // 4. Verify Semester UUID
      const semesterObj = semesters.find((s) => s.semester_number === selectedSemesterNumber || s.id === String(selectedSemesterNumber));
      const verifiedSemesterId = semesterObj && isValidUuid(semesterObj.id) ? semesterObj.id : undefined;

      const payload: AdminUploadInput = {
        college_id: verifiedCollegeId,
        college_slug: collegeObj?.slug || 'poornima-college-of-engineering',
        branch_id: verifiedBranchId,
        branch_slug: branchObj?.slug || 'btech-cse',
        semester_id: verifiedSemesterId,
        semester_slug: semesterObj?.slug || `sem-${selectedSemesterNumber}`,
        subject_id: verifiedSubjectUuid,
        subject_slug: subjectMapping?.slug || 'subject',
        category: selectedCategory,
        title: title.trim(),
        unit: unit ? parseInt(unit, 10) : null,
        topic: topic.trim() || null,
        description: description.trim() || null,
        published,
      };

      const result = await adminUploadMaterial(payload, selectedFile);

      setUploadSuccess(`Successfully uploaded "${result.title}" to private storage bucket!`);
      // Reset form
      setTitle('');
      setTopic('');
      setDescription('');
      setUnit('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Notify parent to re-fetch student materials
      onMaterialsUpdated();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload material.');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle published
  const handleTogglePublished = async (mat: AdminMaterialRecord) => {
    setActionInProgressId(mat.id);
    try {
      await adminToggleMaterialPublished(mat.id, !mat.published);
      setAdminMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, published: !m.published } : m))
      );
      onMaterialsUpdated();
    } catch (err: any) {
      alert(`Could not toggle published status: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (mat: AdminMaterialRecord) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${mat.title}"? This will delete both the database record and the storage file.`
    );
    if (!confirmDelete) return;

    setActionInProgressId(mat.id);
    try {
      await adminDeleteMaterial(mat.id, mat.file_path || undefined);
      setAdminMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      onMaterialsUpdated();
    } catch (err: any) {
      alert(`Could not delete material: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Test Open File with temporary signed URL
  const handleTestOpenFile = async (mat: AdminMaterialRecord) => {
    try {
      const signedUrl = await getMaterialSignedUrl(mat.file_path || mat.file_url, 3600);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(`Could not generate signed URL: ${err.message}`);
    }
  };

  // Filtered admin materials
  const filteredMaterials = adminMaterials.filter((m) => {
    if (manageFilterSubject !== 'all' && m.subject_id !== manageFilterSubject) return false;
    if (manageFilterCategory !== 'all' && m.category !== manageFilterCategory) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      id="admin-portal-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border border-[#E0D9CC] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-[#1C1917] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-[#292524]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C2410C]/20 border border-[#C2410C]/40 flex items-center justify-center text-[#F97316]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Nottora Admin Workspace
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#C2410C] text-white font-semibold">
                  Secure Access
                </span>
              </div>
              <p className="text-xs text-[#A8A29E]">
                Authorized portal for academic material curation & private storage uploads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminUser && (
              <button
                id="admin-logout-btn"
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-[#E7E5E4] hover:text-white bg-[#292524] hover:bg-[#383431] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-[#F87171]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              id="admin-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#A8A29E] hover:text-white hover:bg-[#292524] transition-colors"
              title="Close Portal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#FAF8F5]">
          {isCheckingAuth ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-[#C2410C] animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#78716C]">Verifying administrator credentials...</p>
            </div>
          ) : !adminUser ? (
            /* =========================================================
               STATE 1: ADMIN LOGIN SCREEN (Supabase Auth & app_metadata)
               ========================================================= */
            <div className="max-w-md mx-auto py-4">
              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#EAE5DA] shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#C2410C] mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1917]">
                    Administrator Sign In
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Sign in with your Supabase account. Access requires{' '}
                    <code className="text-[#C2410C] bg-[#FFF7ED] px-1 py-0.5 rounded font-mono text-[11px]">
                      app_metadata.is_admin = true
                    </code>.
                  </p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#B91C1C]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{loginError}</div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                      Admin Email
                    </label>
                    <input
                      id="admin-email-input"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@nottora.edu"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                      Password
                    </label>
                    <input
                      id="admin-password-input"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF] transition-all"
                    />
                  </div>

                  <button
                    id="admin-submit-login-btn"
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] active:bg-[#7C2D12] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Authorization...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign In as Admin</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Minimal Admin Setup Instructions Helper */}
                <div className="mt-6 pt-5 border-t border-[#F2EFE9]">
                  <button
                    type="button"
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="text-xs text-[#78716C] hover:text-[#1C1917] flex items-center justify-between w-full font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#C2410C]" />
                      First time setting up your Supabase Admin user?
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        showSetupGuide ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {showSetupGuide && (
                    <div className="mt-3 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DA] text-[11px] text-[#57534E] leading-relaxed space-y-2">
                      <p className="font-semibold text-[#1C1917]">
                        Required 2-Step Supabase Setup:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>
                          Create a user via Supabase Dashboard &rarr; <strong>Authentication</strong>{' '}
                          &rarr; <strong>Users</strong> (or sign up via email).
                        </li>
                        <li>
                          Run this SQL in your <strong>Supabase SQL Editor</strong> to grant admin rights:
                          <pre className="mt-1 p-2 bg-[#1C1917] text-[#4ADE80] font-mono rounded text-[10px] overflow-x-auto select-all">
{`UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb 
WHERE email = 'YOUR_EMAIL_HERE';`}
                          </pre>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================
               STATE 2: AUTHENTICATED ADMIN DASHBOARD & UPLOAD WORKFLOW
               ========================================================= */
            <div>
              {/* Admin Bar Info & Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#EAE5DA]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Logged in as: <span className="font-mono text-[#C2410C]">{adminUser.email}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] font-bold">
                    app_metadata.is_admin: true
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#EAE5DA] p-1 rounded-xl text-xs font-medium">
                  <button
                    id="tab-upload-material-btn"
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'upload'
                        ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs font-semibold'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Upload Material</span>
                  </button>

                  <button
                    id="tab-manage-materials-btn"
                    type="button"
                    onClick={() => {
                      setActiveTab('manage');
                      loadMaterials();
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'manage'
                        ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs font-semibold'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Manage Materials ({adminMaterials.length})</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: UPLOAD MATERIAL */}
              {activeTab === 'upload' && (
                <form onSubmit={handleUploadSubmit} className="space-y-5">
                  {uploadSuccess && (
                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-3 text-xs text-[#15803D]">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#16A34A]" />
                      <div className="flex-1">
                        <span className="font-semibold">{uploadSuccess}</span>
                        <p className="mt-0.5 text-[#166534]">
                          The file is securely stored in the private "materials" bucket and accessible
                          to students via temporary signed URLs.
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 text-xs text-[#B91C1C]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold">Upload Failed</span>
                        <p className="mt-0.5">{uploadError}</p>
                      </div>
                    </div>
                  )}

                  {/* Academic Hierarchy Cascade: College, Branch, Semester, Subject */}
                  <div className="bg-[#FFFFFF] p-4.5 sm:p-5 rounded-2xl border border-[#EAE5DA] shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-3">
                      1. Academic Hierarchy Selection
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                      {/* College */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          College
                        </label>
                        <select
                          id="select-college"
                          value={selectedCollegeId}
                          onChange={(e) => setSelectedCollegeId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
                        >
                          {colleges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          Branch
                        </label>
                        <select
                          id="select-branch"
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Semester */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          Semester
                        </label>
                        <select
                          id="select-semester"
                          value={selectedSemesterNumber}
                          onChange={(e) => setSelectedSemesterNumber(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              Semester {num} {num <= 2 ? '(1st Year)' : num <= 4 ? '(2nd Year)' : '(3rd/4th)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          Subject <span className="text-[#DC2626]">*</span>
                        </label>
                        <select
                          id="select-subject"
                          required
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs font-semibold text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
                        >
                          {availableSubjectOptions.map((s) => (
                            <option key={s.uuid} value={s.uuid}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Material Details: Category, Title, Unit, Topic, Description */}
                  <div className="bg-[#FFFFFF] p-4.5 sm:p-5 rounded-2xl border border-[#EAE5DA] shadow-xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                      2. Material Metadata & Categorization
                    </h3>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#44403C] mb-1.5">
                        Material Category <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {CATEGORY_OPTIONS.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                              selectedCategory === cat.id
                                ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#57534E] border-[#E0D9CC] hover:bg-[#F2EFE9]'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                        Material Title <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="material-title-input"
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Unit 1 Differential Calculus Complete Handwritten Notes"
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF]"
                      />
                    </div>

                    {/* Unit & Topic */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          Unit Number (Optional)
                        </label>
                        <select
                          id="material-unit-select"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#C2410C]"
                        >
                          <option value="">No specific unit / Entire syllabus</option>
                          <option value="1">Unit 1</option>
                          <option value="2">Unit 2</option>
                          <option value="3">Unit 3</option>
                          <option value="4">Unit 4</option>
                          <option value="5">Unit 5</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                          Topic / Scope (Optional)
                        </label>
                        <input
                          id="material-topic-input"
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. Rolle's Theorem, Mean Value Theorems, Maclaurin Series"
                          className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF]"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#44403C] mb-1">
                        Description / Faculty Notes (Optional)
                      </label>
                      <textarea
                        id="material-desc-input"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Key formulas, university exam highlights, or faculty verification notes..."
                        className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF]"
                      />
                    </div>
                  </div>

                  {/* File Selection (PDF/DOCX/ZIP) & Publishing Options */}
                  <div className="bg-[#FFFFFF] p-4.5 sm:p-5 rounded-2xl border border-[#EAE5DA] shadow-xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                      3. Private Storage File & Publication Status
                    </h3>

                    <div className="border-2 border-dashed border-[#E0D9CC] hover:border-[#C2410C] rounded-2xl p-6 text-center bg-[#FAF8F5] transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload-input"
                      />
                      <label
                        htmlFor="file-upload-input"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#C2410C] mb-2.5">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        {selectedFile ? (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-[#16A34A]" />
                              {selectedFile.name}
                            </span>
                            <p className="text-[11px] font-mono text-[#78716C]">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for private upload
                            </p>
                            <span className="text-[10px] text-[#C2410C] underline font-medium">
                              Click to change file
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-[#1C1917]">
                              Click to select or drag & drop file
                            </span>
                            <p className="text-[11px] text-[#78716C]">
                              Accepts PDF, DOCX, or ZIP documents (Stored in private 'materials' bucket)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          id="material-published-checkbox"
                          type="checkbox"
                          checked={published}
                          onChange={(e) => setPublished(e.target.checked)}
                          className="w-4 h-4 rounded text-[#C2410C] focus:ring-[#C2410C] border-[#D6D3D1]"
                        />
                        <span className="text-xs font-medium text-[#44403C]">
                          Publish immediately (Visible to students)
                        </span>
                      </label>

                      <button
                        id="submit-upload-material-btn"
                        type="submit"
                        disabled={isUploading || !selectedFile}
                        className="px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] active:bg-[#7C2D12] text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to Private Bucket...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>Upload Academic Material</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: MANAGE MATERIALS */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  {/* Filters bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#EAE5DA]">
                    <div className="flex items-center gap-2.5 flex-wrap text-xs">
                      <span className="text-[#78716C] font-medium">Filter:</span>
                      <select
                        value={manageFilterSubject}
                        onChange={(e) => setManageFilterSubject(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded-lg text-xs text-[#1C1917]"
                      >
                        <option value="all">All Subjects</option>
                        {availableSubjectOptions.map((s) => (
                          <option key={s.uuid} value={s.uuid}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={manageFilterCategory}
                        onChange={(e) => setManageFilterCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E0D9CC] rounded-lg text-xs text-[#1C1917]"
                      >
                        <option value="all">All Categories</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={loadMaterials}
                      disabled={isLoadingMaterials}
                      className="px-3 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E0D9CC] rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaterials ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Materials Table / List */}
                  {isLoadingMaterials ? (
                    <div className="py-16 text-center bg-[#FFFFFF] rounded-2xl border border-[#EAE5DA]">
                      <RefreshCw className="w-6 h-6 text-[#C2410C] animate-spin mx-auto mb-2" />
                      <p className="text-xs text-[#78716C]">Loading cataloged materials from Supabase...</p>
                    </div>
                  ) : filteredMaterials.length === 0 ? (
                    <div className="py-14 text-center bg-[#FFFFFF] rounded-2xl border border-[#EAE5DA]">
                      <FileText className="w-8 h-8 text-[#A8A29E] mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-[#1C1917]">No materials found</h4>
                      <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1 mb-3">
                        No materials in the database match the selected filters. Use the "Upload Material" tab to add documents.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-3.5 py-1.5 bg-[#C2410C] text-white text-xs font-semibold rounded-lg hover:bg-[#9A3412]"
                      >
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DA] overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF8F5] text-[#78716C] border-b border-[#EAE5DA] uppercase font-mono text-[10px]">
                            <tr>
                              <th className="py-3 px-4">Title & Subject</th>
                              <th className="py-3 px-3">Category</th>
                              <th className="py-3 px-3">File Specs</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F2EFE9]">
                            {filteredMaterials.map((mat) => (
                              <tr key={mat.id} className="hover:bg-[#FAF8F5] transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-[#1C1917] max-w-xs truncate">
                                    {mat.title}
                                  </div>
                                  <div className="text-[11px] text-[#78716C] flex items-center gap-1.5 mt-0.5">
                                    <span className="font-medium text-[#44403C]">
                                      {mat.subject_name}
                                    </span>
                                    {mat.unit && (
                                      <span className="font-mono px-1 py-0.2 bg-[#FAF8F5] rounded border border-[#EAE5DA]">
                                        Unit {mat.unit}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <span className="capitalize text-[11px] px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#44403C] border border-[#E5E0D5]">
                                    {mat.category.replace('-', ' ')}
                                  </span>
                                </td>

                                <td className="py-3 px-3 font-mono text-[11px] text-[#78716C]">
                                  <div className="uppercase font-bold text-[#C2410C]">
                                    {mat.file_type}
                                  </div>
                                  <div>{mat.file_size || '1 MB'}</div>
                                </td>

                                <td className="py-3 px-3">
                                  {mat.published ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                      Published
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                                      Draft
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Test Open signed URL */}
                                    <button
                                      type="button"
                                      onClick={() => handleTestOpenFile(mat)}
                                      title="Test Open File (Signed URL)"
                                      className="p-1.5 rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Toggle Published */}
                                    <button
                                      type="button"
                                      disabled={actionInProgressId === mat.id}
                                      onClick={() => handleTogglePublished(mat)}
                                      title={mat.published ? 'Unpublish Document' : 'Publish Document'}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        mat.published
                                          ? 'text-[#B45309] hover:bg-[#FEF3C7]'
                                          : 'text-[#15803D] hover:bg-[#DCFCE7]'
                                      }`}
                                    >
                                      {mat.published ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    {/* Delete Material */}
                                    <button
                                      type="button"
                                      disabled={actionInProgressId === mat.id}
                                      onClick={() => handleDeleteMaterial(mat)}
                                      title="Permanently Delete Material & Storage File"
                                      className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="bg-[#FAF8F5] px-5 py-3 border-t border-[#EAE5DA] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#78716C] gap-2">
          <span>
            Access route:{' '}
            <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E0D9CC] rounded font-mono text-[10px] text-[#1C1917]">
              /admin
            </kbd>{' '}
            or hash{' '}
            <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E0D9CC] rounded font-mono text-[10px] text-[#1C1917]">
              #admin
            </kbd>
          </span>
          <span className="text-[#A8A29E]">
            Private Bucket Security Active · Signed URLs Enforced
          </span>
        </div>
      </div>
    </div>
  );
};
