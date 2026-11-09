import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, MessageSquare, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Client } from '../types';
import { buildWeeklySummary } from '../utils/weeklySummary';
import { getWhatsAppLink } from '../utils/dateUtils';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const copyText = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
};

/**
 * The weekly update for the client (done in the last 7 days, due in the next 7), ready to send on
 * WhatsApp. The text can be edited before it is copied or sent.
 */
export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({ isOpen, onClose, client }) => {
  const [text, setText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [counts, setCounts] = React.useState({ done: 0, upcoming: 0 });

  // Built when the window opens (not on every data change, so typed edits are kept).
  React.useEffect(() => {
    if (!isOpen) return;
    const summary = buildWeeklySummary(client);
    setText(summary.text);
    setCounts({ done: summary.done.length, upcoming: summary.upcoming.length });
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, client.id]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const waHref = client.clientNumber ? getWhatsAppLink(client.clientNumber, text) : '#';
  const canSend = waHref !== '#';

  const handleCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      toast.success('تم نسخ الرسالة');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('تعذّر نسخ الرسالة');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-summary-title"
        className="bg-[var(--surface)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200"
      >
        <div className="p-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="weekly-summary-title" className="text-base font-bold text-[var(--text)]">ملخص الأسبوع للعميل</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                المنجز خلال آخر 7 أيام: {counts.done}، والمستحق خلال الأسبوع القادم: {counts.upcoming}. راجع الرسالة وعدّلها قبل الإرسال.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-[var(--text)] rounded-lg transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <label htmlFor="weekly-summary-text" className="sr-only">نص الرسالة</label>
          <textarea
            id="weekly-summary-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm leading-relaxed text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          {!canSend && (
            <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              لا يوجد رقم واتساب صحيح لهذا العميل، انسخ الرسالة وأرسلها يدوياً.
            </p>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border)] flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--text)] bg-white dark:bg-slate-800 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl transition-all cursor-pointer"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--text)] bg-white dark:bg-slate-800 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ الرسالة'}
          </button>
          {canSend && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              فتح واتساب
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
