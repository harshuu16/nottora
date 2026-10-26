import React from 'react';
import { MaterialCategory } from '../types';

interface FooterProps {
  onNavigateHome: () => void;
  onNavigateSubjects: () => void;
  onNavigateCategory: (category: MaterialCategory) => void;
  onSelectSubject: (subjectId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onNavigateSubjects,
  onNavigateCategory,
  onSelectSubject,
}) => {
  return (
    <footer className="mt-20 border-t border-[#EAE5DA] bg-[#F7F4EC] text-[#57534E] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-[#E8E2D5]">
          {/* Brand Col */}
          <div className="max-w-sm space-y-2.5">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={onNavigateHome}>
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#1C1917]">
                Nottora
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C] mb-2" />
            </div>

            <p className="text-sm text-[#44403C] font-editorial italic">
              "Your academic library."
            </p>

            <p className="text-xs text-[#78716C] leading-relaxed">
              The permanent, organized academic home for college lecture notes, 
              high-yield examination questions, previous year papers, and laboratory manuals.
            </p>

            <div className="pt-1">
              <span className="inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#EFEAE0] text-[#44403C] border border-[#DDD7CB]">
                Built for students.
              </span>
            </div>
          </div>

          {/* Quick Links Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            {/* Direct Study Links */}
            <div className="space-y-3">
              <div className="font-bold text-[#1C1917] uppercase tracking-wider text-[11px]">
                Explore
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#subjects-section"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateSubjects();
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Subjects
                  </a>
                </li>
                <li>
                  <a
                    href="/category/notes"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateCategory('notes');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Notes
                  </a>
                </li>
                <li>
                  <a
                    href="/category/important-questions"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateCategory('important-questions');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Important Questions
                  </a>
                </li>
                <li>
                  <a
                    href="/category/pyqs"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateCategory('pyqs');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    PYQs
                  </a>
                </li>
                <li>
                  <a
                    href="/category/lab-manuals"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onNavigateCategory('lab-manuals');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Lab Manuals
                  </a>
                </li>
              </ul>
            </div>

            {/* Semester 1 Subjects Column 1 */}
            <div className="space-y-3">
              <div className="font-bold text-[#1C1917] uppercase tracking-wider text-[11px]">
                Core Subjects
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/subject/communication-skills"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('communication-skills');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Communication Skills
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/chemistry"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('chemistry');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Chemistry
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/beee"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('beee');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    BEEE
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/engineering-mathematics"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('engineering-mathematics');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Mathematics
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/engineering-physics"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('engineering-physics');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Engineering Physics
                  </a>
                </li>
              </ul>
            </div>

            {/* Semester 1 Subjects Column 2 */}
            <div className="space-y-3">
              <div className="font-bold text-[#1C1917] uppercase tracking-wider text-[11px]">
                Applied & Lab Courses
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/subject/mpws"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('mpws');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    MPWS
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/c-programming"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('c-programming');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    C Programming
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/language-lab"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('language-lab');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Language Lab
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/wpl"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('wpl');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    WPL
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/design-thinking"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('design-thinking');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Design Thinking
                  </a>
                </li>
                <li>
                  <a
                    href="/subject/non-syllabus-project"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectSubject('non-syllabus-project');
                      }
                    }}
                    className="hover:text-[#C2410C] transition-colors cursor-pointer text-left block"
                  >
                    Non-Syllabus Project
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78716C]">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Nottora.</span>
            <span>·</span>
            <span>Permanent academic study repository.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>University Syllabus Aligned</span>
            <span>·</span>
            <span>Poornima College of Engineering</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
