import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Client } from '../types';
import { makeLogoDataUrl } from '../utils/logoImage';

interface ClientLogoProps {
  client: Client;
  /** Saves client fields; `logoUrl: undefined` removes the logo. */
  onUpdateClient: (changes: Partial<Client> & { id: string }) => Promise<boolean | void> | void;
  isReadingMode?: boolean;
}

/** Largest picture accepted before it is shrunk. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * The client's logo next to the client's name. Clicking it adds or changes the logo (picked from the
 * device and shrunk to a few KB, see utils/logoImage.ts); the small × removes it. In reading mode
 * the logo is only shown.
 */
export const ClientLogo: React.FC<ClientLogoProps> = ({ client, onUpdateClient, isReadingMode = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const logo = client.logoUrl;
  const canEdit = !isReadingMode;

  if (!logo && !canEdit) return null;

  const pickFile = () => {
    if (canEdit && !saving) inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // the same file can be picked again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('اختر صورة للوجو (PNG أو JPG أو WebP أو SVG)');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('حجم الصورة كبير جداً، اختر صورة أقل من 10 ميجابايت');
      return;
    }
    setSaving(true);
    try {
      const logoUrl = await makeLogoDataUrl(file);
      const ok = await onUpdateClient({ id: client.id, logoUrl });
      if (ok !== false) toast.success('تم حفظ لوجو العميل');
    } catch (err: any) {
      toast.error(
        err?.message === 'logo-too-big'
          ? 'تعذّر تصغير الصورة بما يكفي، جرّب صورة أبسط'
          : 'تعذّرت قراءة الصورة، جرّب صورة أخرى'
      );
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = async () => {
    if (saving || !window.confirm('حذف لوجو العميل؟')) return;
    setSaving(true);
    try {
      const ok = await onUpdateClient({ id: client.id, logoUrl: undefined });
      if (ok !== false) toast.success('تم حذف لوجو العميل');
    } finally {
      setSaving(false);
    }
  };

  const fileInput = canEdit && (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
      className="hidden"
      onChange={handleFile}
      aria-hidden="true"
      tabIndex={-1}
    />
  );

  const spinner = saving && (
    <span className="absolute inset-0 grid place-items-center bg-white/75 dark:bg-black/55">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </span>
  );

  if (!logo) {
    return (
      <>
        {fileInput}
        <button
          type="button"
          onClick={pickFile}
          disabled={saving}
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-600 dark:text-slate-500 dark:hover:border-indigo-400 dark:hover:text-indigo-400 cursor-pointer print:hidden"
          title="إضافة لوجو العميل"
          aria-label="إضافة لوجو العميل"
        >
          <span className="flex flex-col items-center gap-0.5">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-bold">اللوجو</span>
          </span>
          {spinner}
        </button>
      </>
    );
  }

  return (
    <div className="group relative shrink-0">
      {fileInput}
      {/* Same height for every logo; a wide wordmark gets a wider tile instead of shrinking. */}
      <button
        type="button"
        onClick={pickFile}
        disabled={!canEdit || saving}
        className={`relative flex h-16 min-w-16 max-w-44 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-xs dark:border-[#3f3f46] ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
        title={canEdit ? 'تغيير لوجو العميل' : undefined}
        aria-label={canEdit ? 'تغيير لوجو العميل' : `لوجو ${client.clientName}`}
      >
        <img src={logo} alt={`لوجو ${client.clientName}`} className="h-full w-auto max-w-full object-contain" />
        {canEdit && !saving && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-0.5 text-center text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 print:hidden">
            تغيير
          </span>
        )}
        {spinner}
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={removeLogo}
          disabled={saving}
          className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-slate-500 shadow-xs transition hover:text-rose-600 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 cursor-pointer print:hidden"
          title="حذف اللوجو"
          aria-label="حذف لوجو العميل"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
