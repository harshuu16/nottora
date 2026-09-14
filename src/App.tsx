import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AcademicContext, Material, MaterialCategory, Subject, ViewMode } from './types';
import { 
  CURRENT_CONTEXT, 
  SUBJECTS as DEFAULT_SUBJECTS, 
  ALL_MATERIALS as DEFAULT_MATERIALS,
  ACADEMIC_SESSION_DISPLAY
} from './data/academicData';
import { 
  fetchAcademicHierarchy,
  fetchSubjects, 
  fetchMaterials, 
  triggerFileDownload 
} from './lib/supabase';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuickAccess } from './components/QuickAccess';
import { SubjectGrid } from './components/SubjectGrid';
import { RecentMaterials } from './components/RecentMaterials';
import { MaterialCard } from './components/MaterialCard';
import { StudyMotivation } from './components/StudyMotivation';
import { SubjectPage } from './components/SubjectPage';
import { CategoryPage } from './components/CategoryPage';
import { MaterialModal } from './components/MaterialModal';
import { SearchModal } from './components/SearchModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { AcademicContextModal } from './components/AcademicContextModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';

/**
 * Helper to check if current window URL represents the hidden admin route
 * Supports:
 *  - Path: /admin, /admin/
 *  - Path: /admin/login, /admin/login/
 *  - Hash: #admin, #/admin
 *  - Query: ?admin=true
 */
function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase().replace(/\/+$/, '');
    const searchParams = new URLSearchParams(window.location.search);

    return (
      rawPath === '/admin' ||
      rawPath === '/admin/login' ||
      hash === '#admin' ||
      hash === '#/admin' ||
      searchParams.get('admin') === 'true'
    );
  } catch {
    return false;
  }
}

