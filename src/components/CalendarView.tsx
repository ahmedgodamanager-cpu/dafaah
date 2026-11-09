import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, X, Clock, CheckCircle2 } from 'lucide-react';
import { parseDate } from '../utils/dateUtils';

interface CalendarViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  type: 'task' | 'contract';
  title: string;
  clientName: string;
  clientId: string;
  completed?: boolean;
}

export function CalendarView({ clients, onSelectClient }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Selected day for viewing all events modal
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: CalendarEvent[] } | null>(null);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Generate calendar days
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    
    clients.forEach(client => {
      // Contract end dates
      const endDate = parseDate(client.endDate);
      if (endDate) {
        allEvents.push({
          date: endDate.getDate(),
          month: endDate.getMonth(),
          year: endDate.getFullYear(),
          type: 'contract',
          title: 'نهاية العقد',
          clientName: client.clientName,
          clientId: client.id,
        });
      }

      // Tasks due dates
      client.tasks.forEach(task => {
        const dueDate = parseDate(task.dueDate);
        if (dueDate) {
          allEvents.push({
            date: dueDate.getDate(),
            month: dueDate.getMonth(),
            year: dueDate.getFullYear(),
            type: 'task',
            title: task.title,
            clientName: client.clientName,
            clientId: client.id,
            completed: task.completed,
          });
        }
      });
    });
    
    return allEvents;
  }, [clients]);

  // Build grid
  const gridDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridDays.push(null); // empty slots
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push(i);
  }
  
  const todayDate = new Date();
  const isToday = (d: number) => 
    d === todayDate.getDate() && 
    currentDate.getMonth() === todayDate.getMonth() && 
    currentDate.getFullYear() === todayDate.getFullYear();

  const getEventStyle = (evt: CalendarEvent) => {
    if (evt.type === 'contract') {
      return 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/25 hover:bg-[#F43F5E]/25';
    }
    if (evt.completed) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 line-through opacity-75 hover:bg-emerald-500/25';
    }
    return 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/25 hover:bg-[#6366F1]/25';
  };

  return (
    <div className="bg-[#18181B] rounded-2xl border border-[#27272A] shadow-xs overflow-hidden flex flex-col min-h-[640px]" dir="rtl">
      
      {/* Header with Outline Buttons */}
      <div className="p-4 sm:p-5 border-b border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#09090B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/25 text-[#6366F1] flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>التقويم الزمني</span>
              <span className="text-[11px] font-normal text-[#A1A1AA]">
                ({monthNames[currentDate.getMonth()]} {currentDate.getFullYear()})
              </span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">مواعيد تسليم المهام واستحقاقات العقود لجميع العملاء</p>
          </div>
        </div>
        
        {/* Navigation & Controls */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={today} 
            className="px-3.5 py-1.5 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] bg-transparent border border-[#27272A] hover:bg-[#202024] rounded-xl transition-all cursor-pointer"
          >
            اليوم
          </button>
          
          <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-xl p-1">
            <button 
              type="button"
              onClick={prevMonth} 
              className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="w-28 text-center text-xs font-bold font-mono text-[#FAFAFA]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button 
              type="button"
              onClick={nextMonth} 
              className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto flex flex-col p-4 bg-[#09090B]">
        <div className="grid grid-cols-7 min-w-[750px] gap-px bg-[#27272A] rounded-xl overflow-hidden border border-[#27272A]">
          
          {/* Day of Week Headers */}
          {dayNames.map(day => (
            <div key={day} className="bg-[#18181B] py-2.5 px-2 text-center text-sm font-medium text-[#A1A1AA]">
              {day}
            </div>
          ))}
          
          {/* Day Cells */}
          {gridDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-[#121214] min-h-[120px]" />;
            }
            
            const currentDayEvents = events.filter(
              e => e.date === day && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear()
            );
            const currentIsToday = isToday(day);
            const visibleEvents = currentDayEvents.slice(0, 3);
            const remainingCount = currentDayEvents.length - 3;
            
            return (
              <div 
                key={day} 
                className={`bg-[#18181B] min-h-[120px] p-2.5 flex flex-col justify-between transition-colors hover:bg-[#202024] relative ${
                  currentIsToday 
                    ? 'border-t-2 border-t-[#6366F1] bg-[#6366F1]/[0.06]' 
                    : ''
                }`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold font-mono w-6 h-6 flex items-center justify-center rounded-lg ${
                    currentIsToday 
                      ? 'bg-[#6366F1] text-white shadow-xs' 
                      : 'text-[#FAFAFA]'
                  }`}>
                    {day}
                  </span>

                  {currentDayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-[#71717A]">
                      {currentDayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* Task Pills (Max 3, Truncated) */}
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {visibleEvents.map((evt, i) => (
                    <div 
                      key={i}
                      onClick={() => onSelectClient(evt.clientId)}
                      className={`text-[11px] leading-tight px-2 py-1 rounded-md border cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap overflow-hidden ${getEventStyle(evt)}`}
                      title={`${evt.clientName}: ${evt.title}`}
                    >
                      <span className="font-bold shrink-0 truncate max-w-[50%] whitespace-nowrap">
                        {evt.clientName}
                      </span>
                      <span className="opacity-40 shrink-0 select-none">·</span>
                      <span className="truncate flex-1 min-w-0 whitespace-nowrap opacity-90">
                        {evt.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* More Tasks Button */}
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayEvents({ day, events: currentDayEvents })}
                    className="mt-1 text-[11px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] py-0.5 px-1.5 rounded text-center transition-colors cursor-pointer truncate"
                  >
                    +{remainingCount} مهام أخرى
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overflow Modal for Day Tasks */}
      {selectedDayEvents && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setSelectedDayEvents(null)}
        >
          <div 
            className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#6366F1]" />
                <h3 className="text-sm font-bold text-[#FAFAFA]">
                  مهام وتفعيلات يوم {selectedDayEvents.day} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 text-[#71717A] hover:text-[#FAFAFA] rounded-lg hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - List of all events */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedDayEvents.events.map((evt, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onSelectClient(evt.clientId);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${getEventStyle(evt)}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{evt.clientName}</span>
                      {evt.type === 'contract' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F43F5E]/20 text-[#F43F5E] font-bold">عقد</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 opacity-90 truncate">{evt.title}</div>
                  </div>
                  {evt.completed && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#27272A] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-1.5 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#09090B] border border-[#27272A] hover:bg-[#202024] rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

