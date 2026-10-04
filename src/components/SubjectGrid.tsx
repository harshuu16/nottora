import React from 'react';
import { Layers, Sparkles, SlidersHorizontal } from 'lucide-react';
import { AcademicContext, Subject } from '../types';
import { SubjectCard } from './SubjectCard';

interface SubjectGridProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  context: AcademicContext;
  onOpenContextModal?: () => void;
}

export const SubjectGrid: React.FC<SubjectGridProps> = ({
  subjects,
  onSelectSubject,
  context,
  onOpenContextModal,
}) => {
  return (
    <section id="subjects-section" className="scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              <Layers className="w-3.5 h-3.5" />
              Syllabus Structure
            </span>
            <span className="text-xs text-[#A8A29E]">·</span>
            <span className="text-xs font-mono text-[#78716C] bg-[#F5F2EB] px-2 py-0.5 rounded border border-[#E6E1D6]">
              {context.branchCode} · Year {context.year} · Sem {context.semester} · {subjects.length} Subjects
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#1C1917] tracking-tight">
            Explore Subjects
          </h2>
        </div>

        <p className="text-xs text-[#78716C] max-w-sm sm:text-right">
          Curated notes, PYQs, unit-wise questions, and official lab manuals for each course.
        </p>
      </div>

      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} onClick={onSelectSubject} />
          ))}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#EBE7DF] shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-xs font-semibold text-[#C2410C] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coming Soon</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-editorial text-[#1C1917] mb-2">
            No content available yet
          </h3>
          <p className="text-xs sm:text-sm text-[#78716C] max-w-md mx-auto leading-relaxed mb-6">
            Materials for <span className="font-semibold text-[#1C1917]">{context.collegeShort} → {context.branchCode} → Year {context.year} → Semester {context.semester}</span> are not available yet. We are actively curating notes and past papers for this academic selection.
          </p>
          {onOpenContextModal && (
            <button
              type="button"
              onClick={onOpenContextModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Switch Academic Cohort</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
