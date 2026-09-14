import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Material, MaterialCategory } from '../types';
import { MaterialCard } from './MaterialCard';

interface RecentMaterialsProps {
  materials: Material[];
  onOpenMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  onViewAllMaterials?: () => void;
}

export const RecentMaterials: React.FC<RecentMaterialsProps> = ({
  materials,
  onOpenMaterial,
  onDownloadMaterial,
  bookmarkedIds,
  onToggleBookmark,
  onViewAllMaterials,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | MaterialCategory>('all');

  const filteredMaterials = activeFilter === 'all'
    ? materials.slice(0, 6)
    : materials.filter((m) => m.category === activeFilter).slice(0, 6);

  return (
    <section id="recent-materials-section" className="mb-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              <Clock className="w-3.5 h-3.5" />
              Fresh Archives
            </span>
            <span className="text-xs text-[#A8A29E]">·</span>
            <span className="text-xs text-[#78716C]">Verified Semester 1 Files</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#1C1917] tracking-tight">
            Recently Added
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['all', 'notes', 'important-questions', 'pyqs', 'lab-manuals'] as const).map((filter) => {
            const labels: Record<string, string> = {
              all: 'All Recent',
              notes: 'Notes',
              'important-questions': 'Questions',
              pyqs: 'PYQs',
              'lab-manuals': 'Labs',
            };
            const isSelected = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FFFFFF]'
                    : 'bg-[#F2EFE9] text-[#57534E] hover:bg-[#E7E2D7] hover:text-[#1C1917]'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
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
        <div className="p-8 text-center bg-[#FFFFFF] rounded-xl border border-[#EBE7DF]">
          <p className="text-xs text-[#78716C]">No recent materials found in this category.</p>
        </div>
      )}

      {onViewAllMaterials && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onViewAllMaterials}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#44403C] hover:text-[#C2410C] bg-[#FFFFFF] hover:bg-[#FAF7F2] border border-[#E2DDD3] shadow-xs transition-all cursor-pointer"
          >
            <span>Explore all 8 subjects in archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
