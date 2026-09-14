import React from 'react';
import { CheckCircle2, Download, Bookmark, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'download' | 'bookmark' | 'info' | 'success';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = 'text-[#16A34A]';
        let borderColor = 'border-[#E2DDD3]';

        if (toast.type === 'download') {
          Icon = Download;
          iconColor = 'text-[#C2410C]';
          borderColor = 'border-[#FED7AA]';
        } else if (toast.type === 'bookmark') {
          Icon = Bookmark;
          iconColor = 'text-[#C2410C]';
          borderColor = 'border-[#FED7AA]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-[#FFFFFF] border ${borderColor} rounded-xl p-3.5 shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150`}
          >
            <div className="flex items-start gap-2.5">
              <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
              <div>
                <div className="text-xs font-bold text-[#1C1917]">{toast.title}</div>
                <div className="text-[11px] text-[#78716C] leading-snug">{toast.message}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-[#A8A29E] hover:text-[#1C1917] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
