import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowRight, BookOpen } from 'lucide-react';
import { AcademicContext, MaterialCategory } from '../types';
import { ACADEMIC_SESSION_DISPLAY } from '../data/academicData';

interface HeroProps {
  context: AcademicContext;
  onOpenContextModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  selectedCategory: MaterialCategory | 'all';
  onCategoryChange: (category: MaterialCategory | 'all') => void;
  totalMaterialsCount: number;
}

const POPULAR_SEARCHES = [
  'Math Unit 1',
  'C pointers',
  'Physics important questions',
  'BEEE lab manual',
  'Chemistry water hardness',
  'Newton Rings',
];

export const Hero: React.FC<HeroProps> = ({
  context,
  onOpenContextModal,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategoryChange,
  totalMaterialsCount,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  const handleQuickTagClick = (tag: string) => {
    onSearchChange(tag);
    onSearchSubmit(tag);
  };

  return (
    <section className="pt-2 pb-6 border-b border-[#EAE5DA] mb-8">
      {/* Top Academic Context Breadcrumb Pill */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <button
          id="academic-context-btn"
          type="button"
          onClick={onOpenContextModal}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E2DDD3] hover:border-[#D48962] text-xs font-medium text-[#44403C] hover:text-[#C2410C] transition-all shadow-[0_1px_2px_rgba(28,25,23,0.03)] cursor-pointer group"
          title="Switch academic branch or semester"
        >
          <span className="w-2 h-2 rounded-full bg-[#C2410C]" />
          <span className="font-semibold text-[#1C1917]">{context.collegeShort}</span>
          <span className="text-[#A8A29E]">/</span>
          <span>{context.branchCode}</span>
          <span className="text-[#A8A29E]">/</span>
          <span className="text-[#C2410C] font-semibold">Semester {context.semester}</span>
          <span className="text-[#A8A29E]">/</span>
          <span className="font-mono text-[#78716C]">{context.session || ACADEMIC_SESSION_DISPLAY}</span>
          <SlidersHorizontal className="w-3 h-3 text-[#A8A29E] group-hover:text-[#C2410C] ml-1 transition-colors" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#78716C]">
          <span className="inline-flex items-center gap-1 font-mono text-[#57534E]">
            <BookOpen className="w-3.5 h-3.5 text-[#C2410C]" />
            {totalMaterialsCount} Verified Files
          </span>
          <span className="text-[#D6D3D1]">·</span>
          <span className="text-[#78716C]">RTU Syllabus Aligned</span>
        </div>
      </div>

      {/* Main Compact Hero Header */}
      <div className="max-w-3xl mb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#C2410C] mb-1.5 flex items-center gap-1.5">
          <span>Your academic library</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-editorial text-[#1C1917] tracking-tight leading-[1.2] mb-2.5">
          Your notes.{' '}
          <span className="italic font-serif text-[#C2410C]">Organized for study.</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed max-w-2xl">
          Find notes, important questions, previous year papers and lab material without digging through old WhatsApp messages.
        </p>
      </div>

      {/* Prominent Search Container */}
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={`flex items-center bg-[#FFFFFF] rounded-2xl border transition-all duration-200 p-2 sm:p-2.5 shadow-[0_2px_8px_rgba(28,25,23,0.05)] ${
              isFocused
                ? 'border-[#C2410C] ring-3 ring-[#EA580C]/15 shadow-[0_4px_16px_rgba(194,65,12,0.1)]'
                : 'border-[#DFD9CE] hover:border-[#C7BFB1]'
            }`}
          >
            <div className="pl-2 pr-3 text-[#78716C] flex items-center">
              <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-[#C2410C]' : 'text-[#78716C]'}`} />
            </div>

            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search notes, subjects, units, questions..."
              className="w-full bg-transparent text-sm sm:text-base text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="px-2 py-1 text-xs text-[#78716C] hover:text-[#1C1917] rounded mr-1 cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              id="hero-search-submit-btn"
              type="submit"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </form>

        {/* Quick Search Chips & Popular Searches */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#78716C] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#C2410C]" />
            Popular:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                id={`search-chip-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#F5F2EB] hover:bg-[#EBE6DC] text-[#44403C] hover:text-[#C2410C] transition-colors border border-[#E6E1D6] font-medium cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Material Category Quick Filter Tabs */}
        <div className="mt-3.5 pt-3 border-t border-[#EFEBE1] flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#A8A29E] font-medium shrink-0 mr-1">Filter by type:</span>
          {(['all', 'notes', 'important-questions', 'pyqs', 'lab-manuals'] as const).map((cat) => {
            const labels: Record<string, string> = {
              all: 'All Materials',
              notes: 'Notes',
              'important-questions': 'Important Questions',
              pyqs: 'PYQs',
              'lab-manuals': 'Lab Manuals',
            };
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#57534E] border-[#E5E0D5] hover:border-[#D1C8B8] hover:text-[#1C1917]'
                }`}
              >
                {labels[cat]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
