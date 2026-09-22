import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bookmark, 
  Menu, 
  X, 
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  Check
} from 'lucide-react';
import { AcademicContext, MaterialCategory } from '../types';
import { ACADEMIC_SESSION_DISPLAY } from '../data/academicData';
import { useTheme } from '../lib/theme';

interface HeaderProps {
  context: AcademicContext;
  onNavigateHome: () => void;
  onNavigateSubjects: () => void;
  onNavigateCategory: (category: MaterialCategory) => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  onOpenContextModal: () => void;
  bookmarksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  context,
  onNavigateHome,
  onNavigateSubjects,
  onNavigateCategory,
  onOpenSearch,
  onOpenBookmarks,
  onOpenContextModal,
  bookmarksCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const { themeMode, resolvedTheme, setThemeMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  const handleNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE5DA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-3.5">
          <button
            id="brand-logo-btn"
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-left group cursor-pointer"
          >
            <span className="font-editorial text-2xl font-bold tracking-tight text-[#1C1917] group-hover:text-[#C2410C] transition-colors">
              Nottora
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C] mb-2" />
          </button>

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
            <span>Sem {context.semester}</span>
            <span className="text-[#A8A29E]">·</span>
            <span className="font-mono text-[11px] text-[#78716C]">{context.session || ACADEMIC_SESSION_DISPLAY}</span>
            <ChevronDown className="w-3 h-3 text-[#78716C]" />
          </button>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#57534E]">
          <button
            id="nav-home"
            type="button"
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            id="nav-subjects"
            type="button"
            onClick={onNavigateSubjects}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Subjects
          </button>
          <button
            id="nav-important-questions"
            type="button"
            onClick={() => onNavigateCategory('important-questions')}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            Important Questions
          </button>
          <button
            id="nav-pyqs"
            type="button"
            onClick={() => onNavigateCategory('pyqs')}
            className="px-3 py-1.5 rounded-lg hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            PYQs
          </button>
        </nav>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search Trigger */}
          <button
            id="header-search-trigger"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F2EB] hover:bg-[#EBE6DC] text-[#78716C] hover:text-[#1C1917] border border-[#E5E0D5] text-xs transition-colors cursor-pointer"
            title="Open global search"
          >
            <Search className="w-3.5 h-3.5 text-[#57534E]" />
            <span className="hidden sm:inline">Search notes...</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-[#E8E2D5] text-[#57534E] px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Bookmarks / Saved Stash */}
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

          {/* Theme Toggle Control (Desktop & Mobile Header) */}
          <div className="relative" ref={themeMenuRef}>
            <div className="flex items-center rounded-xl border border-transparent hover:border-[#E5E0D5] bg-transparent hover:bg-[#F5F2EB] transition-colors">
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-l-xl text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer flex items-center justify-center"
                title="Toggle theme"
                aria-label={`Toggle color theme (currently ${resolvedTheme})`}
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-[#C2410C] transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-[#57534E] hover:text-[#C2410C] transition-transform" />
                )}
              </button>

              <button
                id="theme-menu-trigger"
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="pr-1.5 pl-0.5 py-2 text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                title="Theme options"
                aria-label="Open theme options menu"
                aria-expanded={isThemeMenuOpen}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Compact Theme Dropdown */}
            {isThemeMenuOpen && (
              <div
                id="theme-dropdown-menu"
                className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-[#FFFFFF] border border-[#E5E0D5] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                  Theme
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('light');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs text-left flex items-center justify-between hover:bg-[#F5F2EB] transition-colors cursor-pointer ${
                    themeMode === 'light' ? 'font-bold text-[#C2410C]' : 'text-[#44403C]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" /> Light
                  </span>
                  {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-[#C2410C]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('dark');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs text-left flex items-center justify-between hover:bg-[#F5F2EB] transition-colors cursor-pointer ${
                    themeMode === 'dark' ? 'font-bold text-[#C2410C]' : 'text-[#44403C]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </span>
                  {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-[#C2410C]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('system');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs text-left flex items-center justify-between hover:bg-[#F5F2EB] transition-colors cursor-pointer ${
                    themeMode === 'system' ? 'font-bold text-[#C2410C]' : 'text-[#44403C]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5" /> System
                  </span>
                  {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-[#C2410C]" />}
                </button>
              </div>
            )}
          </div>

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
        <div className="md:hidden border-b border-[#EAE5DA] bg-[#FAF8F5] px-4 pt-3 pb-5 shadow-lg animate-in slide-in-from-top-2">
          {/* Academic Context Mobile Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F2EDE2] border border-[#E2DDD0] mb-3">
            <div>
              <div className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                Academic Cohort
              </div>
              <div className="text-xs font-bold text-[#1C1917]">
                {context.collegeShort} · {context.branchCode} · Sem {context.semester} · {context.session || ACADEMIC_SESSION_DISPLAY}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNav(onOpenContextModal)}
              className="text-xs font-medium text-[#C2410C] hover:underline"
            >
              Change
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNav(onNavigateHome)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#EFEAE0]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNav(onNavigateSubjects)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#EFEAE0]"
            >
              Subjects
            </button>
            <button
              type="button"
              onClick={() => handleNav(() => onNavigateCategory('notes'))}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0]"
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => handleNav(() => onNavigateCategory('important-questions'))}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0]"
            >
              Important Questions
            </button>
            <button
              type="button"
              onClick={() => handleNav(() => onNavigateCategory('pyqs'))}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0]"
            >
              PYQs
            </button>
            <button
              type="button"
              onClick={() => handleNav(() => onNavigateCategory('lab-manuals'))}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#44403C] hover:bg-[#EFEAE0]"
            >
              Lab Manuals
            </button>
            <button
              type="button"
              onClick={() => handleNav(onOpenBookmarks)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#C2410C] hover:bg-[#EFEAE0] flex items-center justify-between"
            >
              <span>Saved Study Stash</span>
              {bookmarksCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C2410C] text-white text-xs font-semibold">
                  {bookmarksCount}
                </span>
              )}
            </button>
          </div>

          {/* Theme Selector (Mobile Drawer) */}
          <div className="pt-3 mt-3 border-t border-[#EAE5DA]">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
                Theme Appearance
              </span>
              <span className="text-[11px] text-[#A8A29E] font-medium capitalize">
                {themeMode === 'system' ? `System (${resolvedTheme})` : themeMode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F2EDE2] border border-[#E2DDD0]">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-[#FFFFFF] text-[#C2410C] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-[#FFFFFF] text-[#C2410C] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-[#FFFFFF] text-[#C2410C] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
