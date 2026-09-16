import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Bookmark, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Clock, 
  GraduationCap,
  Copy, 
  Check,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Material } from '../types';
import { getMaterialSignedUrl } from '../lib/supabase';
import { ACADEMIC_SESSION_DISPLAY } from '../data/academicData';

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onDownload: (material: Material) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isPdfViewerOpen?: boolean;
  onOpenPdfViewer?: (material: Material) => void;
  onClosePdfViewer?: () => void;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  material,
  onClose,
  onDownload,
  isBookmarked,
  onToggleBookmark,
  isPdfViewerOpen = false,
  onOpenPdfViewer,
  onClosePdfViewer,
}) => {
  const [copied, setCopied] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!material) {
      setSignedUrl(null);
      return;
    }
    const targetPath = material.filePath || material.fileUrl;
    if (targetPath) {
      getMaterialSignedUrl(targetPath, 3600)
        .then((url) => setSignedUrl(url))
        .catch(() => setSignedUrl(material.fileUrl));
    } else {
      setSignedUrl(material.fileUrl);
    }
  }, [material]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPdfViewerOpen && onClosePdfViewer) {
          onClosePdfViewer();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isPdfViewerOpen, onClosePdfViewer]);

  if (!material) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/material/${material.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // When full-screen / in-app PDF document viewer mode is active
  if (isPdfViewerOpen) {
    return (
      <div
        id="pdf-viewer-backdrop"
        className="fixed inset-0 z-50 bg-[#1C1917]/85 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      >
        <div
          id="pdf-viewer-container"
          className="bg-[#FFFFFF] w-full max-w-6xl mx-auto rounded-2xl border border-[#E5E0D5] shadow-2xl overflow-hidden flex flex-col flex-1 max-h-[96vh] animate-in zoom-in-95 duration-150"
        >
          {/* PDF Viewer Top Bar */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                id="pdf-viewer-back-btn"
                type="button"
                onClick={onClosePdfViewer || onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] text-[#44403C] hover:text-[#1C1917] border border-[#D7D0C5] hover:bg-[#F5F1E8] transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#C2410C]" />
                <span className="hidden sm:inline">Back to Details</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="min-w-0 truncate">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] shrink-0">
                    {material.fileType.toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1C1917] truncate block">
                    {material.title}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {signedUrl && (
                <a
                  id="pdf-viewer-new-tab-btn"
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors inline-flex items-center gap-1.5"
                  title="Open PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Open in Tab</span>
                </a>
              )}

              <button
                id="pdf-viewer-download-btn"
                type="button"
                onClick={() => onDownload(material)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] active:bg-[#7C2D12] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                id="pdf-viewer-close-btn"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors"
                aria-label="Close document viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF iframe / Reader Frame */}
          <div className="flex-1 bg-[#323639] relative flex flex-col items-center justify-center min-h-[400px]">
            {signedUrl ? (
              <iframe
                src={signedUrl}
                title={material.title}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="text-center p-8 text-[#FAF8F5]">
                <FileText className="w-12 h-12 mx-auto text-[#FED7AA] mb-3 opacity-80" />
                <p className="text-sm font-medium mb-2">Preparing {material.title}...</p>
                <p className="text-xs text-[#A8A29E] max-w-sm mx-auto">
                  Connecting to secure document storage. If your browser restricts inline rendering, use the buttons above to open or download.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="material-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1C1917]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="material-modal-content"
        className="bg-[#FFFFFF] w-full max-w-3xl rounded-2xl border border-[#E5E0D5] shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-md bg-[#F2EDE2] text-[#44403C] border border-[#E0D9CC]">
                {material.subjectName}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                {material.category.toUpperCase().replace('-', ' ')}
              </span>
              {material.unitNumber && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#FAF7F2] text-[#57534E] border border-[#E5E0D5]">
                  UNIT {material.unitNumber}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-editorial text-[#1C1917] leading-snug">
              {material.title}
            </h2>
          </div>

          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors shrink-0"
            aria-label="Close reader preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-[#44403C]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#FBF9F5] border border-[#EAE4D8] text-xs">
            <div>
              <span className="text-[#A8A29E] block mb-0.5">Format</span>
              <span className="font-mono font-bold text-[#1C1917] uppercase">{material.fileType} Document</span>
            </div>
            <div>
              <span className="text-[#A8A29E] block mb-0.5">File Size</span>
              <span className="font-mono font-medium text-[#1C1917]">{material.fileSize}</span>
            </div>
            <div>
              <span className="text-[#A8A29E] block mb-0.5">Pages</span>
              <span className="font-mono font-medium text-[#1C1917]">{material.pageCount ? `${material.pageCount} pages` : 'Full Guide'}</span>
            </div>
            <div>
              <span className="text-[#A8A29E] block mb-0.5">Academic Session</span>
              <span className="font-mono font-medium text-[#1C1917]">
                {material.academicYear && material.academicYear.startsWith('Session')
                  ? material.academicYear
                  : ACADEMIC_SESSION_DISPLAY}
              </span>
            </div>
          </div>

          {/* Verification Badge */}
          {material.verifiedBy && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] text-xs text-[#92400E]">
              <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
              <div>
                <span className="font-bold">Verified Academic Source: </span>
                <span>{material.verifiedBy}</span>
              </div>
            </div>
          )}

          {/* Topic & Syllabus Coverage */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#C2410C]" />
              Topic Overview & Summary
            </h3>
            <p className="text-sm text-[#44403C] leading-relaxed bg-[#FFFFFF] p-4 rounded-xl border border-[#EBE7DF]">
              {material.description}
            </p>
          </div>

          {/* Key Syllabus Highlights */}
          {material.keyHighlights && material.keyHighlights.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C2410C]" />
                Key Highlights & Exam Focus Areas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {material.keyHighlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EBE6DC] text-xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-[#44403C]">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Content Excerpt */}
          {material.contentPreview && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C2410C]" />
                Preview Excerpt from Document
              </h3>
              <div className="p-4 rounded-xl bg-[#F5F2EB] border border-[#E5E0D5] font-mono text-xs text-[#44403C] leading-relaxed whitespace-pre-line">
                {material.contentPreview}
              </div>
            </div>
          )}

          {/* Study Tips Callout */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E9E3D6] flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-[#57534E]">
              <span className="font-bold text-[#1C1917] block mb-0.5">Study Advisory for College Examinations:</span>
              Focus on solved numerical problems and theorem statements first. Review previous year paper marking schemes to prioritize high-weightage questions for Unit {material.unitNumber || 'Exam'}.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EAE5DA] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="modal-bookmark-btn"
              type="button"
              onClick={() => onToggleBookmark(material.id)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors ${
                isBookmarked
                  ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                  : 'bg-[#FFFFFF] text-[#57534E] border-[#E0D9CC] hover:bg-[#F5F2EB]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Saved in Study Stash' : 'Save for Later'}</span>
            </button>

            <button
              id="modal-copy-link-btn"
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-[#FFFFFF] text-[#57534E] border border-[#E0D9CC] hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors"
            >
              Close
            </button>

            {material.fileUrl && (
              <div className="flex items-center gap-1">
                <button
                  id="modal-open-pdf-btn"
                  type="button"
                  onClick={() => {
                    if (onOpenPdfViewer) {
                      onOpenPdfViewer(material);
                    } else if (signedUrl) {
                      window.open(signedUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      const targetPath = material.filePath || material.fileUrl;
                      getMaterialSignedUrl(targetPath, 3600).then((url) => {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      });
                    }
                  }}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1C1917] bg-[#FFFFFF] border border-[#E0D9CC] hover:bg-[#F5F2EB] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Open {material.fileType.toUpperCase()}</span>
                </button>

                {signedUrl && (
                  <a
                    id="modal-open-tab-link"
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2EFE9] rounded-xl border border-[#E0D9CC] transition-colors"
                    title="Open in new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            <button
              id="modal-download-btn"
              type="button"
              onClick={() => onDownload(material)}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] active:bg-[#7C2D12] rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download {material.fileType.toUpperCase()} ({material.fileSize})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
