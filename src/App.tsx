import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AcademicContext, Material, MaterialCategory, Subject, ViewMode } from './types';
import { 
  CURRENT_CONTEXT, 
  SUBJECTS as DEFAULT_SUBJECTS, 
  ALL_MATERIALS as DEFAULT_MATERIALS,
  ACADEMIC_SESSION_DISPLAY,
  materialBelongsToSubject,
  resolveSubjectIdentifier
} from './data/academicData';
import { 
  fetchSubjects, 
  fetchMaterials, 
  triggerFileDownload,
  isCseYear1Sem1
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
import { ReportProblemModal } from './components/ReportProblemModal';
import { useTheme } from './lib/theme';
import { AdminPortalModal } from './components/AdminPortalModal';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { 
  AppRouteState,
  parseUrlToRouteState, 
  buildUrlFromRouteState, 
  pushRoute, 
  replaceRoute, 
  safeGoBack,
  findSubjectByIdentifier
} from './lib/router';
import { Analytics } from '@vercel/analytics/react';

const SAVED_CONTEXT_STORAGE_KEY = 'nottora_academic_context';

const getInitialSavedContext = (): AcademicContext => {
  try {
    const saved = localStorage.getItem(SAVED_CONTEXT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.branchCode && parsed.year !== undefined && parsed.semester !== undefined) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return CURRENT_CONTEXT;
};

export default function App() {
  // Theme management & synchronization
  useTheme();

  // Academic hierarchy context (restored from localStorage if previously chosen)
  const [context, setContext] = useState<AcademicContext>(getInitialSavedContext);

  // Dynamic Subjects & Materials loaded from Supabase backend (with strict hierarchy isolation)
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const initialCtx = getInitialSavedContext();
    return isCseYear1Sem1(initialCtx) ? DEFAULT_SUBJECTS : [];
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    const initialCtx = getInitialSavedContext();
    return isCseYear1Sem1(initialCtx) ? DEFAULT_MATERIALS : [];
  });
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  // Navigation View Mode (synced with browser URL and history stack)
  const [view, setView] = useState<ViewMode>({ type: 'home' });

  // Search state in Hero
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [selectedHeroCategory, setSelectedHeroCategory] = useState<MaterialCategory | 'all'>('all');

  // Modals & Drawers state (synced with browser history)
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalInitialQuery, setSearchModalInitialQuery] = useState('');
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  // Protected Admin Portal state (accessible via /admin, #admin, ?admin=true, or shortcut)
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

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

  // Report a Problem Modal State
  const [isReportProblemOpen, setIsReportProblemOpen] = useState<boolean>(false);

  // Reusable loader for live academic subjects and materials from Supabase matching active hierarchy
  const refreshAcademicData = useCallback(async (targetContext?: AcademicContext) => {
    const activeCtx = targetContext || context;
    setIsLoadingBackend(true);
    try {
      const [dbSubs, dbMats] = await Promise.all([
        fetchSubjects({
          collegeCode: activeCtx.collegeShort,
          collegeName: activeCtx.college,
          branchCode: activeCtx.branchCode,
          branchName: activeCtx.branch,
          year: activeCtx.year,
          semester: activeCtx.semester,
        }),
        fetchMaterials({
          hierarchy: activeCtx,
        }),
      ]);

      setSubjects(dbSubs || []);
      setMaterials(dbMats || []);
    } catch (err) {
      console.warn('[Supabase loading notice]', err);
      if (!isCseYear1Sem1(activeCtx)) {
        setSubjects([]);
        setMaterials([]);
      }
    } finally {
      setIsLoadingBackend(false);
    }
  }, [context]);

  // Initial load: fetch content for the saved/initial context
  useEffect(() => {
    const initialCtx = getInitialSavedContext();
    refreshAcademicData(initialCtx);
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('nottora_bookmarked_materials', JSON.stringify(Array.from(bookmarkedIds)));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  // Computed subjects with unified, live material counts matching SubjectPage exactly
  const enrichedSubjects = useMemo(() => {
    return subjects.map((sub) => ({
      ...sub,
      totalMaterials: materials.filter((m) => materialBelongsToSubject(m, sub)).length,
    }));
  }, [subjects, materials]);

  // Synchronize component state with browser history / URL
  const syncStateFromLocation = useCallback((isInitial = false) => {
    const route = parseUrlToRouteState(enrichedSubjects, materials);
    setView(route.view);

    if (route.materialId) {
      const mat = materials.find((m) => m.id === route.materialId) || 
                  DEFAULT_MATERIALS.find((m) => m.id === route.materialId);
      setActiveMaterial(mat || null);
    } else {
      setActiveMaterial(null);
    }

    setIsPdfViewerOpen(route.isPdfViewerOpen);
    setIsSearchModalOpen(route.isSearchOpen);
    setIsAdminPortalOpen(route.isAdminOpen);

    if (isInitial) {
      const canonicalUrl = buildUrlFromRouteState(route, enrichedSubjects);
      replaceRoute(route, canonicalUrl);
    }
  }, [enrichedSubjects, materials]);

  // Listen to browser popstate (Back/Forward buttons, native edge-swipe on mobile, touchpad swipe on laptop)
  useEffect(() => {
    const handlePopState = () => {
      syncStateFromLocation(false);
    };
    const handleHashChange = () => {
      syncStateFromLocation(false);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [syncStateFromLocation]);

  // Initial sync on mount
  useEffect(() => {
    syncStateFromLocation(true);
  }, [syncStateFromLocation]);

  // When materials change (e.g. loaded from Supabase), ensure activeMaterial resolves if in route
  useEffect(() => {
    if (materials.length > 0) {
      const route = parseUrlToRouteState(enrichedSubjects, materials);
      if (route.materialId && (!activeMaterial || activeMaterial.id !== route.materialId)) {
        const mat = materials.find((m) => m.id === route.materialId);
        if (mat) {
          setActiveMaterial(mat);
        }
      }
    }
  }, [materials, enrichedSubjects, activeMaterial]);

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
        pushRoute({
          view,
          materialId: activeMaterial?.id || null,
          isPdfViewerOpen,
          isSearchOpen: false,
          isAdminOpen: true,
          internalStep: (window.history.state?.internalStep || 0) + 1,
        }, '/admin');
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
  }, [view, activeMaterial, isPdfViewerOpen]);

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

  // Save updated academic context, immediately clear old content, and fetch new cohort data
  const handleSaveContext = useCallback(async (newCtx: AcademicContext) => {
    setContext(newCtx);
    try {
      localStorage.setItem(SAVED_CONTEXT_STORAGE_KEY, JSON.stringify(newCtx));
    } catch {
      // ignore
    }

    // 1. Clear old displayed content IMMEDIATELY
    setSubjects([]);
    setMaterials([]);
    setActiveMaterial(null);
    setIsPdfViewerOpen(false);

    // If currently on a subject page, navigate home to avoid showing stale subject
    if (view.type === 'subject') {
      setView({ type: 'home' });
      replaceRoute({
        view: { type: 'home' },
        materialId: null,
        isPdfViewerOpen: false,
        isSearchOpen: false,
        isAdminOpen: false,
        internalStep: (window.history.state?.internalStep || 0) + 1,
      }, '/');
    }

    addToast(
      'info',
      'Academic Context Updated',
      `Active Cohort: ${newCtx.collegeShort} · ${newCtx.branchCode} · Year ${newCtx.year} · Sem ${newCtx.semester}`
    );

    // 2. Fetch content strictly for the newly selected hierarchy
    await refreshAcademicData(newCtx);
  }, [view, refreshAcademicData, addToast]);

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

  // Navigation handlers with standard browser History stack integration
  const handleNavigateHome = () => {
    const nextRoute: AppRouteState = {
      view: { type: 'home' },
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    setView({ type: 'home' });
    setActiveMaterial(null);
    setIsPdfViewerOpen(false);
    setIsSearchModalOpen(false);
    setIsAdminPortalOpen(false);
    pushRoute(nextRoute, '/');
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
    handleNavigateHome();
    setTimeout(() => {
      const el = document.getElementById('subjects-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectSubject = (subjectId: string, initialCategory?: MaterialCategory | 'all') => {
    const matched = findSubjectByIdentifier(subjectId, enrichedSubjects);
    const resolvedId = matched ? matched.id : subjectId;
    const cat = initialCategory && initialCategory !== 'all' ? initialCategory : undefined;

    const nextView: ViewMode = {
      type: 'subject',
      subjectId: resolvedId,
      initialCategory: cat,
    };

    setView(nextView);
    setActiveMaterial(null);
    setIsPdfViewerOpen(false);

    const nextRoute: AppRouteState = {
      view: nextView,
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    const url = buildUrlFromRouteState(nextRoute, enrichedSubjects);
    pushRoute(nextRoute, url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectCategoryChange = (category: MaterialCategory | 'all') => {
    if (view.type !== 'subject') return;
    const cat = category !== 'all' ? category : undefined;
    const nextView: ViewMode = {
      type: 'subject',
      subjectId: view.subjectId,
      initialCategory: cat,
    };
    setView(nextView);

    const nextRoute: AppRouteState = {
      view: nextView,
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    const url = buildUrlFromRouteState(nextRoute, enrichedSubjects);
    pushRoute(nextRoute, url);
  };

  const handleSelectCategory = (category: MaterialCategory) => {
    const nextView: ViewMode = { type: 'category', category };
    setView(nextView);
    setActiveMaterial(null);
    setIsPdfViewerOpen(false);

    const nextRoute: AppRouteState = {
      view: nextView,
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    const url = buildUrlFromRouteState(nextRoute, enrichedSubjects);
    pushRoute(nextRoute, url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearchSubmit = (query: string) => {
    setSearchModalInitialQuery(query);
    setIsSearchModalOpen(true);
  };

  const handleOpenMaterial = (material: Material) => {
    setActiveMaterial(material);
    setIsPdfViewerOpen(false);

    let currentView = view;
    // If opened from home or search without an active subject, attach subject context if available
    if (currentView.type === 'home') {
      const sub = enrichedSubjects.find((s) => materialBelongsToSubject(material, s));
      if (sub) {
        currentView = {
          type: 'subject',
          subjectId: sub.id,
          initialCategory: material.category,
        };
        setView(currentView);
      }
    }

    const nextRoute: AppRouteState = {
      view: currentView,
      materialId: material.id,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    const url = buildUrlFromRouteState(nextRoute, enrichedSubjects);
    pushRoute(nextRoute, url);
  };

  const handleCloseMaterial = () => {
    if (isPdfViewerOpen) {
      handleClosePdfViewer();
      return;
    }
    if (activeMaterial) {
      const currentStep = window.history.state?.internalStep || 0;
      if (currentStep > 0) {
        window.history.back();
      } else {
        setActiveMaterial(null);
        const nextRoute: AppRouteState = {
          view,
          materialId: null,
          isPdfViewerOpen: false,
          isSearchOpen: false,
          isAdminOpen: false,
          internalStep: 0,
        };
        replaceRoute(nextRoute, buildUrlFromRouteState(nextRoute, enrichedSubjects));
      }
    }
  };

  const handleOpenPdfViewer = (material: Material) => {
    setIsPdfViewerOpen(true);
    const nextRoute: AppRouteState = {
      view,
      materialId: material.id,
      isPdfViewerOpen: true,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: (window.history.state?.internalStep || 0) + 1,
    };
    const url = buildUrlFromRouteState(nextRoute, enrichedSubjects);
    pushRoute(nextRoute, url);
  };

  const handleClosePdfViewer = () => {
    const currentStep = window.history.state?.internalStep || 0;
    if (currentStep > 0) {
      window.history.back();
    } else {
      setIsPdfViewerOpen(false);
      if (activeMaterial) {
        const nextRoute: AppRouteState = {
          view,
          materialId: activeMaterial.id,
          isPdfViewerOpen: false,
          isSearchOpen: false,
          isAdminOpen: false,
          internalStep: 0,
        };
        replaceRoute(nextRoute, buildUrlFromRouteState(nextRoute, enrichedSubjects));
      }
    }
  };

  const handleBackFromSubject = () => {
    safeGoBack('/');
  };

  const handleBackFromCategory = () => {
    safeGoBack('/');
  };

  const handleCloseAdminPortal = () => {
    setIsAdminPortalOpen(false);
    safeGoBack('/');
  };

  const currentSubjectObj = useMemo(() => {
    if (view.type === 'subject') {
      const resolvedCode = resolveSubjectIdentifier(view.subjectId);
      return (
        enrichedSubjects.find(
          (s) => (resolvedCode && (s.code === resolvedCode || s.id === resolvedCode)) ||
                 s.id === view.subjectId || 
                 s.code === view.subjectId || 
                 s.slug === view.subjectId ||
                 (s.uuid && s.uuid === view.subjectId)
        ) || enrichedSubjects[0]
      );
    }
    return null;
  }, [view, enrichedSubjects]);

  // Compute clean, human-readable breadcrumb / context for Problem Reports
  const reportProblemPageContext = useMemo(() => {
    if (activeMaterial) {
      const unitPart = activeMaterial.unitNumber ? ` → Unit ${activeMaterial.unitNumber}` : '';
      return `${activeMaterial.subjectName}${unitPart} → ${activeMaterial.title} (${activeMaterial.category})`;
    }
    if (view.type === 'subject') {
      return `${currentSubjectObj?.name || 'Subject'} (${currentSubjectObj?.code || ''}) → All Units`;
    }
    if (view.type === 'category') {
      const catTitle = view.category === 'important-questions' ? 'Important Questions' : view.category === 'pyqs' ? 'PYQs' : view.category === 'lab-manuals' ? 'Lab Manuals' : 'Notes';
      return `Category: ${catTitle}`;
    }
    if (view.type === 'search') {
      return `Search: "${view.query}"`;
    }
    return `${context.collegeShort} · ${context.branchCode} · Sem ${context.semester} · Home`;
  }, [activeMaterial, view, currentSubjectObj, context]);

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
        onOpenReportProblem={() => setIsReportProblemOpen(true)}
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
                        onOpen={handleOpenMaterial}
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

            {/* Subjects Section (Syllabus Structure) */}
            <div className="mb-14">
              <SubjectGrid
                subjects={enrichedSubjects}
                onSelectSubject={(id) => handleSelectSubject(id)}
                context={context}
                onOpenContextModal={() => setIsContextModalOpen(true)}
              />
            </div>

            {/* Recent Materials Section */}
            <RecentMaterials
              materials={materials}
              onOpenMaterial={handleOpenMaterial}
              onDownloadMaterial={handleDownload}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onViewAllMaterials={handleNavigateSubjects}
              context={context}
            />

            {/* Study Motivation / Focus Section */}
            <StudyMotivation />
          </div>
        )}

        {view.type === 'subject' && currentSubjectObj && (
          <SubjectPage
            subject={currentSubjectObj}
            materials={materials}
            onBack={handleBackFromSubject}
            onNavigateHome={handleNavigateHome}
            onOpenMaterial={handleOpenMaterial}
            onDownloadMaterial={handleDownload}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            initialCategory={view.initialCategory}
            onSelectCategory={handleSubjectCategoryChange}
          />
        )}

        {view.type === 'category' && (
          <CategoryPage
            category={view.category}
            subjects={enrichedSubjects}
            materials={materials}
            onBack={handleBackFromCategory}
            onOpenMaterial={handleOpenMaterial}
            onDownloadMaterial={handleDownload}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            context={context}
            onOpenContextModal={() => setIsContextModalOpen(true)}
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
        onClose={handleCloseMaterial}
        onDownload={handleDownload}
        isBookmarked={activeMaterial ? bookmarkedIds.has(activeMaterial.id) : false}
        onToggleBookmark={handleToggleBookmark}
        isPdfViewerOpen={isPdfViewerOpen}
        onOpenPdfViewer={handleOpenPdfViewer}
        onClosePdfViewer={handleClosePdfViewer}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        subjects={enrichedSubjects}
        materials={materials}
        onOpenMaterial={handleOpenMaterial}
        onSelectSubject={(id) => handleSelectSubject(id)}
        initialQuery={searchModalInitialQuery}
        context={context}
      />

      {/* Study Stash / Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksDrawerOpen}
        onClose={() => setIsBookmarksDrawerOpen(false)}
        bookmarkedMaterials={bookmarkedMaterialsList}
        onOpenMaterial={handleOpenMaterial}
        onDownloadMaterial={handleDownload}
        onRemoveBookmark={handleToggleBookmark}
        onClearAll={() => setBookmarkedIds(new Set())}
      />

      {/* Academic Context Switcher Modal */}
      <AcademicContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        currentContext={context}
        onSaveContext={handleSaveContext}
      />

      {/* Report a Problem Modal */}
      <ReportProblemModal
        isOpen={isReportProblemOpen}
        onClose={() => setIsReportProblemOpen(false)}
        pageContext={reportProblemPageContext}
        route={typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'}
      />

      {/* Protected Admin Portal Modal (Triggered via /admin, #admin, ?admin=true, or shortcut) */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={handleCloseAdminPortal}
        subjects={enrichedSubjects}
        onMaterialsUpdated={() => refreshAcademicData(context)}
      />

      {/* Toast Feedback Messages */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
