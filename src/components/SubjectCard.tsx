import React from 'react';
import { 
  Calculator, 
  Code2, 
  Atom, 
  MessagesSquare, 
  Beaker, 
  Binary, 
  Wrench, 
  Zap, 
  ChevronRight,
  BookOpen,
  Languages,
  Globe
} from 'lucide-react';
import { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onClick: (subjectId: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calculator,
  Code2,
  Atom,
  MessagesSquare,
  Beaker,
  Binary,
  Wrench,
  Zap,
  Languages,
  Globe,
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  const IconComponent = ICON_MAP[subject.iconName] || BookOpen;

  return (
    <button
      id={`subject-card-${subject.id}`}
      type="button"
      onClick={() => onClick(subject.id)}
      className="group text-left w-full bg-[#FFFFFF] rounded-xl border border-[#EBE7DF] hover:border-[#D6A485] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.03)] hover:shadow-[0_8px_24px_rgba(194,65,12,0.09)] transition-all duration-200 flex flex-col justify-between relative cursor-pointer"
    >
      <div>
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#EBE6DC] group-hover:border-[#FED7AA] group-hover:bg-[#FFF7ED] flex items-center justify-center text-[#78716C] group-hover:text-[#C2410C] transition-colors">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#F5F2EB] text-[#57534E] border border-[#E6E1D6]">
              {subject.code}
            </span>
            <span className="text-[11px] text-[#A8A29E] font-medium">
              {subject.credits} Credits
            </span>
          </div>
        </div>

        {/* Subject Title */}
        <h3 className="text-base font-bold text-[#1C1917] group-hover:text-[#C2410C] transition-colors leading-snug mb-1.5">
          {subject.name}
        </h3>

        {/* Descriptor */}
        <p className="text-xs text-[#78716C] leading-relaxed line-clamp-2 mb-4">
          {subject.shortDescription}
        </p>
      </div>

      {/* Card Footer: Units & Material Counts */}
      <div className="pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#78716C]">
          <span className="font-medium text-[#44403C]">{subject.units.length} Units</span>
          <span>·</span>
          <span className="text-[#C2410C] font-semibold">{subject.totalMaterials} Materials</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-[#78716C] group-hover:text-[#C2410C] transition-colors">
          <span>Open</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
};
