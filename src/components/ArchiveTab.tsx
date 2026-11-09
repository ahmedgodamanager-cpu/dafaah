import React, { useState, useMemo } from 'react';
import { Client, FilterState, DashboardConfig } from '../types';
import { ClientCard } from './ClientCard';
import { ClientListTable } from './ClientListTable';
import { Archive, LayoutGrid, List, Building2, ChevronUp, ChevronDown, Inbox, RotateCcw } from 'lucide-react';

export interface ArchiveTabProps {
  clients: Client[];
  searchQuery?: string;
  /** Not applied: the dashboard filters are not visible on the archive page. */
  filterState?: FilterState;
  onSelectClient: (id: string) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onArchiveToggle: (client: Client) => void;
  onAddTask: (clientId: string) => void;
  dashboardConfig: DashboardConfig;
  setDashboardConfig?: React.Dispatch<React.SetStateAction<DashboardConfig>>;
  usersMap?: Record<string, string>;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({
  clients,
  searchQuery = '',
  onSelectClient,
  onEditClient,
  onDeleteClient,
  onArchiveToggle,
  onAddTask,
  dashboardConfig,
  setDashboardConfig,
  usersMap,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(dashboardConfig.viewMode || 'grid');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const toggleCompanySection = (company: string) => {
    // true = collapsed. (`prev === false ? true : false` turned the first click into a no-op.)
    setExpandedCompanies(prev => ({ ...prev, [company]: !prev[company] }));
  };

  // Filter only archived / completed / lost clients
  const archivedClients = useMemo(() => {
    return clients.filter(client => {
      // Must be archived or completed or lost
      const isArchived = client.isArchived || client.caseStatus === 'مكتمل' || client.isLost;
      if (!isArchived) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          (client.clientName || '').toLowerCase().includes(q) ||
          (client.companyName && client.companyName.toLowerCase().includes(q)) ||
          (client.code || '').toLowerCase().includes(q) ||
          (client.clientNumber || '').includes(q) ||
          (client.groupName || '').toLowerCase().includes(q) ||
          (client.contract && client.contract.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // The dashboard's card filters (status / company / contract) are NOT applied here: they are
      // not visible on this page, so e.g. a "نشط" filter chosen on the dashboard hid every archived
      // client with no way to see why.
      return true;
    });
  }, [clients, searchQuery]);

  const companies = useMemo(() => {
    return Array.from(new Set<string>(archivedClients.map(c => c.companyName || 'بدون شركة'))).sort((a, b) => {
      if (a === 'بدون شركة') return 1;
      if (b === 'بدون شركة') return -1;
      return a.localeCompare(b);
    });
  }, [archivedClients]);

  const handleModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    if (setDashboardConfig) {
      setDashboardConfig(prev => ({ ...prev, viewMode: mode }));
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>أرشيف العملاء</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[var(--text)] font-bold">
                {archivedClients.length}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              عرض العملاء المؤرشفين، العقود المنتهية، أو الحالات المكتملة
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/50 print:hidden self-end sm:self-auto">
          <button
            onClick={() => handleModeChange('grid')}
            className={`p-2 sm:p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="عرض البطاقات"
            aria-label="عرض البطاقات"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleModeChange('table')}
            className={`p-2 sm:p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="عرض الجدول/القائمة"
            aria-label="عرض الجدول/القائمة"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {archivedClients.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] p-8 shadow-xs">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">الأرشيف فارغ</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
            لا توجد أي حسابات عملاء مؤرشفة أو مكتملة حالياً مطابقة لشروط البحث والفلاتر.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map(company => {
            const companyClients = archivedClients.filter(c => (c.companyName || 'بدون شركة') === company);
            const isCollapsed = expandedCompanies[company] === true;

            return (
              <div
                key={company}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs print:overflow-visible print:bg-white print:border-gray-300 print:shadow-none print:mb-6 print:break-inside-auto"
              >
                <button
                  onClick={() => toggleCompanySection(company)}
                  className="w-full flex items-center justify-between py-2.5 sm:py-2 px-3 sm:px-4 bg-[var(--surface-hover)]/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right touch-manipulation min-h-[48px] print:bg-gray-100 print:border-b print:border-gray-300"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="flex items-center justify-center w-[36px] h-[48px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h3 className="font-bold text-[var(--text)] text-sm sm:text-base truncate print:text-black">
                      {company}
                    </h3>
                    <span className="bg-white dark:bg-slate-800 text-[var(--text-muted)] text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold border border-[var(--border)] shrink-0 print:bg-white print:border-gray-300 print:text-black">
                      {companyClients.length} عميل مؤرشف
                    </span>
                  </div>
                  {!isCollapsed ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 print:hidden" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 print:hidden" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="p-2 sm:p-4 md:p-6 border-t border-[var(--border)] bg-slate-50/30 dark:bg-slate-900/30 print:p-2 print:bg-white print:border-none print:overflow-visible">
                    {viewMode === 'table' ? (
                      <div className="w-full">
                        <ClientListTable
                          clients={companyClients}
                          onSelect={onSelectClient}
                          onEdit={onEditClient}
                          onDelete={onDeleteClient}
                          onArchiveToggle={onArchiveToggle}
                          onAddTask={onAddTask}
                          config={{ ...dashboardConfig, viewMode: 'table' }}
                          usersMap={usersMap}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 print:grid print:grid-cols-2 print:gap-4 print:w-full">
                        {companyClients.map(client => (
                          <ClientCard
                            key={client.id}
                            client={client}
                            onSelect={onSelectClient}
                            onEdit={onEditClient}
                            onDelete={onDeleteClient}
                            onArchiveToggle={onArchiveToggle}
                            onAddTask={onAddTask}
                            draggable={false}
                            usersMap={usersMap}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArchiveTab;
