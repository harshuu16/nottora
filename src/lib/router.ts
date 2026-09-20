import { Material, MaterialCategory, Subject, ViewMode } from '../types';
import { resolveSubjectIdentifier } from '../data/academicData';

export interface AppRouteState {
  view: ViewMode;
  materialId: string | null;
  isPdfViewerOpen: boolean;
  isSearchOpen: boolean;
  isAdminOpen: boolean;
  internalStep: number;
}

const VALID_CATEGORIES: MaterialCategory[] = [
  'notes',
  'important-questions',
  'pyqs',
  'lab-manuals',
  'other',
];

/**
 * Check if the given category string is a valid MaterialCategory
 */
export function isValidMaterialCategory(cat?: string | null): cat is MaterialCategory {
  if (!cat) return false;
  return VALID_CATEGORIES.includes(cat as MaterialCategory);
}

/**
 * Find the canonical subject from a slug, code, id, or UUID
 */
export function findSubjectByIdentifier(
  identifier: string,
  subjects: Subject[]
): Subject | null {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  // 1. Direct slug or id match
  const direct = subjects.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      (s.slug && s.slug.toLowerCase() === cleanId) ||
      (s.code && s.code.toLowerCase() === cleanId) ||
      (s.shortName && s.shortName.toLowerCase() === cleanId) ||
      (s.uuid && s.uuid.toLowerCase() === cleanId)
  );
  if (direct) return direct;

  // 2. Canonical resolution via resolveSubjectIdentifier
  const resolvedCode = resolveSubjectIdentifier(identifier);
  if (resolvedCode) {
    const matched = subjects.find(
      (s) =>
        (s.code && s.code.toLowerCase() === resolvedCode.toLowerCase()) ||
        s.id.toLowerCase() === resolvedCode.toLowerCase() ||
        (s.slug && s.slug.toLowerCase() === resolvedCode.toLowerCase())
    );
    if (matched) return matched;
  }

  // 3. Partial or name match fallback
  const nameMatch = subjects.find(
    (s) =>
      s.name.toLowerCase().includes(cleanId) ||
      (s.code && s.code.length > 0 && cleanId.includes(s.code.toLowerCase()))
  );
  return nameMatch || null;
}

/**
 * Parse current browser URL and window.history.state into AppRouteState
 */
export function parseUrlToRouteState(
  subjects: Subject[] = [],
  materials: Material[] = []
): AppRouteState {
  if (typeof window === 'undefined') {
    return {
      view: { type: 'home' },
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: 0,
    };
  }

  try {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    const hash = window.location.hash || '';
    const searchParams = new URLSearchParams(window.location.search);
    const historyState = (window.history.state || {}) as Partial<AppRouteState>;

    // 1. Check Admin Route
    const isAdminOpen =
      pathname === '/admin' ||
      pathname === '/admin/login' ||
      hash.toLowerCase() === '#admin' ||
      hash.toLowerCase() === '#/admin' ||
      searchParams.get('admin') === 'true' ||
      !!historyState.isAdminOpen;

    // 2. Check PDF viewer flag
    const isPdfViewerOpen =
      searchParams.get('view') === 'pdf' ||
      searchParams.get('viewer') === 'pdf' ||
      pathname.endsWith('/view') ||
      !!historyState.isPdfViewerOpen;

    // 3. Extract Material ID (supports paths, query param ?material=..., or legacy hash #material-...)
    let materialId: string | null = null;

    if (searchParams.get('material')) {
      materialId = searchParams.get('material');
    } else if (searchParams.get('m')) {
      materialId = searchParams.get('m');
    } else if (hash.startsWith('#material-')) {
      materialId = hash.replace('#material-', '');
    } else if (historyState.materialId) {
      materialId = historyState.materialId;
    }

    // 4. Parse Path Segments
    // Supported paths:
    // /subject/:subjectId
    // /subject/:subjectId/:category
    // /subject/:subjectId/:category/material/:materialId
    // /subject/:subjectId/material/:materialId
    // /category/:category
    // /category/:category/material/:materialId
    // /material/:materialId
    let effectivePath = pathname;
    if (hash.startsWith('#/')) {
      // Hash-based path fallback (e.g. #/subject/beee)
      effectivePath = hash.substring(1);
    }

    const segments = effectivePath
      .split('/')
      .filter(Boolean)
      .map((seg) => decodeURIComponent(seg));

    let view: ViewMode = { type: 'home' };

    // Check material inside path segments
    const matIndex = segments.indexOf('material');
    if (matIndex !== -1 && segments[matIndex + 1]) {
      materialId = segments[matIndex + 1];
    }

    if (segments[0] === 'subject' && segments[1]) {
      const rawSubjectId = segments[1];
      const matchedSubject = findSubjectByIdentifier(rawSubjectId, subjects);
      const canonicalSubjectId = matchedSubject ? matchedSubject.id : rawSubjectId;

      let initialCat: MaterialCategory | undefined = undefined;
      // Check if segments[2] is a category (and not 'material')
      if (segments[2] && segments[2] !== 'material') {
        if (isValidMaterialCategory(segments[2])) {
          initialCat = segments[2];
        }
      }

      view = {
        type: 'subject',
        subjectId: canonicalSubjectId,
        initialCategory: initialCat,
      };
    } else if (segments[0] === 'category' && segments[1]) {
      const rawCat = segments[1];
      if (isValidMaterialCategory(rawCat)) {
        view = {
          type: 'category',
          category: rawCat,
        };
      }
    } else if (segments[0] === 'material' && segments[1]) {
      materialId = segments[1];
      // Try to determine subject context from material if possible
      const foundMat = materials.find((m) => m.id === materialId);
      if (foundMat) {
        const sub = findSubjectByIdentifier(foundMat.subjectId || foundMat.subjectName, subjects);
        if (sub) {
          view = {
            type: 'subject',
            subjectId: sub.id,
            initialCategory: foundMat.category,
          };
        }
      }
    }

    // If materialId was detected from query or hash, but view is home, attempt to deduce subject
    if (materialId && view.type === 'home') {
      const foundMat = materials.find((m) => m.id === materialId);
      if (foundMat) {
        const sub = findSubjectByIdentifier(foundMat.subjectId || foundMat.subjectName, subjects);
        if (sub) {
          view = {
            type: 'subject',
            subjectId: sub.id,
            initialCategory: foundMat.category,
          };
        }
      }
    }

    // 5. Search Modal Flag
    const isSearchOpen =
      searchParams.get('search') === 'true' ||
      !!historyState.isSearchOpen;

    const internalStep =
      typeof historyState.internalStep === 'number' ? historyState.internalStep : 0;

    return {
      view,
      materialId,
      isPdfViewerOpen,
      isSearchOpen,
      isAdminOpen,
      internalStep,
    };
  } catch (err) {
    console.warn('[Router parse warning]', err);
    return {
      view: { type: 'home' },
      materialId: null,
      isPdfViewerOpen: false,
      isSearchOpen: false,
      isAdminOpen: false,
      internalStep: 0,
    };
  }
}

