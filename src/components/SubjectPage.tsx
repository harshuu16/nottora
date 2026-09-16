import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Sparkles, 
  FileText, 
  FlaskConical, 
  Paperclip, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { Material, MaterialCategory, Subject } from '../types';
import { materialBelongsToSubject } from '../data/academicData';
import { MaterialCard } from './MaterialCard';

interface SubjectPageProps {
  subject: Subject;
  materials: Material[];
  onBack: () => void;
  onNavigateHome?: () => void;
  onOpenMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  initialCategory?: MaterialCategory | 'all';
  onSelectCategory?: (category: MaterialCategory | 'all') => void;
}

export const SubjectPage: React.FC<SubjectPageProps> = ({
  subject,
  materials,
  onBack,
  onNavigateHome,
  onOpenMaterial,
  onDownloadMaterial,
  bookmarkedIds,
  onToggleBookmark,
  initialCategory,
  onSelectCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>(
    initialCategory || 'all'
  );
  const [subjectSearch, setSubjectSearch] = useState('');
  const [viewMode, setViewMode] = useState<'by-unit' | 'flat'>('by-unit');
  const [collapsedUnits, setCollapsedUnits] = useState<Record<number, boolean>>({});
  const [studiedUnits, setStudiedUnits] = useState<Record<number, boolean>>({});

  // Synchronize category with initialCategory whenever browser Back/Forward (popstate) or parent route changes
  React.useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  const handleCategoryClick = (category: MaterialCategory | 'all') => {
    setSelectedCategory(category);
    if (onSelectCategory && category !== selectedCategory) {
      onSelectCategory(category);
    }
  };

  // Filter materials for this subject based on category and search query
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (!materialBelongsToSubject(m, subject)) return false;
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (subjectSearch.trim()) {
        const q = subjectSearch.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesTopic = m.topic?.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q);
        return matchesTitle || matchesTopic || matchesDesc;
      }
      return true;
    });
  }, [materials, subject, selectedCategory, subjectSearch]);

  const toggleUnitCollapse = (unitNum: number) => {
    setCollapsedUnits((prev) => ({ ...prev, [unitNum]: !prev[unitNum] }));
  };

  const toggleUnitStudied = (unitNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudiedUnits((prev) => ({ ...prev, [unitNum]: !prev[unitNum] }));
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    materials
      .filter((m) => materialBelongsToSubject(m, subject))
      .forEach((m) => {
        counts.all = (counts.all || 0) + 1;
        counts[m.category] = (counts[m.category] || 0) + 1;
      });
    return counts;
  }, [materials, subject]);

  const categoryTabs: Array<{ id: MaterialCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'All Materials', icon: GraduationCap },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'important-questions', label: 'Important Questions', icon: Sparkles },
    { id: 'pyqs', label: 'PYQs', icon: FileText },
    { id: 'lab-manuals', label: 'Lab Manuals', icon: FlaskConical },
    { id: 'other', label: 'Other', icon: Paperclip },
  ];

  return (
    <div className="pb-16 animate-in fade-in duration-200">
      {/* Hierarchical Back Navigation Bar & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {selectedCategory !== 'all' ? (
            <button
              id="back-to-subject-overview-btn"
              type="button"
              onClick={() => handleCategoryClick('all')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors p-1 -ml-1 rounded-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {subject.code} Overview</span>
            </button>
          ) : (
            <button
              id="back-to-subjects-btn"
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors p-1 -ml-1 rounded-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Subjects</span>
            </button>
          )}
        </div>

        {/* Dynamic Breadcrumbs Hierarchy */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#78716C]">
          <button
            type="button"
            onClick={onNavigateHome || onBack}
            className="hover:text-[#C2410C] transition-colors cursor-pointer font-medium"
          >
            Subjects
          </button>
          <span className="text-[#A8A29E]">/</span>
          {selectedCategory !== 'all' ? (
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className="hover:text-[#C2410C] font-mono transition-colors cursor-pointer"
            >
              {subject.code}
            </button>
          ) : (
            <span className="font-mono font-semibold text-[#1C1917] bg-[#F5F2EB] px-1.5 py-0.5 rounded border border-[#E6E1D6]">
              {subject.code}
            </span>
          )}
          {selectedCategory !== 'all' && (
            <>
              <span className="text-[#A8A29E]">/</span>
              <span className="font-semibold text-[#C2410C] bg-[#FFF7ED] px-1.5 py-0.5 rounded border border-[#FED7AA]">
                {categoryTabs.find((t) => t.id === selectedCategory)?.label || selectedCategory}
              </span>
            </>
          )}
          <span className="ml-1 text-[#A8A29E]">· Sem {subject.semester}</span>
        </nav>
      </div>

      {/* Subject Hero Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E8E3D8] shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                {subject.code}
              </span>
              <span className="text-xs text-[#78716C] bg-[#F5F2EB] px-2 py-0.5 rounded border border-[#E5E0D5]">
                {subject.credits} Credits Course
              </span>
              <span className="text-xs text-[#78716C]">
                {subject.college} · {subject.branch}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-editorial text-[#1C1917] tracking-tight mb-3">
              {subject.name}
            </h1>

            <p className="text-sm text-[#57534E] leading-relaxed">
              {subject.shortDescription}
            </p>
          </div>

          {/* Quick Stats Box */}
          <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[#F2EFE9] text-right">
            <div>
              <div className="text-2xl font-bold font-editorial text-[#1C1917]">
                {categoryCounts.all || 0}
              </div>
              <div className="text-xs text-[#78716C]">Available Materials</div>
            </div>
            <div className="text-xs text-[#78716C]">
              <span className="font-semibold text-[#44403C]">{subject.units.length} Units</span> Syllabus
            </div>
          </div>
        </div>

        {/* Search Within Subject Bar */}
        <div className="mt-6 pt-6 border-t border-[#F2EFE9]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="subject-search-input"
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder={`Search within ${subject.name}...`}
              className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF] transition-all"
            />
            {subjectSearch && (
              <button
                type="button"
                onClick={() => setSubjectSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-[#EAE5DA]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const count = categoryCounts[tab.id] || 0;
            const isSelected = selectedCategory === tab.id;

            return (
              <button
                key={tab.id}
                id={`cat-tab-${tab.id}`}
                type="button"
                onClick={() => handleCategoryClick(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FFFFFF] shadow-sm'
                    : 'bg-[#FFFFFF] text-[#57534E] hover:bg-[#F2EFE9] border border-[#EBE7DF] hover:text-[#1C1917]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-[#383431] text-[#E7E5E4]' : 'bg-[#F2EFE9] text-[#78716C]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          <span className="text-[#A8A29E]">Layout:</span>
          <button
            type="button"
            onClick={() => setViewMode('by-unit')}
            className={`px-2 py-1 rounded text-xs font-medium ${
              viewMode === 'by-unit' ? 'bg-[#EAE5DA] text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            By Unit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`px-2 py-1 rounded text-xs font-medium ${
              viewMode === 'flat' ? 'bg-[#EAE5DA] text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            All Files
          </button>
        </div>
      </div>

      {/* Main Material Display Area */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-xl border border-[#EBE7DF]">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#A8A29E] mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1C1917] mb-1">
            No materials found
          </h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4">
            {subjectSearch
              ? `No materials in ${subject.name} matched "${subjectSearch}". Try searching a different term or resetting the category filter.`
              : `No ${selectedCategory !== 'all' ? selectedCategory : ''} materials have been cataloged for this category yet.`}
          </p>
          {(subjectSearch || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSubjectSearch('');
                setSelectedCategory('all');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#C2410C] text-white text-xs font-medium hover:bg-[#9A3412] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'flat' ? (
        // Flat list of materials
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onOpen={onOpenMaterial}
              onDownload={onDownloadMaterial}
              isBookmarked={bookmarkedIds.has(material.id)}
              onToggleBookmark={onToggleBookmark}
              showSubjectBadge={false}
            />
          ))}
        </div>
      ) : (
        // Grouped by Unit hierarchy
        <div className="space-y-8">
          {subject.units.map((unit) => {
            const unitMaterials = filteredMaterials.filter((m) => m.unitNumber === unit.unitNumber);
            const isCollapsed = collapsedUnits[unit.unitNumber];
            const isStudied = studiedUnits[unit.unitNumber];

            return (
              <div
                key={unit.unitNumber}
                id={`unit-section-${unit.unitNumber}`}
                className="bg-[#FAF8F5] rounded-xl border border-[#EAE4D9] p-5 sm:p-6 transition-all"
              >
                {/* Unit Header Bar */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none pb-4 border-b border-[#E9E2D4]"
                  onClick={() => toggleUnitCollapse(unit.unitNumber)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1C1917] text-white">
                        UNIT {unit.unitNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-editorial text-[#1C1917]">
                        {unit.title}
                      </h3>
                    </div>

                    {/* Key Topics List */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-[#A8A29E] font-medium">Syllabus:</span>
                      {unit.keyTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#57534E] border border-[#E7E2D7]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleUnitStudied(unit.unitNumber, e)}
                      className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                        isStudied
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          : 'bg-[#FFFFFF] text-[#78716C] border-[#E5E0D5] hover:border-[#D1C8B8]'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${isStudied ? 'text-[#D97706]' : 'text-[#A8A29E]'}`} />
                      <span>{isStudied ? 'Studied' : 'Mark Reviewed'}</span>
                    </button>

                    <div className="text-xs text-[#78716C] font-mono">
                      {unitMaterials.length} {unitMaterials.length === 1 ? 'file' : 'files'}
                    </div>

                    <div className="p-1 rounded text-[#78716C] hover:text-[#1C1917]">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Unit Materials Grid */}
                {!isCollapsed && (
                  <div className="pt-4">
                    {unitMaterials.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unitMaterials.map((material) => (
                          <MaterialCard
                            key={material.id}
                            material={material}
                            onOpen={onOpenMaterial}
                            onDownload={onDownloadMaterial}
                            isBookmarked={bookmarkedIds.has(material.id)}
                            onToggleBookmark={onToggleBookmark}
                            showSubjectBadge={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-[#78716C] bg-[#FFFFFF] rounded-lg border border-dashed border-[#DFD9CD]">
                        No materials matching the current filter in Unit {unit.unitNumber}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Section for General / Lab Manuals / Non-Unit Materials if any */}
          {filteredMaterials.some((m) => !m.unitNumber) && (
            <div className="bg-[#FAF8F5] rounded-xl border border-[#EAE4D9] p-5 sm:p-6">
              <div className="pb-4 border-b border-[#E9E2D4] mb-4">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C2410C] text-white">
                  PRACTICALS & GENERAL ARCHIVES
                </span>
                <h3 className="text-base sm:text-lg font-bold font-editorial text-[#1C1917] mt-1">
                  Lab Manuals, Formula Sheets & Examination Papers
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials
                  .filter((m) => !m.unitNumber)
                  .map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onOpen={onOpenMaterial}
                      onDownload={onDownloadMaterial}
                      isBookmarked={bookmarkedIds.has(material.id)}
                      onToggleBookmark={onToggleBookmark}
                      showSubjectBadge={false}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
