import React from 'react';
import { X, Bookmark, ExternalLink, Download, Trash2, ArrowRight } from 'lucide-react';
import { Material } from '../types';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkedMaterials: Material[];
  onOpenMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
  onRemoveBookmark: (id: string) => void;
  onClearAll: () => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarkedMaterials,
  onOpenMaterial,
  onDownloadMaterial,
  onRemoveBookmark,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="bookmarks-drawer-backdrop"
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="bookmarks-drawer"
        className="w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col justify-between border-l border-[#EAE5DA] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold font-editorial text-[#1C1917]">
                Saved Study Stash
              </h2>
              <p className="text-xs text-[#78716C]">
                {bookmarkedMaterials.length} {bookmarkedMaterials.length === 1 ? 'material' : 'materials'} pinned for revision
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE5DA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {bookmarkedMaterials.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EBE6DC] flex items-center justify-center text-[#A8A29E] mx-auto mb-3">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] mb-1">
                Your study stash is empty
              </h3>
              <p className="text-xs text-[#78716C] max-w-xs mx-auto mb-4 leading-relaxed">
                Click the bookmark icon on any material card to pin lecture notes, PYQs, and high-yield questions here for quick review.
              </p>
            </div>
          ) : (
            bookmarkedMaterials.map((material) => (
              <div
                key={material.id}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D8] hover:border-[#D6A485] transition-colors flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EFEBE3] text-[#57534E]">
                      {material.subjectName}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(material.id)}
                      className="text-[#A8A29E] hover:text-[#EF4444] transition-colors p-0.5"
                      title="Remove from stash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4
                    onClick={() => {
                      onOpenMaterial(material);
                      onClose();
                    }}
                    className="text-xs font-bold text-[#1C1917] hover:text-[#C2410C] cursor-pointer line-clamp-2 leading-snug"
                  >
                    {material.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EAE4D8] text-[11px]">
                  <span className="font-mono text-[#78716C] uppercase">
                    {material.fileType} · {material.fileSize}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMaterial(material);
                        onClose();
                      }}
                      className="px-2 py-0.5 text-xs text-[#44403C] hover:text-[#1C1917] bg-[#FFFFFF] rounded border border-[#E0D9CC] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadMaterial(material)}
                      className="px-2 py-0.5 text-xs text-white bg-[#C2410C] hover:bg-[#9A3412] rounded flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {bookmarkedMaterials.length > 0 && (
          <div className="p-4 border-t border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-[#78716C] hover:text-[#EF4444] transition-colors"
            >
              Clear All Saved
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#1C1917] text-white text-xs font-medium hover:bg-[#2E2A27] transition-colors"
            >
              Done Studying
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
