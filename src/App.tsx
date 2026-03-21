/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ArrowDown } from 'lucide-react';

// --- Константы и Типы ---

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// --- Вспомогательные функции ---

type DayInfo = {
  day: number;
  month: number;
  year: number;
  isFirstOfMonth: boolean;
  row: number;
  col: number;
};

type MonthLabelInfo = {
  name: string;
  year: number;
  monthIndex: number;
  startRow: number;
  endRow: number;
};

const generateCalendarData = (numMonthsBefore: number, numMonthsAfter: number) => {
  const days: DayInfo[] = [];
  const monthLabels: MonthLabelInfo[] = [];
  const now = new Date();
  const startMonth = now.getMonth();
  const startYearBase = now.getFullYear();

  let currentGlobalRow = 1;

  for (let m = -numMonthsBefore; m < numMonthsAfter; m++) {
    const totalMonths = startMonth + m;
    const year = startYearBase + Math.floor(totalMonths / 12);
    const monthIndex = ((totalMonths % 12) + 12) % 12;
    
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthStartRow = currentGlobalRow;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      const col = (date.getDay() + 6) % 7 + 2; // 2-8 (Column 1 is for labels)
      
      days.push({
        day: d,
        month: monthIndex,
        year: year,
        isFirstOfMonth: d === 1,
        row: currentGlobalRow,
        col: col
      });

      if (col === 8) {
        currentGlobalRow++;
      }
    }

    // Если месяц закончился не в конце недели, следующая неделя (строка) начнется здесь же или в следующей
    // Но для "слитно" мы увеличиваем ряд только если мы действительно перешли на новую строку
    const lastDay = days[days.length - 1];
    const monthEndRow = lastDay.col === 8 ? currentGlobalRow - 1 : currentGlobalRow;

    monthLabels.push({
      name: MONTHS[monthIndex],
      year,
      monthIndex,
      startRow: monthStartRow,
      endRow: monthEndRow
    });
    
    // Если месяц закончился не в воскресенье, следующая итерация продолжит в той же строке
  }
  return { days, monthLabels };
};

// --- Компоненты ---

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { days, monthLabels } = useMemo(() => generateCalendarData(60, 60), []); // Reduced range for performance in single grid
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Прокрутка к сегодняшнему дню при первой загрузке
  React.useEffect(() => {
    const todayElement = document.getElementById('today-marker');
    if (todayElement) {
      todayElement.scrollIntoView({ block: 'center' });
    }
  }, []);

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isSelected = (year: number, month: number, day: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
  };

  const getDayDiff = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return null;
    return diffDays > 0 ? `+${diffDays}` : `${diffDays}`;
  };

  const dayDiff = getDayDiff();

  const scrollToToday = () => {
    const todayElement = document.getElementById('today-marker');
    if (todayElement) {
      todayElement.scrollIntoView({ block: 'center' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#fdfcf0] text-[#1a1a1a] font-body selection:bg-zinc-200 selection:text-black">
      {/* Newspaper Masthead */}
      <header className="pt-4 pb-2 px-4 border-b-2 border-black mx-auto max-w-4xl">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tighter mb-1 italic">
            Chronos
          </h1>
          
          <div className="flex justify-center items-center w-full text-[11px] uppercase tracking-widest font-bold border-t border-black/20 pt-1 opacity-80 min-h-[24px]">
            <span>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {dayDiff && (
              <span className="bg-black text-[#fdfcf0] px-1.5 py-0 text-[10px] rounded-sm ml-2 leading-tight">
                {dayDiff}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Основная область прокрутки */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth pb-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Контейнер календаря */}
          <div className="bg-transparent overflow-hidden">
            {/* Заголовки дней недели */}
            <div className="grid grid-cols-[100px_1fr] border-b border-black sticky top-0 z-50 bg-[#fdfcf0]">
              <div className="border-r border-black flex items-center justify-center bg-black text-[#fdfcf0] text-[10px] uppercase tracking-widest font-bold">
                Period
              </div>
              <div className="grid grid-cols-7">
                {WEEKDAYS.map(day => (
                  <div key={day} className="py-3 text-[11px] uppercase tracking-widest font-black text-black text-center border-r border-black/10 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Единая сетка календаря */}
            <div 
              className="grid grid-cols-[100px_repeat(7,1fr)] relative border-l border-b-2 border-black"
              style={{ gridAutoRows: 'minmax(80px, auto)' }}
            >
              {/* Метки месяцев (в первом столбце) */}
              {monthLabels.map((m) => (
                <div 
                  key={`label-${m.year}-${m.monthIndex}`}
                  className="border-r border-black flex flex-col items-center justify-start py-10 sticky top-12 h-fit z-30 bg-transparent"
                  style={{ 
                    gridRow: `${m.startRow} / ${m.endRow + 1}`, 
                    gridColumn: 1 
                  }}
                >
                  <span className="text-[11px] font-serif italic font-bold tracking-tighter text-black/40 leading-none mb-1">
                    Anno
                  </span>
                  <span className="text-lg font-serif font-black tracking-tighter text-black leading-none mb-4">
                    {m.year}
                  </span>
                  <div className="w-px h-8 bg-black/20 mb-4" />
                  <span className="text-sm font-serif font-black uppercase tracking-[0.1em] text-black [writing-mode:vertical-rl] rotate-180">
                    {m.name}
                  </span>
                </div>
              ))}

              {/* Дни (в столбцах 2-8) */}
              {days.map((dayInfo) => {
                const { day, month, year, row, col } = dayInfo;
                const today = isToday(year, month, day);
                const selected = isSelected(year, month, day);
                const isWeekend = col === 7 || col === 8;
                const monthParity = month % 2 === 0;

                return (
                  <button
                    key={`${year}-${month}-${day}`}
                    id={today ? 'today-marker' : undefined}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    style={{ 
                      gridRow: row, 
                      gridColumn: col 
                    }}
                    className={`
                      relative transition-all duration-200 flex flex-col items-center justify-center group border-b border-r border-black/10
                      ${today ? 'bg-black text-[#fdfcf0] z-20' : 
                        selected ? 'bg-zinc-200 text-black z-10' :
                        `${monthParity ? 'bg-transparent' : 'bg-[#f5f4e8]'} ${isWeekend ? 'opacity-80' : ''} hover:bg-black/[0.05] text-black`}
                    `}
                  >
                    <span className={`relative z-10 text-xl font-serif ${selected || today ? 'font-black' : 'font-medium'}`}>
                      {day}
                    </span>
                    
                    {/* Ink dot for today */}
                    {today && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#fdfcf0] rounded-full" />
                    )}

                    {/* Subtle underline for selected */}
                    {selected && !today && (
                      <div className="absolute bottom-4 w-4 h-px bg-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom bar with Today button */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#fdfcf0]/80 backdrop-blur-sm border-t border-black/20 flex items-center justify-end px-4 z-50">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const now = new Date();
            setSelectedDate(now);
            const todayElement = document.getElementById('today-marker');
            todayElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }}
          className="bg-black text-[#fdfcf0] px-3 py-1 border border-black flex items-center gap-2 hover:bg-[#1a1a1a] transition-all uppercase tracking-[0.15em] font-black text-[9px]"
        >
          <CalendarIcon size={12} />
          <span>Today</span>
        </motion.button>
      </div>
    </div>
  );
}
