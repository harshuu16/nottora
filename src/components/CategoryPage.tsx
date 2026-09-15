import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, BookOpen, Sparkles, FileText, FlaskConical, Paperclip } from 'lucide-react';
import { Material, MaterialCategory, Subject } from '../types';
import { MaterialCard } from './MaterialCard';

interface CategoryPageProps {
  category: MaterialCategory;
  subjects: Subject[];
  materials: Material[];
  onBack: () => void;
  onOpenMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
}

const CATEGORY_META: Record<MaterialCategory, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  notes: {
    title: 'Lecture Notes Archive',
    subtitle: 'Faculty handouts, unit-wise handwritten notes and structured summaries',
    description: 'Directly access chapter notes for all 8 semester subjects. Organized strictly by syllabus unit.',
    icon: BookOpen,
  },
  'important-questions': {
    title: 'Important & High-Yield Questions',
    subtitle: 'Frequently asked examination questions, 10-mark guarantee topics & solutions',
    description: 'Curated question banks compiled from recent college end-term and mid-term examinations.',
    icon: Sparkles,
  },
  pyqs: {
    title: 'Previous Year Question Papers',
    subtitle: 'Official Semester 1 end-term examination papers (2020-2024)',
    description: 'Review original question papers with step-by-step solutions and marking schemes.',
    icon: FileText,
  },
  'lab-manuals': {
    title: 'Laboratory Manuals & Viva Compendium',
    subtitle: 'Prescribed experiments, circuits, observation tables & viva questions',
    description: 'Master practical lab sessions for C programming, Engineering Physics, Chemistry, MPWS, and BEEE.',
    icon: FlaskConical,
  },
  other: {
    title: 'Reference & Formula Sheets',
    subtitle: 'Formula handbooks, quick revision guides and official syllabus documents',
    description: 'Supplemental reference materials to speed up your revision.',
    icon: Paperclip,
  },
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  subjects,
  materials,
  onBack,
  onOpenMaterial,
  onDownloadMaterial,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const meta = CATEGORY_META[category] || CATEGORY_META.notes;
  const CategoryIcon = meta.icon;

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (m.category !== category) return false;
      if (selectedSubjectId !== 'all' && m.subjectId !== selectedSubjectId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.subjectName.toLowerCase().includes(q) ||
          m.topic?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [materials, category, selectedSubjectId, searchQuery]);

  return (
    <div className="pb-16 animate-in fade-in duration-200">
      {/* Back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#57534E] hover:text-[#C2410C] transition-colors p-1 -ml-1 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
        <span className="text-xs text-[#78716C] font-mono">
          Semester 1 · {filteredMaterials.length} Files
        </span>
      </div>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#E8E3D8] shadow-sm mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#C2410C]">
            <CategoryIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Academic Category Archive
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-[#1C1917] tracking-tight mb-2">
          {meta.title}
        </h1>
        <p className="text-sm text-[#57534E] leading-relaxed max-w-2xl mb-6">
          {meta.description}
        </p>

        {/* Search & Filter Row */}
        <div className="pt-6 border-t border-[#F2EFE9] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${meta.title.toLowerCase()}...`}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#E0D9CC] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2410C] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          {/* Subject Count */}
          <div className="text-xs text-[#78716C] font-medium self-end md:self-auto">
            Showing {filteredMaterials.length} verified documents
          </div>
        </div>
      </div>

      {/* Subject Filter Chips */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[#A8A29E] font-medium mr-1 shrink-0">Filter by Subject:</span>
        <button
          type="button"
          onClick={() => setSelectedSubjectId('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            selectedSubjectId === 'all'
              ? 'bg-[#1C1917] text-[#FFFFFF]'
              : 'bg-[#FFFFFF] text-[#57534E] hover:bg-[#F2EFE9] border border-[#EBE7DF]'
          }`}
        >
          All Subjects
        </button>
        {subjects.map((sub) => {
          const isSelected = selectedSubjectId === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#1C1917] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#57534E] hover:bg-[#F2EFE9] border border-[#EBE7DF]'
              }`}
            >
              {sub.name}
            </button>
          );
        })}
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onOpen={onOpenMaterial}
              onDownload={onDownloadMaterial}
              isBookmarked={bookmarkedIds.has(material.id)}
              onToggleBookmark={onToggleBookmark}
              showSubjectBadge={true}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-xl border border-[#EBE7DF]">
          <h3 className="text-base font-semibold text-[#1C1917] mb-1">
            No matching documents found
          </h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4">
            Try adjusting your search keywords or switching to another subject filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedSubjectId('all');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#C2410C] text-white text-xs font-medium hover:bg-[#9A3412] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
