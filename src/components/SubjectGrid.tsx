import React from 'react';
import { Layers } from 'lucide-react';
import { Subject } from '../types';
import { SubjectCard } from './SubjectCard';

interface SubjectGridProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
}

export const SubjectGrid: React.FC<SubjectGridProps> = ({ subjects, onSelectSubject }) => {
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
              Semester 1 · {subjects.length} Subjects
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} onClick={onSelectSubject} />
        ))}
      </div>
    </section>
  );
};
