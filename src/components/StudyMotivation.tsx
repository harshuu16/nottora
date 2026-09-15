import React from 'react';
import { ShieldCheck, Compass, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';

export const StudyMotivation: React.FC = () => {
  return (
    <section className="mb-14 p-6 sm:p-8 rounded-2xl bg-[#F5F1E8] border border-[#E4DDCF] relative overflow-hidden">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#E0D7C7] text-xs font-semibold uppercase tracking-wider text-[#C2410C] mb-2.5">
          <Sparkles className="w-3.5 h-3.5" />
          The Academic Standard
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-editorial text-[#1C1917] tracking-tight mb-2.5">
          Everything you need.{' '}
          <span className="italic font-serif text-[#C2410C]">Nothing you need to hunt for.</span>
        </h2>

        <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-6 max-w-2xl">
          WhatsApp and Telegram are great for quick messaging, but older files get buried in chat history. 
          Nottora is your permanent, organized home for semester notes, PYQs, and lab manuals—always accessible whenever you need to study.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-[#E6DEC9]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917]">
              <div className="w-6 h-6 rounded-md bg-[#FAF7F2] border border-[#DECDB8] flex items-center justify-center text-[#C2410C] font-mono text-xs">
                1
              </div>
              <span>No Buried Files</span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              No scrolling through endless chat groups the night before an exam to find a single PDF.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917]">
              <div className="w-6 h-6 rounded-md bg-[#FAF7F2] border border-[#DECDB8] flex items-center justify-center text-[#C2410C]">
                <Compass className="w-3.5 h-3.5 text-[#C2410C]" />
              </div>
              <span>Structured by Unit</span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Every course is divided strictly into Units 1 through 5, matching your exact college curriculum.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917]">
              <div className="w-6 h-6 rounded-md bg-[#FAF7F2] border border-[#DECDB8] flex items-center justify-center text-[#C2410C]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C2410C]" />
              </div>
              <span>Verified High-Yield</span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Curated faculty notes, guaranteed 10-mark examination questions, and official university PYQ solutions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
