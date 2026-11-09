import React, { useState, useEffect } from 'react';
import { StickyNote, Save, Check } from 'lucide-react';
import { Client } from '../types';

interface ClientNotesSectionProps {
  client: Client;
  onUpdateClient: (changes: Partial<Client> & { id: string }) => Promise<boolean | void> | void;
  isReadingMode?: boolean;
}

export const ClientNotesSection: React.FC<ClientNotesSectionProps> = ({ client, onUpdateClient, isReadingMode }) => {
  const [notes, setNotes] = useState(client.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Follow saved changes from others, but never wipe text the user is still typing.
  const lastSyncedRef = React.useRef(client.notes || '');
  useEffect(() => {
    const incoming = client.notes || '';
    setNotes(current => (current === lastSyncedRef.current ? incoming : current));
    lastSyncedRef.current = incoming;
  }, [client.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only the notes field; "saved" is shown only if the database accepted it.
      const ok = await onUpdateClient({ id: client.id, notes });
      if (ok !== false) {
        lastSyncedRef.current = notes;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          مذكرات وملاحظات العميل
        </h3>
        
        {!isReadingMode && (
          <button
            onClick={handleSave}
            disabled={isSaving || notes === (client.notes || '')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : notes !== (client.notes || '')
                ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-sm'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم الحفظ</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ المذكرات'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="اكتب ملاحظات سريعة، تحديثات، أو معلومات تهم الفريق هنا..."
          className="w-full min-h-[300px] p-5 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl text-[var(--text)] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
          readOnly={isReadingMode}
        />
        {isReadingMode && !notes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
            لا توجد مذكرات حالياً
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-[var(--text-muted)] flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        هذه الملاحظات مشتركة وتظهر لجميع أعضاء الفريق، استخدمها لتدوين المعلومات الهامة غير المرتبطة بتاسك محدد.
      </div>
    </div>
  );
};
