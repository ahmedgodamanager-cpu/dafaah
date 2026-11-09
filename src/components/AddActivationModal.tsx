import React, { useState, useEffect } from 'react';
import { getTodayStr } from '../utils/dateUtils';
import { createPortal } from 'react-dom';
import { X, Calendar, Share2, Layers, Link2, User, FileText, CheckCircle, Building2 } from 'lucide-react';
import { 
  DailyActivation, 
  DepartmentType,
  SocialPlatform, 
  ActivationType, 
  ActivationStatus,
  Client 
} from '../types';

interface AddActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  initialClientId?: string;
  /** True when opened from a client's own page: the client cannot be changed. */
  lockClient?: boolean;
  initialActivation?: DailyActivation | null;
  onSaveActivation: (clientId: string, activation: DailyActivation | DailyActivation[]) => void;
}

const DEPARTMENTS: { id: DepartmentType; labelAr: string; color: string; defaultPlatform: SocialPlatform; defaultType: ActivationType }[] = [
  { id: 'قسم السوشيال ميديا', labelAr: 'قسم السوشيال ميديا', color: 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-200', defaultPlatform: 'انستجرام', defaultType: 'ستوري (Story)' },
  { id: 'قسم الميديا باينج', labelAr: 'قسم الميديا باينج', color: 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200', defaultPlatform: 'سناب شات', defaultType: 'حملة إعلانية' },
  { id: 'قسم السيو', labelAr: 'قسم السيو', color: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200', defaultPlatform: 'موقع إلكتروني / SEO', defaultType: 'تحسين SEO / مقال' },
  { id: 'قسم الأكونت مانجمنت', labelAr: 'قسم الأكونت مانجمنت', color: 'bg-[var(--surface-hover)] border-[var(--border)] text-slate-900 dark:text-slate-200', defaultPlatform: 'أخرى', defaultType: 'تقرير يومي' },
];

const PLATFORMS: SocialPlatform[] = [
  'انستجرام',
  'سناب شات',
  'تيك توك',
  'موقع إلكتروني / SEO',
  'تويتر / X',
  'فيسبوك',
  'لينكدإن',
  'يوتيوب',
  'أخرى'
];

const ACTIVITY_TYPES: ActivationType[] = [
  'ستوري (Story)',
  'بوست (Post)',
  'فيديو / ريلز (Reel)',
  'حملة إعلانية',
  'تغطية ميدانية',
  'تحسين SEO / مقال',
  'تقرير يومي',
  'أخرى'
];

const STATUSES: ActivationStatus[] = [
  'تم النشر',
  'قيد التنفيذ',
  'بانتظار الاعتماد',
  'مؤجل'
];

interface DepartmentFormState {
  department: DepartmentType;
  title: string;
  link: string;
  notes: string;
}

export const AddActivationModal: React.FC<AddActivationModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClientId = '',
  lockClient = false,
  initialActivation = null,
  onSaveActivation
}) => {
  const todayStr = getTodayStr(); // local date (UTC is a day behind after midnight in UTC+3)

  const [clientId, setClientId] = useState<string>(initialClientId);
  const [date, setDate] = useState<string>(todayStr);
  const [createdBy, setCreatedBy] = useState<string>('');

  // Single edit mode state
  const [singleDept, setSingleDept] = useState<DepartmentType>('قسم السوشيال ميديا');
  const [singleTitle, setSingleTitle] = useState<string>('');
  const [singleLink, setSingleLink] = useState<string>('');
  const [singleNotes, setSingleNotes] = useState<string>('');

  // Multi department active selection (for new additions)
  const [activeDepts, setActiveDepts] = useState<DepartmentType[]>(['قسم السوشيال ميديا']);
  const [deptForms, setDeptForms] = useState<Record<DepartmentType, DepartmentFormState>>({
    'قسم السوشيال ميديا': {
      department: 'قسم السوشيال ميديا',
      title: '',
      link: '',
      notes: ''
    },
    'قسم الميديا باينج': {
      department: 'قسم الميديا باينج',
      title: '',
      link: '',
      notes: ''
    },
    'قسم السيو': {
      department: 'قسم السيو',
      title: '',
      link: '',
      notes: ''
    },
    'قسم الأكونت مانجمنت': {
      department: 'قسم الأكونت مانجمنت',
      title: '',
      link: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialActivation) {
        // Edit mode
        setDate(initialActivation.date || todayStr);
        setSingleDept(initialActivation.department || 'قسم السوشيال ميديا');
        setSingleTitle(initialActivation.title || '');
        setCreatedBy(initialActivation.createdBy || '');
        setSingleLink(initialActivation.link || '');
        setSingleNotes(initialActivation.notes || '');
      } else {
        // Create mode
        setDate(todayStr); // Defaults to today automatically
        setCreatedBy('');
        setActiveDepts(['قسم السوشيال ميديا', 'قسم الميديا باينج']); // default active depts
        setDeptForms({
          'قسم السوشيال ميديا': {
            department: 'قسم السوشيال ميديا',
            title: '',
            link: '',
            notes: ''
          },
          'قسم الميديا باينج': {
            department: 'قسم الميديا باينج',
            title: '',
            link: '',
            notes: ''
          },
          'قسم السيو': {
            department: 'قسم السيو',
            title: '',
            link: '',
            notes: ''
          },
          'قسم الأكونت مانجمنت': {
            department: 'قسم الأكونت مانجمنت',
            title: '',
            link: '',
            notes: ''
          }
        });
      }

      // The suggested client, or none: the user picks one. It used to fall back to the FIRST client
      // in the list (and lock the dropdown on it), so activations added from the Activations page or
      // the header were all saved on that one client.
      // (The client list is deliberately not a dependency: it changes on every live update and
      // resetting here wiped what the user was typing.)
      setClientId(initialClientId || '');
    }
  }, [isOpen, initialClientId, initialActivation]);

  if (!isOpen) return null;

  const toggleDeptActive = (deptId: DepartmentType) => {
    if (activeDepts.includes(deptId)) {
      if (activeDepts.length === 1) {
        alert('يجب اختيار قسم نشط واحد على الأقل');
        return;
      }
      setActiveDepts(prev => prev.filter(d => d !== deptId));
    } else {
      setActiveDepts(prev => [...prev, deptId]);
    }
  };

  const updateDeptFormField = (deptId: DepartmentType, field: keyof DepartmentFormState, value: any) => {
    setDeptForms(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('يرجى اختيار العميل');
      return;
    }

    if (initialActivation) {
      // Editing existing single activation
      if (!singleTitle.trim()) {
        alert('يرجى كتابة التفعيل اليومي للقسم');
        return;
      }

      const updatedActivation: DailyActivation = {
        id: initialActivation.id,
        date: date || todayStr,
        department: singleDept,
        title: singleTitle.trim(),
        createdBy: createdBy.trim() || undefined,
        link: singleLink.trim() || undefined,
        notes: singleNotes.trim() || undefined,
        createdAt: initialActivation.createdAt || new Date().toISOString()
      };

      onSaveActivation(clientId, updatedActivation);
      onClose();
    } else {
      // Creating activations for active checked departments
      if (activeDepts.length === 0) {
        alert('يرجى اختيار قسم واحد على الأقل للعميل');
        return;
      }

      // Check that each active department has a title written
      const activationsToSave: DailyActivation[] = [];
      for (const deptId of activeDepts) {
        const form = deptForms[deptId];
        if (!form.title.trim()) {
          const deptName = DEPARTMENTS.find(d => d.id === deptId)?.labelAr || deptId;
          alert(`يرجى كتابة التفعيل اليومي الخاص بـ (${deptName})`);
          return;
        }

        activationsToSave.push({
          // Unique per department: the old `act-<time>-<0..999>` could give two departments saved
          // in the same click the same id, and the second one overwrote the first.
          id: `act-${Date.now()}-${activationsToSave.length}-${Math.random().toString(36).slice(2, 8)}`,
          date: date || todayStr,
          department: deptId,
          title: form.title.trim(),
          createdBy: createdBy.trim() || undefined,
          link: form.link.trim() || undefined,
          notes: form.notes.trim() || undefined,
          createdAt: new Date().toISOString()
        });
      }

      onSaveActivation(clientId, activationsToSave);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialActivation ? 'تعديل سجل التفعيل' : 'تسجيل التفعيل اليومي للأقسام النشطة'}
              </h2>
              <p className="text-xs text-slate-300">
                {initialActivation 
                  ? 'تحديث بيانات التفعيل للقسم المحدد' 
                  : 'حدد الأقسام التي تعمل للعميل واكتب التفعيل الخاص بكل قسم'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Top Bar: Select Client, Date (Auto Today), Publisher */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-[var(--border)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  العميل *
                </label>
                <select
                  value={clientId || ''}
                  onChange={(e) => setClientId(e.target.value)}
                  // Locked when opened from a client's page, and when editing: changing the client of an
                  // existing activation saved a second copy on the new client and kept the old one.
                  disabled={lockClient || !!initialActivation}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                >
                  <option value="" disabled>اختر العميل...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} ({c.code}) - {c.contract}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date (Auto Today) */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>التاريخ *</span>
                  </span>
                  {date === todayStr && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      محدد تلقائيًا: اليوم
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={date || ''}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>
            </div>

            {/* Publisher / Person in Charge */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم المسؤول / كاتِب التفعيل (اختياري)</span>
              </label>
              <input
                type="text"
                value={createdBy || ''}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="مثال: أحمد (مدير الحساب) / عمر"
                className="w-full text-xs p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* SINGLE EDIT MODE */}
          {initialActivation ? (
            <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200">
              <h3 className="text-xs font-extrabold text-indigo-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>تعديل بيانات القسم والتفعيل</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">القسم *</label>
                <select
                  value={singleDept || ''}
                  onChange={(e) => setSingleDept(e.target.value as DepartmentType)}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-bold"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.id}>{d.labelAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  ما تم تنفيذه / التفعيل اليومي *
                </label>
                <textarea
                  value={singleTitle || ''}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  placeholder="اكتب تفاصيل ما تم تنفيذه..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>الرابط (اختياري)</span>
                  </label>
                  <input
                    type="url"
                    value={singleLink || ''}
                    onChange={(e) => setSingleLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>ملاحظات (اختياري)</span>
                  </label>
                  <input
                    type="text"
                    value={singleNotes || ''}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    className="w-full text-xs p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium"
                  />
                </div>
              </div>

            </div>
          ) : (
            /* MULTI-DEPARTMENT ACTIVE MODE (FOR CREATION) */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[var(--text)] mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>حدد الأقسام الشغالة/النشطة للعميل اليوم:</span>
                  <span className="text-[11px] font-normal text-[var(--text-muted)]">(يمكن تحديد أكثر من قسم)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEPARTMENTS.map(dept => {
                    const isChecked = activeDepts.includes(dept.id);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => toggleDeptActive(dept.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isChecked 
                            ? `${dept.color} ring-2 ring-indigo-500 shadow-xs font-extrabold` 
                            : 'bg-slate-50 dark:bg-slate-800/50 border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by button
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-xs">{dept.labelAr}</span>
                        </div>
                        {isChecked && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            نشط
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INPUT CARDS FOR EACH ACTIVE CHECKED DEPARTMENT */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-extrabold text-[var(--text)] border-b border-[var(--border)] pb-2">
                  كتابة التفعيل اليومي للأقسام النشطة ({activeDepts.length} قسم):
                </h4>

                {DEPARTMENTS.filter(d => activeDepts.includes(d.id)).map(dept => {
                  const form = deptForms[dept.id];
                  // Rendered in place: this was createPortal(...) WITHOUT a target element, which makes React
                  // throw "Target container is not a DOM element" and crashes the modal.
                  return (
                    <div 
                      key={dept.id}
                      className={`p-4 rounded-2xl border ${dept.color} space-y-3 shadow-xs animate-in fade-in duration-150`}
                    >
                      {/* Dept Card Title Header */}
                      <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-2">
                        <span className="text-xs font-extrabold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                          <span>{dept.labelAr}</span>
                        </span>
                      </div>

                      {/* Manual Activation Textarea */}
                      <div>
                        <label className="block text-xs font-bold text-[var(--text)] mb-1">
                          التفعيل اليومي / ما تم تنفيذه *
                        </label>
                        <textarea
                          value={form.title || ''}
                          onChange={(e) => updateDeptFormField(dept.id, 'title', e.target.value)}
                          placeholder={`اكتب هنا ما تم تنفيذه في ${dept.labelAr}...`}
                          rows={2}
                          className="w-full text-xs p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                          required
                        />
                      </div>

                      {/* Optional Link & Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text)] mb-1 flex items-center gap-1">
                            <Link2 className="w-3 h-3 text-slate-400" />
                            <span>الرابط (اختياري)</span>
                          </label>
                          <input
                            type="url"
                            value={form.link || ''}
                            onChange={(e) => updateDeptFormField(dept.id, 'link', e.target.value)}
                            placeholder="https://..."
                            className="w-full text-xs p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium dir-ltr text-right"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text)] mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>ملاحظات (اختياري)</span>
                          </label>
                          <input
                            type="text"
                            value={form.notes || ''}
                            onChange={(e) => updateDeptFormField(dept.id, 'notes', e.target.value)}
                            placeholder="ملاحظات أو نتائج خاصة بهذا القسم..."
                            className="w-full text-xs p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Form Submit & Cancel Actions */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-[11px] text-[var(--text-muted)] font-medium">
              {!initialActivation && (
                <span>سيتم حفظ ({activeDepts.length}) تفعيل للأقسام النشطة</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-hover)] hover:bg-slate-200 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {initialActivation 
                    ? 'حفظ التعديلات' 
                    : `تسجيل تفعيلات الأقسام (${activeDepts.length})`}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  ,
  document.body
  );
};
