import React from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Bookmark, 
  Calendar,
  Sparkles, 
  BookOpen, 
  FlaskConical, 
  Paperclip 
} from 'lucide-react';
import { Material, MaterialCategory } from '../types';

interface MaterialCardProps {
  material: Material;
  onOpen: (material: Material) => void;
  onDownload: (material: Material) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  showSubjectBadge?: boolean;
}

const CATEGORY_CONFIG: Record<MaterialCategory, { label: string; icon: React.ComponentType<{ className?: string }>; badgeStyle: string }> = {
  notes: { 
    label: 'Notes', 
    icon: BookOpen, 
    badgeStyle: 'bg-[#F7F2EA] text-[#8C4A27] border-[#E8DFC9]' 
  },
  'important-questions': { 
    label: 'Important Questions', 
    icon: Sparkles, 
    badgeStyle: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]' 
  },
  pyqs: { 
    label: 'PYQ', 
    icon: FileText, 
    badgeStyle: 'bg-[#F5F2EB] text-[#57534E] border-[#E7E3D8]' 
  },
  'lab-manuals': { 
    label: 'Lab Manual', 
    icon: FlaskConical, 
    badgeStyle: 'bg-[#F4EFE6] text-[#78350F] border-[#E8DEC8]' 
  },
  other: { 
    label: 'Reference', 
    icon: Paperclip, 
    badgeStyle: 'bg-[#FAF7F2] text-[#78716C] border-[#E7E5E4]' 
  },
};

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onOpen,
  onDownload,
  isBookmarked,
  onToggleBookmark,
  showSubjectBadge = true,
}) => {
  const cat = CATEGORY_CONFIG[material.category] || CATEGORY_CONFIG.notes;
  const CategoryIcon = cat.icon;

  // Format date cleanly e.g., 'Sep 04, 2024'
  const displayDate = React.useMemo(() => {
    try {
      const d = new Date(material.updatedAt || material.createdAt);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return material.createdAt || 'Sep 2024';
    }
  }, [material.createdAt, material.updatedAt]);

  return (
    <article
      id={`material-card-${material.id}`}
      className="group bg-[#FFFFFF] rounded-xl border border-[#EAE5DA] hover:border-[#D6A485] shadow-[0_1px_3px_rgba(28,25,23,0.03)] hover:shadow-[0_4px_16px_rgba(194,65,12,0.08)] transition-all duration-200 flex flex-col justify-between p-4 sm:p-4.5 relative"
    >
      <div>
        {/* Top Badges Bar: Subject, Category, Unit, PDF Indicator & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* PDF format indicator */}
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
              <FileText className="w-3 h-3" />
              <span>{material.fileType}</span>
            </span>

            {/* Subject Badge */}
            {showSubjectBadge && (
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#44403C] border border-[#E5E0D5]">
                {material.subjectName}
              </span>
            )}

            {/* Category Badge */}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${cat.badgeStyle}`}>
              <CategoryIcon className="w-3 h-3" />
              <span>{cat.label}</span>
            </span>

            {/* Unit Indicator */}
            {material.unitNumber && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#78716C] border border-[#ECE7DE]">
                Unit {material.unitNumber}
              </span>
            )}
          </div>

          {/* Bookmark Action */}
          <button
            id={`bookmark-btn-${material.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(material.id);
            }}
            title={isBookmarked ? 'Remove from Saved Stash' : 'Save to Study Stash'}
            aria-label={isBookmarked ? 'Remove from Saved Stash' : 'Save to Study Stash'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${
              isBookmarked
                ? 'text-[#C2410C] bg-[#FFF7ED]'
                : 'text-[#A8A29E] hover:text-[#44403C] hover:bg-[#F5F2EB]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title — Most visually prominent element */}
        <h3
          onClick={() => onOpen(material)}
          className="text-sm sm:text-[15px] font-bold text-[#1C1917] group-hover:text-[#C2410C] transition-colors leading-snug cursor-pointer line-clamp-2 mb-1.5"
        >
          {material.title}
        </h3>

        {/* Topic / Subheading */}
        <p className="text-xs text-[#78716C] line-clamp-2 mb-2 leading-relaxed">
          {material.topic || material.description}
        </p>
      </div>

      {/* Footer Info: Date, File Specs & Actions */}
      <div className="pt-2.5 mt-1 border-t border-[#F2EFE9] flex items-center justify-between text-xs text-[#78716C]">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1 text-[#78716C]">
            <Calendar className="w-3 h-3 text-[#A8A29E]" />
            {displayDate}
          </span>
          <span>·</span>
          <span>{material.fileSize}</span>
        </div>

        {/* View & Download Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id={`view-btn-${material.id}`}
            type="button"
            onClick={() => onOpen(material)}
            className="px-2.5 py-1 text-xs font-medium text-[#44403C] hover:text-[#1C1917] bg-[#F5F2EB] hover:bg-[#EBE6DC] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View</span>
          </button>

          <button
            id={`download-btn-${material.id}`}
            type="button"
            onClick={() => onDownload(material)}
            className="px-2.5 py-1 text-xs font-medium text-[#FFFFFF] bg-[#C2410C] hover:bg-[#9A3412] active:bg-[#7C2D12] rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </article>
  );
};