/**
 * Build canonical URL string from AppRouteState
 */
export function buildUrlFromRouteState(
  state: AppRouteState,
  subjects: Subject[] = []
): string {
  if (state.isAdminOpen) {
    return '/admin';
  }

  let basePath = '/';

  if (state.view.type === 'subject') {
    const matched = findSubjectByIdentifier(state.view.subjectId, subjects);
    const slug = matched?.slug || matched?.code?.toLowerCase() || state.view.subjectId;
    basePath = `/subject/${encodeURIComponent(slug)}`;

    if (state.view.initialCategory && state.view.initialCategory !== ('all' as any)) {
      basePath += `/${encodeURIComponent(state.view.initialCategory)}`;
    }
  } else if (state.view.type === 'category') {
    basePath = `/category/${encodeURIComponent(state.view.category)}`;
  }

  // Material appending
  if (state.materialId) {
    if (basePath === '/') {
      basePath = `/material/${encodeURIComponent(state.materialId)}`;
    } else {
      basePath += `/material/${encodeURIComponent(state.materialId)}`;
    }
  }

  // Query parameters
  const params = new URLSearchParams();
  if (state.isPdfViewerOpen) {
    params.set('view', 'pdf');
  }
  if (state.isSearchOpen) {
    params.set('search', 'true');
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Push a new route state to browser history stack.
 * Ensures that normal page navigation creates standard history entries.
 */
export function pushRoute(state: AppRouteState, url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const nextStep = (window.history.state?.internalStep || 0) + 1;
    const stateToSave: AppRouteState = {
      ...state,
      internalStep: nextStep,
    };
    window.history.pushState(stateToSave, '', url);
  } catch (err) {
    console.warn('[pushRoute error]', err);
  }
}

/**
 * Replace the current route state without adding a new entry.
 * Useful for initial hydration or URL normalization.
 */
export function replaceRoute(state: AppRouteState, url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentStep = window.history.state?.internalStep || 0;
    const stateToSave: AppRouteState = {
      ...state,
      internalStep: currentStep,
    };
    window.history.replaceState(stateToSave, '', url);
  } catch (err) {
    console.warn('[replaceRoute error]', err);
  }
}

/**
 * Safely navigates back if there is prior history in this session,
 * otherwise navigates to the fallback URL.
 */
export function safeGoBack(fallbackUrl: string = '/'): void {
  if (typeof window === 'undefined') return;
  try {
    const currentStep = window.history.state?.internalStep || 0;
    if (currentStep > 0) {
      window.history.back();
    } else {
      window.history.replaceState({ internalStep: 0 }, '', fallbackUrl);
      window.dispatchEvent(new PopStateEvent('popstate', { state: { internalStep: 0 } }));
    }
  } catch {
    window.location.href = fallbackUrl;
  }
}
