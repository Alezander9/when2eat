import { useState, useEffect, useRef } from "react";
import type { Slot, SlotsByDate } from "./calcom";

const HOUR_H = 58;
const GUTTER = 56;
const PAD = 10;
const ONE_MIN = HOUR_H / 60;
const CONTENT_H = PAD + 24 * HOUR_H + PAD;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HATCH =
  "repeating-linear-gradient(135deg, #ede7e0 0px, #ede7e0 4px, #d8cfc4 4px, #d8cfc4 5px)";

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
}

function getWeekDays(startStr: string): string[] {
  const d = new Date(startStr + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d.getTime());
    dt.setDate(d.getDate() + i);
    return toDateStr(dt);
  });
}

function minsFromMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function fmtHour(h: number) {
  const suffix = h < 12 || h === 24 ? "am" : "pm";
  const hr = h === 0 || h === 24 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:00${suffix}`;
}

function fmtTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function mealLabel(iso: string, dayOfWeek: number): string {
  const h = new Date(iso).getHours() + new Date(iso).getMinutes() / 60;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) return h < 16 ? "Brunch" : "Dinner";
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  return "Dinner";
}

function formatWeekRange(days: string[]) {
  const start = new Date(days[0] + "T12:00:00");
  const end = new Date(days[6] + "T12:00:00");
  const sMonth = start.toLocaleDateString("en-US", { month: "long" });
  const eMonth = end.toLocaleDateString("en-US", { month: "long" });
  if (sMonth === eMonth)
    return `${sMonth} ${start.getDate()} \u2013 ${end.getDate()}, ${end.getFullYear()}`;
  return `${sMonth} ${start.getDate()} \u2013 ${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

type Props = {
  slots: SlotsByDate;
  selectedDate: string | null;
  onSlotClick: (slot: Slot) => void;
};

export default function WeeklyView({ slots, selectedDate, onSlotClick }: Props) {
  const todayStr = toDateStr(new Date());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate || todayStr));
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) setWeekStart(getWeekStart(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = PAD + 8 * HOUR_H;
    });
  }, []);

  const weekDays = getWeekDays(weekStart);
  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(toDateStr(d));
  };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = weekDays.includes(todayStr);
  const nowTop = PAD + nowMin * ONE_MIN;
  const nowLabel = now
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-cream">
      {/* Nav bar */}
      <div className="flex shrink-0 items-center border-b border-tan/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-charcoal">{formatWeekRange(weekDays)}</h2>
          <button
            onClick={() => shiftWeek(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-tan transition-colors hover:bg-cream-dark hover:text-charcoal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-tan transition-colors hover:bg-cream-dark hover:text-charcoal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <span className="flex-1 text-center font-display text-sm font-extralight uppercase tracking-[3px] text-charcoal">
          When2Eat
        </span>
        <a href="https://www.stanfood.live" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img src="/stanfoodlogo.svg" alt="Stanfood" className="h-7 transition-opacity hover:opacity-80" />
        </a>
      </div>

      {/* Day header */}
      <div className="flex shrink-0 border-b border-tan/30">
        <div style={{ width: GUTTER }} className="shrink-0" />
        {weekDays.map((day, i) => {
          const d = new Date(day + "T12:00:00");
          const isToday = day === todayStr;
          return (
            <div
              key={day}
              className={`flex flex-1 items-center justify-center py-3 text-xs font-medium uppercase ${isToday ? "text-charcoal" : "text-charcoal/50"}`}>
              {WEEKDAYS[i]}{" "}
              <span className={isToday ? "ml-1 rounded-md bg-sf-red px-1 py-0.5 text-white" : "ml-1"}>
                {String(d.getDate()).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: CONTENT_H }}>
          {/* Left gutter with hour labels */}
          <div className="relative shrink-0" style={{ width: GUTTER }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] leading-none text-tan"
                style={{ top: PAD + h * HOUR_H }}>
                {fmtHour(h)}
              </div>
            ))}
            {showNow && (
              <div
                className="absolute right-1 z-20 -translate-y-1/2 text-[11px] font-semibold leading-none text-sf-red"
                style={{ top: nowTop }}>
                {nowLabel}
              </div>
            )}
          </div>

          {/* Calendar grid area */}
          <div className="relative flex-1 border-l border-tan/30">
            {/* Hatch background */}
            <div
              className="absolute left-0 right-0"
              style={{ top: PAD, height: 24 * HOUR_H, background: HATCH }}
            />

            {/* Horizontal grid lines */}
            {Array.from({ length: 25 }, (_, h) => (
              <div
                key={h}
                className="absolute left-0 right-0 h-px bg-tan/30"
                style={{ top: PAD + h * HOUR_H }}
              />
            ))}

            {/* Day columns */}
            <div
              className="absolute left-0 right-0 grid"
              style={{ top: PAD, height: 24 * HOUR_H, gridTemplateColumns: "repeat(7, 1fr)" }}>
              {weekDays.map((day, i) => {
                const daySlots = slots[day] ?? [];
                const dayOfWeek = new Date(day + "T12:00:00").getDay();
                return (
                  <div key={day} className={`relative ${i > 0 ? "border-l border-tan/30" : ""}`}>
                    {daySlots.map((slot) => {
                      const startMin = minsFromMidnight(slot.start);
                      const endMin = minsFromMidnight(slot.end);
                      const top = startMin * ONE_MIN;
                      const height = (endMin - startMin) * ONE_MIN;
                      const meal = mealLabel(slot.start, dayOfWeek);
                      return (
                        <div
                          key={slot.start}
                          className="group/slot absolute z-[3] w-full bg-cream"
                          style={{ top, height: Math.max(height, 22) }}>
                          <button
                            onClick={() => onSlotClick(slot)}
                            className="absolute inset-0 hidden cursor-pointer items-start rounded-lg bg-sf-red px-2 py-1 text-xs font-medium text-white group-hover/slot:flex">
                            <span className="truncate">{meal} &ndash; {fmtTime(slot.start)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {showNow && (
              <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                <div className="relative h-[2px] bg-sf-red">
                  <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-sf-red" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
