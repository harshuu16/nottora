import React from 'react';
import { BookOpen, Sparkles, FileText, FlaskConical, ArrowUpRight } from 'lucide-react';
import { MaterialCategory } from '../types';

interface QuickAccessProps {
  onSelectCategory: (category: MaterialCategory) => void;
  materialsCounts: Record<MaterialCategory, number>;
}

const ITEMS: Array<{
  category: MaterialCategory;
  emoji: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    category: 'notes',
    emoji: '📚',
    title: 'Notes',
    subtitle: 'Faculty handouts, unit summaries and handwritten theory',
    icon: BookOpen,
  },
  {
    category: 'important-questions',
    emoji: '⭐',
    title: 'Important Questions',
    subtitle: 'Frequently repeated university questions and 10-mark guarantee topics',
    icon: Sparkles,
  },
  {
    category: 'pyqs',
    emoji: '📝',
    title: 'Previous Year Questions',
    subtitle: 'Official semester end-term papers with solutions and marking schemes',
    icon: FileText,
  },
  {
    category: 'lab-manuals',
    emoji: '🧪',
    title: 'Lab Manuals',
    subtitle: 'Prescribed laboratory experiments, circuit diagrams and viva prep',
    icon: FlaskConical,
  },
];

export const QuickAccess: React.FC<QuickAccessProps> = ({ onSelectCategory, materialsCounts }) => {
  return (
    <section id="quick-access-section" className="mb-12">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C2410C] block mb-0.5">
            Quick Access
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-editorial text-[#1C1917]">
            Core Academic Material Types
          </h2>
        </div>
        <span className="text-xs text-[#78716C] hidden sm:inline font-medium">
          Jump directly to your study goal
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const count = materialsCounts[item.category] || 0;

          return (
            <button
              key={item.category}
              id={`quick-access-${item.category}`}
              type="button"
              onClick={() => onSelectCategory(item.category)}
              className="group text-left p-4 rounded-xl bg-[#FFFFFF] border border-[#EBE7DF] hover:border-[#D6A485] hover:bg-[#FAF7F2] shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:shadow-[0_4px_16px_rgba(194,65,12,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] group-hover:border-[#FED7AA] group-hover:bg-[#FFF7ED] flex items-center justify-center text-[#78716C] group-hover:text-[#C2410C] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-medium text-[#78716C]">
                    {count} {count === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{item.emoji}</span>
                  <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-[#C2410C] transition-colors">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs text-[#78716C] leading-relaxed line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#A8A29E] font-medium">Browse category</span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#78716C] group-hover:text-[#C2410C] transition-colors">
                  <span>Explore</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
