import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Compass } from 'lucide-react';
import { submitProblemReport } from '../lib/supabase';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
  route?: string;
}

const PROBLEM_TYPES = [
  'PDF not opening',
  'PDF not downloading',
  'Wrong / missing material',
  'Search problem',
  'Website bug',
  'Other',
];

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  pageContext,
  route,
}) => {
  const [problemType, setProblemType] = useState<string>(PROBLEM_TYPES[0]);
  const [description, setDescription] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProblemType(PROBLEM_TYPES[0]);
      setDescription('');
      setEmail('');
      setIsSubmitting(false);
      setSubmissionState('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setErrorMessage('Please describe the problem.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionState('idle');
    setErrorMessage(null);

    try {
      const result = await submitProblemReport({
        problemType,
        description: description.trim(),
        pageUrl: pageContext || (typeof window !== 'undefined' ? window.location.href : ''),
        route: route || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''),
        email: email.trim() || undefined,
      });

      if (result.success) {
        setSubmissionState('success');
        // Auto-close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setSubmissionState('error');
        setErrorMessage(result.error || "Couldn't send the report. Please try again.");
      }
    } catch {
      setSubmissionState('error');
      setErrorMessage("Couldn't send the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#1C1917]/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-problem-title"
    >
      <div
        id="report-problem-card"
        className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-[#EAE5DA] dark:border-[#2B2B2B] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1C1917] dark:text-[#F5F5F5]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F2EFE9] dark:border-[#2A2A2A]">
          <div>
            <h2
              id="report-problem-title"
              className="font-editorial text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F5F5]"
            >
              Report a Problem
            </h2>
            <p className="text-xs text-[#78716C] dark:text-[#A8A8A8] mt-1">
              Found something not working? Tell us what happened.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F5F5F5] hover:bg-[#F5F2EB] dark:hover:bg-[#202020] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Success Banner */}
          {submissionState === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Thanks! Your report has been submitted.</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  We will investigate and improve the academic repository.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submissionState === 'error' && errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Auto-detected Page / Context */}
          {pageContext && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#191919] border border-[#E5E0D5] dark:border-[#2B2B2B] flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-[#C2410C] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[#78716C] dark:text-[#888888] tracking-wider block">
                  Detected Page / Context
                </span>
                <span className="text-xs font-semibold text-[#1C1917] dark:text-[#E8E8E8] truncate block">
                  {pageContext}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* A. Problem Type Dropdown */}
            <div>
              <label
                htmlFor="problem-type-select"
                className="block text-xs font-semibold text-[#44403C] dark:text-[#A8A8A8] mb-1.5"
              >
                Problem Type
              </label>
              <select
                id="problem-type-select"
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                disabled={isSubmitting || submissionState === 'success'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#191919] border border-[#E5E0D5] dark:border-[#303030] text-xs text-[#1C1917] dark:text-[#F2F2F2] focus:outline-none focus:border-[#C2410C] transition-colors cursor-pointer disabled:opacity-50"
              >
                {PROBLEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* B. Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="problem-description-input"
                  className="block text-xs font-semibold text-[#44403C] dark:text-[#A8A8A8]"
                >
                  Description <span className="text-[#C2410C]">*</span>
                </label>
                <span className="text-[11px] text-[#78716C] dark:text-[#777777]">
                  Be as specific as possible
                </span>
              </div>
              <textarea
                id="problem-description-input"
                rows={4}
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting || submissionState === 'success'}
                placeholder="Describe the problem..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#191919] border border-[#E5E0D5] dark:border-[#303030] text-xs text-[#1C1917] dark:text-[#F2F2F2] placeholder-[#858585] focus:outline-none focus:border-[#C2410C] transition-colors resize-none disabled:opacity-50"
              />
              <p className="text-[11px] text-[#78716C] dark:text-[#777777] mt-1 leading-relaxed">
                Examples: &ldquo;Chemistry Unit 2 PDF is not opening,&rdquo; &ldquo;BEEE material is showing in the wrong subject,&rdquo; or &ldquo;PYQ download is not working.&rdquo;
              </p>
            </div>

            {/* D. Email (optional) */}
            <div>
              <label
                htmlFor="problem-email-input"
                className="block text-xs font-semibold text-[#44403C] dark:text-[#A8A8A8] mb-1.5"
              >
                Email <span className="text-[11px] font-normal text-[#78716C] dark:text-[#777777]">(optional)</span>
              </label>
              <input
                id="problem-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || submissionState === 'success'}
                placeholder="Your email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#191919] border border-[#E5E0D5] dark:border-[#303030] text-xs text-[#1C1917] dark:text-[#F2F2F2] placeholder-[#858585] focus:outline-none focus:border-[#C2410C] transition-colors disabled:opacity-50"
              />
            </div>

            {/* E. Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2EFE9] dark:border-[#2A2A2A]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#57534E] dark:text-[#A8A8A8] hover:text-[#1C1917] dark:hover:text-[#F5F5F5] bg-transparent hover:bg-[#F5F2EB] dark:hover:bg-[#202020] border border-[#E5E0D5] dark:border-[#2B2B2B] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                id="submit-problem-report-btn"
                type="submit"
                disabled={isSubmitting || !description.trim() || submissionState === 'success'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#C2410C] hover:bg-[#EA580C] dark:bg-[#C2410C] dark:hover:bg-[#A8380A] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Report</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