export default function App() {
  // Academic hierarchy context
  const [context, setContext] = useState<AcademicContext>(CURRENT_CONTEXT);

  // Dynamic Subjects & Materials loaded from Supabase backend (with graceful local fallback)
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  // Navigation View Mode
  const [view, setView] = useState<ViewMode>({ type: 'home' });

  // Search state in Hero
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [selectedHeroCategory, setSelectedHeroCategory] = useState<MaterialCategory | 'all'>('all');

  // Modals & Drawers state
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalInitialQuery, setSearchModalInitialQuery] = useState('');
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  // Protected Admin Portal state (accessible via hidden /admin route, #admin, ?admin=true, or shortcut)
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(() => checkIsAdminRoute());

  // Bookmarked materials (saved in localStorage if available)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nottora_bookmarked_materials');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Reusable loader for live academic subjects and materials from Supabase
  const refreshAcademicData = useCallback(async () => {
    setIsLoadingBackend(true);
    try {
      const [hierarchy, dbSubs, dbMats] = await Promise.all([
        fetchAcademicHierarchy(),
        fetchSubjects(),
        fetchMaterials(),
      ]);
      if (hierarchy && hierarchy.college && hierarchy.branch && hierarchy.semester) {
        setContext({
          college: hierarchy.college.name,
          collegeShort: hierarchy.college.code,
          branch: hierarchy.branch.name,
          branchCode: hierarchy.branch.code,
          year: hierarchy.semester.year_number,
          semester: hierarchy.semester.semester_number,
        });
      }
      if (dbSubs && dbSubs.length > 0) setSubjects(dbSubs);
      if (dbMats) setMaterials(dbMats);
    } catch (err) {
      console.warn('[Supabase loading notice]', err);
    } finally {
      setIsLoadingBackend(false);
    }
  }, []);

  useEffect(() => {
    refreshAcademicData();
  }, [refreshAcademicData]);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('nottora_bookmarked_materials', JSON.stringify(Array.from(bookmarkedIds)));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  // Listen to navigation events (popstate, hashchange) for hidden /admin route, #admin, etc.
  useEffect(() => {
    const handleRouteSync = () => {
      if (checkIsAdminRoute()) {
        setIsAdminPortalOpen(true);
      }
    };
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    handleRouteSync();
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  // Global Keyboard Shortcuts (⌘K or Ctrl+K for search; Ctrl+Shift+A or Cmd+Shift+A / Ctrl+Alt+A for Admin Portal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isKeyA = e.key.toLowerCase() === 'a' || e.code === 'KeyA';
      const isCtrlOrMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // Admin Portal Shortcut:
      // Primary: Ctrl+Shift+A (Windows/Linux) or Cmd+Shift+A (Mac)
      // Fallback: Ctrl+Alt+A or Alt+Shift+A (if Chrome intercepts Ctrl+Shift+A for Tab Search)
      if ((isCtrlOrMeta && isShift && isKeyA) || (isCtrlOrMeta && isAlt && isKeyA) || (isAlt && isShift && isKeyA)) {
        e.preventDefault();
        setIsAdminPortalOpen(true);
        try {
          if (window.location.pathname.toLowerCase() !== '/admin') {
            window.history.replaceState(null, '', '/admin');
          }
        } catch {
          // ignore
        }
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle Bookmark
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      const mat = materials.find((m) => m.id === id);
      if (next.has(id)) {
        next.delete(id);
        addToast('bookmark', 'Removed from Stash', mat ? `Removed "${mat.title}"` : 'Material unpinned.');
      } else {
        next.add(id);
        addToast('bookmark', 'Saved to Study Stash', mat ? `Pinned "${mat.title}" for quick revision.` : 'Added to saved materials.');
      }
      return next;
    });
  };

  // Handle Download
  const handleDownload = async (material: Material) => {
    addToast(
      'download',
      'Download Initiated',
      `Downloading ${material.fileName} (${material.fileSize}). Ready for offline study.`
    );
    try {
      await triggerFileDownload(material.fileUrl, material.fileName, material.filePath);
    } catch (err) {
      console.warn('Direct file download:', err);
    }
  };

  // Quick category material counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<MaterialCategory, number> = {
      notes: 0,
      'important-questions': 0,
      pyqs: 0,
      'lab-manuals': 0,
      other: 0,
    };
    materials.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category]++;
      }
    });
    return counts;
  }, [materials]);

  // Filtered materials on homepage if hero search or category filter active
  const filteredHomeMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedHeroCategory !== 'all' && m.category !== selectedHeroCategory) {
        return false;
      }
      if (heroSearchQuery.trim()) {
        const q = heroSearchQuery.toLowerCase().trim();
        const searchable = `${m.title} ${m.subjectName} ${m.topic} ${m.description} unit ${m.unitNumber || ''}`.toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [materials, heroSearchQuery, selectedHeroCategory]);

  // Bookmarked materials objects
  const bookmarkedMaterialsList = useMemo(() => {
    return materials.filter((m) => bookmarkedIds.has(m.id));
  }, [materials, bookmarkedIds]);

  // Navigation handlers
  const handleNavigateHome = () => {
    setView({ type: 'home' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSubjects = () => {
    if (view.type === 'home') {
      const el = document.getElementById('subjects-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    setView({ type: 'home' });
    setTimeout(() => {
      const el = document.getElementById('subjects-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectSubject = (subjectId: string, initialCategory?: MaterialCategory) => {
    const matched = subjects.find(
      (s) => s.id === subjectId || s.slug === subjectId || s.code.toLowerCase() === subjectId.toLowerCase()
    );
    const resolvedId = matched ? matched.id : subjectId;
    setView({ type: 'subject', subjectId: resolvedId, initialCategory });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (category: MaterialCategory) => {
    setView({ type: 'category', category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearchSubmit = (query: string) => {
    setSearchModalInitialQuery(query);
    setIsSearchModalOpen(true);
  };

  const currentSubjectObj = useMemo(() => {
    if (view.type === 'subject') {
      return (
        subjects.find(
          (s) => s.id === view.subjectId || s.slug === view.subjectId
        ) || subjects[0]
      );
    }
    return null;
  }, [view, subjects]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col font-sans">
      {/* Global Header */}
      <Header
        context={context}
        onNavigateHome={handleNavigateHome}
        onNavigateSubjects={handleNavigateSubjects}
        onNavigateCategory={handleSelectCategory}
        onOpenSearch={() => {
          setSearchModalInitialQuery('');
          setIsSearchModalOpen(true);
        }}
        onOpenBookmarks={() => setIsBookmarksDrawerOpen(true)}
        onOpenContextModal={() => setIsContextModalOpen(true)}
        bookmarksCount={bookmarkedIds.size}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {view.type === 'home' && (
          <div>
            {/* Compact Hero with Search & Quick Category Filters */}
            <Hero
              context={context}
              onOpenContextModal={() => setIsContextModalOpen(true)}
              searchQuery={heroSearchQuery}
              onSearchChange={setHeroSearchQuery}
              onSearchSubmit={handleHeroSearchSubmit}
              selectedCategory={selectedHeroCategory}
              onCategoryChange={setSelectedHeroCategory}
              totalMaterialsCount={materials.length}
            />

            {/* If user typed a search query in the hero, show instant matching materials banner */}
            {heroSearchQuery.trim() && (
              <div className="mb-10 p-5 rounded-2xl bg-[#FFFFFF] border border-[#FED7AA] shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-[#1C1917]">
                    Found {filteredHomeMaterials.length} materials matching "{heroSearchQuery}"
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroSearchQuery('')}
                    className="text-xs font-semibold text-[#C2410C] hover:underline"
                  >
                    Clear Search
                  </button>
                </div>

                {filteredHomeMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHomeMaterials.map((mat) => (
                      <MaterialCard
                        key={mat.id}
                        material={mat}
                        onOpen={setActiveMaterial}
                        onDownload={handleDownload}
                        isBookmarked={bookmarkedIds.has(mat.id)}
                        onToggleBookmark={handleToggleBookmark}
                        showSubjectBadge={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-[#78716C]">
                    No files found matching "{heroSearchQuery}". Try browsing subjects or clearing filters.
                  </div>
                )}
              </div>
            )}

            {/* Quick Access Cards */}
            <QuickAccess
              onSelectCategory={handleSelectCategory}
              materialsCounts={categoryCounts}
            />

            {/* Subjects Section (All 8 Subjects) */}
            <div className="mb-14">
              <SubjectGrid
                subjects={subjects}
                onSelectSubject={(id) => handleSelectSubject(id)}
              />
            </div>

            {/* Recent Materials Section */}
            <RecentMaterials
              materials={materials}
              onOpenMaterial={setActiveMaterial}
              onDownloadMaterial={handleDownload}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onViewAllMaterials={handleNavigateSubjects}
            />

            {/* Study Motivation / Focus Section */}
            <StudyMotivation />
          </div>
        )}

        {view.type === 'subject' && currentSubjectObj && (
          <SubjectPage
            subject={currentSubjectObj}
            materials={materials}
            onBack={handleNavigateHome}
            onOpenMaterial={setActiveMaterial}
            onDownloadMaterial={handleDownload}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            initialCategory={view.initialCategory}
          />
        )}

        {view.type === 'category' && (
          <CategoryPage
            category={view.category}
            subjects={subjects}
            materials={materials}
            onBack={handleNavigateHome}
            onOpenMaterial={setActiveMaterial}
            onDownloadMaterial={handleDownload}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigateHome={handleNavigateHome}
        onNavigateSubjects={handleNavigateSubjects}
        onNavigateCategory={handleSelectCategory}
        onSelectSubject={(id) => handleSelectSubject(id)}
      />

      {/* Reader / Document Detail Preview Modal */}
      <MaterialModal
        material={activeMaterial}
        onClose={() => setActiveMaterial(null)}
        onDownload={handleDownload}
        isBookmarked={activeMaterial ? bookmarkedIds.has(activeMaterial.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        subjects={subjects}
        materials={materials}
        onOpenMaterial={setActiveMaterial}
        onSelectSubject={(id) => handleSelectSubject(id)}
        initialQuery={searchModalInitialQuery}
      />

      {/* Study Stash / Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksDrawerOpen}
        onClose={() => setIsBookmarksDrawerOpen(false)}
        bookmarkedMaterials={bookmarkedMaterialsList}
        onOpenMaterial={setActiveMaterial}
        onDownloadMaterial={handleDownload}
        onRemoveBookmark={handleToggleBookmark}
        onClearAll={() => setBookmarkedIds(new Set())}
      />

      {/* Academic Context Switcher Modal */}
      <AcademicContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        currentContext={context}
        onSaveContext={(newCtx) => {
          setContext(newCtx);
          addToast('info', 'Academic Context Updated', `Active Cohort: ${newCtx.collegeShort} · ${newCtx.branchCode} · Sem ${newCtx.semester} · ${newCtx.session || ACADEMIC_SESSION_DISPLAY}`);
        }}
      />

      {/* Protected Admin Portal Modal (Triggered via /admin, #admin, ?admin=true, or shortcut) */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => {
          setIsAdminPortalOpen(false);
          try {
            const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
            const isSpecialPath = rawPath === '/admin' || rawPath === '/admin/login';
            const isSpecialHash = window.location.hash === '#admin' || window.location.hash === '#/admin';
            const isSpecialSearch = new URLSearchParams(window.location.search).get('admin') === 'true';

            if (isSpecialPath || isSpecialHash || isSpecialSearch) {
              window.history.replaceState(null, '', '/');
            }
          } catch {
            // ignore
          }
        }}
        subjects={subjects}
        onMaterialsUpdated={refreshAcademicData}
      />

      {/* Toast Feedback Messages */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
