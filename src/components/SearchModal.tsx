import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  FileText, 
  CornerDownLeft,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Material, Subject, MaterialCategory } from '../types';
import { searchMaterialsDb, isSupabaseConfigured } from '../lib/supabase';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  materials: Material[];
  onOpenMaterial: (material: Material) => void;
  onSelectSubject: (subjectId: string) => void;
  initialQuery?: string;
}

const SAMPLE_SEARCHES = [
  'Math Unit 1',
  'C pointers',
  'Physics important questions',
  'BEEE lab manual',
  'Engineering Chemistry hardness',
  'Newton Rings experiment',
  'Rank of Matrix',
  'Thevenin Theorem',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  subjects,
  materials,
  onOpenMaterial,
  onSelectSubject,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState<'all' | MaterialCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dbMaterials, setDbMaterials] = useState<Material[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSearchError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced search querying database or in-memory materials
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setIsLoading(false);
      setSearchError(null);
      setDbMaterials(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      if (isSupabaseConfigured()) {
        try {
          const results = await searchMaterialsDb(trimmed, selectedCat);
          setDbMaterials(results);
          setIsLoading(false);
        } catch (err: any) {
          console.error('[Search Query Error]', err);
          setSearchError('Unable to query materials database. Please try again.');
          setIsLoading(false);
        }
      } else {
        // Local in-memory search
        setIsLoading(false);
        setDbMaterials(null); // falls back to local filter below
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, selectedCat]);

  // Matching subjects calculation
  const matchingSubjects = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    return subjects.filter((s) => {
      const name = s.name.toLowerCase();
      const code = s.code.toLowerCase();
      const desc = s.shortDescription.toLowerCase();
      return words.every((w) => name.includes(w) || code.includes(w) || desc.includes(w));
    });
  }, [query, subjects]);

  // Matching materials calculation (combines DB search if active, or local materials array)
  const matchingMaterials = useMemo(() => {
    if (!query.trim()) return [];

    if (dbMaterials !== null) {
      return dbMaterials;
    }

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);

    return materials.filter((m) => {
      if (selectedCat !== 'all' && m.category !== selectedCat) return false;

      const searchableString = `
        ${m.title} 
        ${m.subjectName} 
        ${m.category} 
        unit ${m.unitNumber || ''} 
        ${m.topic} 
        ${m.description}
        ${m.keyHighlights?.join(' ') || ''}
      `.toLowerCase();

      return words.every((word) => {
        if (word.startsWith('u') && !isNaN(Number(word.slice(1)))) {
          return m.unitNumber === Number(word.slice(1));
        }
        return searchableString.includes(word);
      });
    });
  }, [query, selectedCat, materials, dbMaterials]);

  const handleRetry = () => {
    setSearchError(null);
    setIsLoading(true);
    const trimmed = query.trim();
    if (trimmed && isSupabaseConfigured()) {
      searchMaterialsDb(trimmed, selectedCat)
        .then((res) => {
          setDbMaterials(res);
          setIsLoading(false);
        })
        .catch(() => {
          setSearchError('Unable to reach academic database.');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1C1917]/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="search-modal-container"
        className="bg-[#FFFFFF] w-full max-w-3xl rounded-2xl border border-[#E0D9CC] shadow-2xl overflow-hidden mt-6 sm:mt-12 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C2410C] shrink-0" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, subjects, units, questions (e.g. 'Math Unit 1', 'C pointers')..."
            className="w-full bg-transparent text-sm sm:text-base text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none"
          />

          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#C2410C] animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDbMaterials(null);
              }}
              className="p-1 text-xs text-[#78716C] hover:text-[#1C1917] rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono font-medium text-[#78716C] hover:text-[#1C1917] bg-[#EFEAE0] hover:bg-[#E2DDD3] rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filters inside Search */}
        <div className="px-4 py-2 bg-[#FBF9F5] border-b border-[#EFEBE1] flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[#A8A29E] font-medium mr-1 shrink-0">Filter:</span>
          {(['all', 'notes', 'important-questions', 'pyqs', 'lab-manuals'] as const).map((cat) => {
            const labels: Record<string, string> = {
              all: 'All Types',
              notes: 'Notes',
              'important-questions': 'Questions',
              pyqs: 'PYQs',
              'lab-manuals': 'Labs',
            };
            const isSelected = selectedCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium ${
                  isSelected
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#F2EDE2] text-[#57534E] hover:bg-[#E5DFD4]'
                }`}
              >
                {labels[cat]}
              </button>
            );
          })}
        </div>

        {/* Search Modal Content Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* Error State */}
          {searchError && (
            <div className="p-4 mb-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                <span>{searchError}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#FFFFFF] border border-[#F87171] text-[#7F1D1D] hover:bg-[#FEE2E2] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            // 1. Loading State
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-[#C2410C] animate-spin mx-auto mb-2" />
              <div className="text-xs font-medium text-[#78716C]">
                Searching academic index...
              </div>
            </div>
          ) : !query.trim() ? (
            // 2. Empty Search State
            <div className="py-6 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C2410C] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Frequently Searched in Semester 1
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_SEARCHES.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setQuery(sample)}
                    className="p-3 text-left rounded-xl bg-[#FAF8F5] hover:bg-[#FFF7ED] border border-[#EAE4D8] hover:border-[#FED7AA] text-xs font-medium text-[#44403C] hover:text-[#C2410C] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sample}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#C2410C] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#F2EFE9] text-xs text-[#78716C] flex items-center justify-between">
                <span>Tip: You can search directly by unit number (e.g., "C Unit 4" or "Physics Unit 1").</span>
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px]">
                  <span>Press ESC to exit</span>
                </span>
              </div>
            </div>
          ) : matchingMaterials.length === 0 && matchingSubjects.length === 0 ? (
            // 3. No Results State
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE5DA] flex items-center justify-center text-[#A8A29E] mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1C1917] mb-1">
                No matching materials found
              </h3>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4">
                We couldn't find any resources matching "{query}". Check for spelling or try searching broader course topics.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-xs text-[#78716C]">Try searching:</span>
                {['Math', 'Programming in C', 'Physics', 'BEEE', 'Chemistry'].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setQuery(hint)}
                    className="text-xs px-2.5 py-1 rounded bg-[#F5F2EB] text-[#44403C] hover:bg-[#EBE6DC] border border-[#E0D9CC] cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 4. Results State
            <div className="space-y-6">
              {/* Matching Subjects Section */}
              {matchingSubjects.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C2410C]" />
                    Matching Subjects ({matchingSubjects.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingSubjects.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onSelectSubject(sub.id);
                          onClose();
                        }}
                        className="p-3 text-left rounded-xl bg-[#FAF8F5] hover:bg-[#FFF7ED] border border-[#EAE4D8] hover:border-[#FED7AA] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#EFEBE3] text-[#57534E]">
                              {sub.code}
                            </span>
                            <span className="text-xs font-bold text-[#1C1917] group-hover:text-[#C2410C]">
                              {sub.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#78716C] line-clamp-1">
                            {sub.shortDescription}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#C2410C] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Materials Section */}
              {matchingMaterials.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#C2410C]" />
                      Matching Academic Materials ({matchingMaterials.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {matchingMaterials.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onOpenMaterial(m);
                          onClose();
                        }}
                        className="p-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FFF7ED]/50 border border-[#EAE4D8] hover:border-[#D6A485] transition-all cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#44403C] px-2 py-0.5 rounded bg-[#F2EDE2]">
                              {m.subjectName}
                            </span>
                            <span className="text-[11px] text-[#C2410C] font-medium px-2 py-0.5 rounded bg-[#FFF7ED] border border-[#FED7AA]">
                              {m.category.replace('-', ' ').toUpperCase()}
                            </span>
                            {m.unitNumber && (
                              <span className="text-[11px] font-mono text-[#78716C] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E7E2D7]">
                                Unit {m.unitNumber}
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-[#1C1917] group-hover:text-[#C2410C] transition-colors leading-snug">
                            {m.title}
                          </h5>
                          <p className="text-xs text-[#78716C] line-clamp-1">
                            {m.topic || m.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-mono text-[#78716C] shrink-0 self-center">
                          <span className="uppercase text-[11px] font-semibold">{m.fileType}</span>
                          <span>·</span>
                          <span className="text-[11px]">{m.fileSize}</span>
                          <CornerDownLeft className="w-3.5 h-3.5 text-[#A8A29E] ml-1 group-hover:text-[#C2410C]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
