import React from 'react';
import { Client } from '../types';
import { Info, Clock, Users } from 'lucide-react';
import { useClientActivities } from '../hooks/useFirestoreData';

interface ClientActivitiesSectionProps {
  client: Client;
}

const toTime = (value?: string) => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

export const ClientActivitiesSection: React.FC<ClientActivitiesSectionProps> = ({ client }) => {
  // The log is loaded only for the client that is open (it used to be downloaded for every
  // client on every page load, which used up the daily database quota).
  const { activities, loading } = useClientActivities(client.id);
  const sorted = [...activities].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[var(--text)] mb-6 flex items-center gap-2">
        <Info className="w-5 h-5 text-emerald-500" />
        سجل النشاطات والأحداث
      </h3>
      {loading && sorted.length === 0 ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
          <Info className="w-12 h-12 text-emerald-400 mb-4 opacity-50" />
          <p className="text-[var(--text-muted)] font-medium text-lg">لا يوجد أي نشاط مسجل حتى الآن</p>
        </div>
      ) : (
        <div className="relative border-r-2 border-emerald-100 dark:border-emerald-900/50 pr-6 mr-3 space-y-6">
          {sorted.map(activity => {
            const time = toTime(activity.createdAt);
            return (
              <div key={activity.id} className="relative">
                <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -right-[29px] top-2 shadow-[0_0_0_4px_var(--surface)]" />
                <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-[var(--text)]">{activity.action}</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {time
                        // ar-EG: Gregorian calendar like the rest of the app (ar-SA showed Hijri dates)
                        ? `${new Date(time).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })} - ${new Date(time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
                        : '-'}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-sm text-[var(--text-muted)] mb-3">{activity.details}</p>
                  )}
                  {activity.performedBy && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Users className="w-3 h-3" />
                      <span>بواسطة: {activity.performedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
