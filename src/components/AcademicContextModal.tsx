import React, { useState } from 'react';
import { X, Check, Building2, GitBranch, Calendar, GraduationCap, ArrowRight } from 'lucide-react';
import { AcademicContext } from '../types';
import { AVAILABLE_COLLEGES, AVAILABLE_BRANCHES, ACADEMIC_SESSION_DISPLAY } from '../data/academicData';

interface AcademicContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: AcademicContext;
  onSaveContext: (context: AcademicContext) => void;
}

export const AcademicContextModal: React.FC<AcademicContextModalProps> = ({
  isOpen,
  onClose,
  currentContext,
  onSaveContext,
}) => {
  const [selectedCollegeId, setSelectedCollegeId] = useState(
    AVAILABLE_COLLEGES.find((c) => c.name === currentContext.college)?.id || 'pce'
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    AVAILABLE_BRANCHES.find((b) => b.name === currentContext.branch)?.id || 'cse'
  );
  const [selectedYear, setSelectedYear] = useState(currentContext.year);
  const [selectedSemester, setSelectedSemester] = useState(currentContext.semester);

  if (!isOpen) return null;

  const handleSave = () => {
    const collegeObj = AVAILABLE_COLLEGES.find((c) => c.id === selectedCollegeId) || AVAILABLE_COLLEGES[0];
    const branchObj = AVAILABLE_BRANCHES.find((b) => b.id === selectedBranchId) || AVAILABLE_BRANCHES[0];

    onSaveContext({
      college: collegeObj.name,
      collegeShort: collegeObj.short,
      branch: branchObj.name,
      branchCode: branchObj.code,
      year: selectedYear,
      semester: selectedSemester,
      session: currentContext.session || ACADEMIC_SESSION_DISPLAY,
    });
    onClose();
  };

  return (
    <div
      id="context-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1C1917]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="context-modal-card"
        className="bg-[#FFFFFF] w-full max-w-xl rounded-2xl border border-[#E5E0D5] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C2410C] block mb-1">
              Academic Hierarchy
            </span>
            <h2 className="text-xl font-bold font-editorial text-[#1C1917]">
              Select College, Branch & Semester
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-5 text-sm">
          {/* Hierarchy Banner */}
          <div className="p-3.5 rounded-xl bg-[#F5F1E8] border border-[#E4DDCF] text-xs text-[#57534E]">
            <div className="font-semibold text-[#1C1917] mb-1">
              Active Hierarchy Path:
            </div>
            <div className="font-mono text-[#C2410C] flex items-center gap-1.5 flex-wrap">
              <span>{AVAILABLE_COLLEGES.find((c) => c.id === selectedCollegeId)?.name}</span>
              <span className="text-[#A8A29E]">→</span>
              <span>{AVAILABLE_BRANCHES.find((b) => b.id === selectedBranchId)?.code}</span>
              <span className="text-[#A8A29E]">→</span>
              <span>Year {selectedYear}</span>
              <span className="text-[#A8A29E]">→</span>
              <span>Semester {selectedSemester}</span>
              <span className="text-[#A8A29E]">→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] font-bold">
                {currentContext.session || ACADEMIC_SESSION_DISPLAY}
              </span>
            </div>
          </div>

          {/* 1. College Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#C2410C]" />
              1. Affiliated College / Campus
            </label>
            <div className="space-y-2">
              {AVAILABLE_COLLEGES.map((col) => {
                const isSelected = selectedCollegeId === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollegeId(col.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF7ED] border-[#FED7AA] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EBE6DC] hover:border-[#D1C8B8]'
                    }`}
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-[#1C1917]">
                        {col.name}
                      </div>
                      <span className="text-[11px] text-[#78716C] font-mono">
                        {col.short} Campus
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C2410C]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Branch Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#C2410C]" />
              2. Academic Branch / Department
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_BRANCHES.map((br) => {
                const isSelected = selectedBranchId === br.id;
                return (
                  <button
                    key={br.id}
                    type="button"
                    onClick={() => setSelectedBranchId(br.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF7ED] border-[#FED7AA]'
                        : 'bg-[#FAF8F5] border-[#EBE6DC] hover:border-[#D1C8B8]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1C1917]">{br.code}</div>
                      <div className="text-[11px] text-[#78716C] line-clamp-1">{br.name}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C2410C]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Year and Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                3. Year
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 3, 4].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                      selectedYear === y
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-[#FAF8F5] text-[#57534E] border-[#E8E2D5] hover:border-[#D1C8B8]'
                    }`}
                  >
                    Year {y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#C2410C]" />
                4. Semester
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSemester(s)}
                    className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                      selectedSemester === s
                        ? 'bg-[#C2410C] text-white border-[#C2410C]'
                        : 'bg-[#FAF8F5] text-[#57534E] border-[#E8E2D5] hover:border-[#D1C8B8]'
                    }`}
                  >
                    Sem {s} {s === 1 ? '(Current)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-xs text-[#78716C]">
            Initial curated cohort: B.Tech CSE Semester 1
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Save & Refresh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
