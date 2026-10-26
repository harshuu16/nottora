import React, { useState } from 'react';
import { 
  Bookmark, 
  Menu, 
  X, 
  ChevronDown,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';
import { AcademicContext, MaterialCategory } from '../types';
import { ACADEMIC_SESSION_DISPLAY } from '../data/academicData';
import { useTheme } from '../lib/theme';

interface HeaderProps {
  context: AcademicContext;
  onNavigateHome: () => void;
  onNavigateSubjects: () => void;
  onNavigateCategory: (category: MaterialCategory) => void;
  onOpenSearch?: () => void;
  onOpenBookmarks: () => void;
  onOpenReportProblem: () => void;
  onOpenContextModal: () => void;
  bookmarksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  context,
  onNavigateHome,
  onNavigateSubjects,
  onNavigateCategory,
  onOpenBookmarks,
  onOpenReportProblem,
  onOpenContextModal,
  bookmarksCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE5DA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-3.5">
          <a
            id="brand-logo-btn"
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="flex items-center text-left group cursor-pointer no-underline"
          >
            <span className="font-editorial text-2xl font-bold tracking-tight text-[#1C1917] group-hover:text-[#C2410C] transition-colors">
              Nottora
            </span>
          </a>

          {/* Academic Context Switcher Badge */}
          <button
            id="header-context-badge"
            type="button"
            onClick={onOpenContextModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F1E8] hover:bg-[#EBE5DA] border border-[#E2DDD3] text-xs font-medium text-[#44403C] hover:text-[#1C1917] transition-colors cursor-pointer"
            title="Change College, Branch or Semester"
          >
            <span className="font-semibold text-[#1C1917]">{context.branchCode}</span>
            <span className="text-[#A8A29E]">·</span>
            <span>Year {context.year} · Sem {context.semester}</span>
            <span className="text-[#A8A29E]">·</span>
            <span className="font-mono text-[11px] text-[#78716C]">{context.session || ACADEMIC_SESSION_DISPLAY}</span>
            <ChevronDown className="w-3 h-3 text-[#78716C]" />
          </button>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#57534E]">
          <a
            id="nav-home"
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Home
          </a>
          <a
            id="nav-subjects"
            href="#subjects-section"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateSubjects();
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Subjects
          </a>
          <a
            id="nav-notes"
            href="/category/notes"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateCategory('notes');
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Notes
          </a>
          <a
            id="nav-important-questions"
            href="/category/important-questions"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateCategory('important-questions');
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Important Questions
          </a>
          <a
            id="nav-pyqs"
            href="/category/pyqs"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateCategory('pyqs');
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            PYQs
          </a>
          <a
            id="nav-lab-manuals"
            href="/category/lab-manuals"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateCategory('lab-manuals');
              }
            }}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Lab Manuals
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Bookmarks / Saved Stash */}
          <button
            id="header-bookmarks-btn"
            type="button"
            onClick={onOpenBookmarks}
            className="relative p-2 rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F2EB] border border-transparent hover:border-[#E5E0D5] transition-colors cursor-pointer"
            title="Saved Study Materials"
            aria-label="Saved Study Materials"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarksCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C2410C] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {bookmarksCount}
              </span>
            )}
          </button>

          {/* 2. Report a Problem Button */}
          <button
            id="header-report-btn"
            type="button"
            onClick={onOpenReportProblem}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F2EB] border border-transparent hover:border-[#E5E0D5] text-xs font-medium transition-colors cursor-pointer group"
            title="Report a Problem"
            aria-label="Report a Problem"
          >
            <AlertTriangle className="w-4 h-4 text-[#78716C] group-hover:text-[#C2410C] transition-colors shrink-0" />
            <span className="hidden sm:inline">Report a Problem</span>
          </button>

          {/* 3. Single Theme Toggle Button (Light <-> Dark) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F2EB] border border-transparent hover:border-[#E5E0D5] transition-colors cursor-pointer flex items-center justify-center"
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#C2410C] transition-transform" />
            ) : (
              <Sun className="w-4 h-4 text-[#57534E] hover:text-[#C2410C] transition-transform" />
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F2EB] border border-[#E5E0D5] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-b border-[#EAE5DA] bg-[#FAF8F5] px-4 pt-3 pb-5 shadow-lg animate-in slide-in-from-top-2">
          {/* Academic Context Mobile Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F2EDE2] border border-[#E2DDD0] mb-3">
            <div>
              <div className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                Academic Cohort
              </div>
              <div className="text-xs font-bold text-[#1C1917]">
                {context.collegeShort} · {context.branchCode} · Year {context.year} · Sem {context.semester} · {context.session || ACADEMIC_SESSION_DISPLAY}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNav(onOpenContextModal)}
              className="text-xs font-medium text-[#C2410C] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="space-y-1">
            <a
              href="/"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(onNavigateHome);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              Home
            </a>
            <a
              href="#subjects-section"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(onNavigateSubjects);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              Subjects
            </a>
            <a
              href="/category/notes"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(() => onNavigateCategory('notes'));
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              Notes
            </a>
            <a
              href="/category/important-questions"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(() => onNavigateCategory('important-questions'));
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              Important Questions
            </a>
            <a
              href="/category/pyqs"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(() => onNavigateCategory('pyqs'));
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              PYQs
            </a>
            <a
              href="/category/lab-manuals"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  handleNav(() => onNavigateCategory('lab-manuals'));
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0] cursor-pointer block"
            >
              Lab Manuals
            </a>
            <button
              type="button"
              onClick={() => handleNav(onOpenBookmarks)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#C2410C] hover:bg-[#EFEAE0] flex items-center justify-between cursor-pointer"
            >
              <span>Saved Study Stash</span>
              {bookmarksCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C2410C] text-white text-xs font-semibold">
                  {bookmarksCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNav(onOpenReportProblem)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0] flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-[#78716C]" />
              <span>Report a Problem</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
