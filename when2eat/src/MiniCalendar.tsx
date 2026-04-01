import { useState } from "react";

const cn = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Props = {
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export default function MiniCalendar({ availableDates, selectedDate, onSelectDate }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const todayString = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const isPastMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={isPastMonth}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            isPastMonth ? "text-tan/30 cursor-not-allowed" : "text-charcoal/60 hover:bg-cream-dark",
          )}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-charcoal">
          {MONTHS[viewMonth]} <span className="text-tan">{viewYear}</span>
        </h2>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/60 transition-colors hover:bg-cream-dark">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-charcoal/50">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {Array.from({ length: startDay }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isToday = dateStr === todayString;
          const isSelected = dateStr === selectedDate;
          const isAvailable = availableDates.has(dateStr);
          const isPast = dateStr < todayString;

          return (
            <button
              key={day}
              disabled={isPast || !isAvailable}
              onClick={() => onSelectDate(dateStr)}
              className="relative w-full pt-[100%]">
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-md text-sm transition-colors",
                  isSelected && "bg-sf-red text-white font-semibold",
                  isAvailable && !isSelected && !isPast && "bg-sage font-medium text-charcoal hover:bg-tan hover:text-white cursor-pointer",
                  isToday && !isSelected && "ring-1 ring-sf-red",
                  isPast && !isSelected && "text-tan/40 cursor-default",
                  !isAvailable && !isPast && !isSelected && "text-charcoal",
                )}>
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
