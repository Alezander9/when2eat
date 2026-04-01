import { useState } from "react";
import MiniCalendar from "./MiniCalendar";
import WeeklyView from "./WeeklyView";
import type { Slot, SlotsByDate, BookingResult } from "./calcom";

const cn = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

const DINING_HALLS = [
  "Arrillaga", "Branner", "Casper", "EVGR", "FloMo",
  "Lakeside", "Ricker", "Stern", "Wilbur",
];

function formatTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function formatDateHeading(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function mealLabel(iso: string, dayOfWeek: number): string {
  const h = new Date(iso).getHours() + new Date(iso).getMinutes() / 60;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) return h < 16 ? "Brunch" : "Dinner";
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  return "Dinner";
}

type Props = {
  hostName: string;
  eventSlug: string;
  slots: SlotsByDate | null;
  timeZone: string;
  locations: string[];
  onBook: (slotStart: string, guestName: string, location: string) => Promise<BookingResult>;
  owner?: {
    name: string;
    calUrl: string;
    onSaveName: (name: string) => void;
    onSaveCalUrl: (calUrl: string) => void;
    onSaveLocations: (locations: string[]) => void;
  };
};

type BookingState =
  | { step: "selecting" }
  | { step: "confirming"; slot: Slot }
  | { step: "loading"; slot: Slot }
  | { step: "success"; slot: Slot }
  | { step: "error"; message: string };

const StanfoodLink = ({ size = "h-7 w-7" }: { size?: string }) => (
  <a href="https://www.stanfood.live" target="_blank" rel="noopener noreferrer" className="shrink-0">
    <img src="/stanfoodicon.svg" alt="Stanfood" className={`${size} rounded-full transition-opacity hover:opacity-80`} />
  </a>
);

export default function BookingView({ hostName, eventSlug, slots, timeZone, locations, onBook, owner }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<BookingState>({ step: "selecting" });
  const [guestName, setGuestName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [localName, setLocalName] = useState(owner?.name ?? "");
  const [localCalUrl, setLocalCalUrl] = useState(owner?.calUrl ?? "");
  const [localLocations, setLocalLocations] = useState<string[]>(locations);
  const [customInput, setCustomInput] = useState("");
  const [showLocations, setShowLocations] = useState(false);

  const displayLocations = owner ? localLocations : locations;

  const availableDates = slots ? new Set(Object.keys(slots)) : new Set<string>();
  const slotsForDay = selectedDate && slots ? (slots[selectedDate] ?? []) : [];

  const allSlots = slots ? Object.values(slots).flat() : [];
  const durationMin = allSlots.length > 0
    ? Math.round((new Date(allSlots[0].end).getTime() - new Date(allSlots[0].start).getTime()) / 60000)
    : null;

  const toggleLocation = (loc: string) => {
    if (!owner) return;
    const next = localLocations.includes(loc)
      ? localLocations.filter(l => l !== loc)
      : [...localLocations, loc];
    setLocalLocations(next);
    owner.onSaveLocations(next);
  };

  const addCustomLocation = () => {
    if (!owner || !customInput.trim()) return;
    const loc = customInput.trim();
    if (!localLocations.includes(loc)) {
      const next = [...localLocations, loc];
      setLocalLocations(next);
      owner.onSaveLocations(next);
    }
    setCustomInput("");
  };

  const handleSlotClick = (slot: Slot) => {
    setBookingState({ step: "confirming", slot });
    setGuestName("");
    setSelectedLocation("");
  };

  const handleConfirm = async () => {
    if (bookingState.step !== "confirming" || !guestName.trim()) return;
    const { slot } = bookingState;
    setBookingState({ step: "loading", slot });
    try {
      await onBook(slot.start, guestName.trim(), selectedLocation);
      setBookingState({ step: "success", slot });
    } catch (err) {
      setBookingState({ step: "error", message: err instanceof Error ? err.message : "Booking failed" });
    }
  };

  const handleCancel = () => setBookingState({ step: "selecting" });

  const prettySlug = eventSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (bookingState.step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="max-w-md p-8 text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-sf-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="mb-2 font-display text-xl font-light tracking-[2px] text-charcoal">Booked!</h2>
          <p className="mb-1 text-charcoal/70">You're meeting with {hostName}</p>
          <p className="mb-1 text-sm text-tan">
            {formatDateHeading(bookingState.slot.start.slice(0, 10))} at {formatTime(bookingState.slot.start)}
          </p>
          {selectedLocation && (
            <p className="mb-1 text-sm text-tan">{selectedLocation}</p>
          )}
          <div className="mb-6" />
          <button
            onClick={() => setBookingState({ step: "selecting" })}
            className="rounded-lg border border-sage px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-cream-dark">
            Book another time
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen overflow-hidden bg-cream md:grid md:h-screen md:grid-cols-[320px_1fr]">
        {/* Left column: event meta + calendar */}
        <div className="flex flex-col border-b border-tan/30 p-6 md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="mb-6 flex items-center justify-center gap-3">
            <StanfoodLink size="h-8 w-8" />
            <span className="font-display text-xl font-extralight uppercase tracking-[3px] text-charcoal">When2Eat</span>
          </div>
          <div className="mb-6">
            {owner ? (
              <>
                <label className="mb-1 block text-xs font-medium text-tan">Name</label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={() => owner.onSaveName(localName)}
                  placeholder="Your name"
                  className="mb-3 w-full rounded-lg border border-sage bg-cream px-2 py-1 text-sm text-charcoal focus:border-sf-red focus:outline-none focus:ring-1 focus:ring-sf-red"
                />
                <label className="mb-1 block text-xs font-medium text-tan">Cal.com URL</label>
                <input
                  type="text"
                  value={localCalUrl}
                  onChange={(e) => setLocalCalUrl(e.target.value)}
                  onBlur={() => owner.onSaveCalUrl(localCalUrl)}
                  placeholder="cal.com/username/event-slug"
                  className="mb-4 w-full rounded-lg border border-sage bg-cream px-2 py-1 text-sm text-charcoal focus:border-sf-red focus:outline-none focus:ring-1 focus:ring-sf-red"
                />
                {/* Owner location picker */}
                <label className="mb-1.5 block text-xs font-medium text-tan">Locations</label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DINING_HALLS.map(hall => (
                    <button
                      key={hall}
                      onClick={() => toggleLocation(hall)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        localLocations.includes(hall)
                          ? "bg-sf-red text-white"
                          : "border border-sage text-charcoal/60 hover:border-tan",
                      )}>
                      {hall}
                    </button>
                  ))}
                  {localLocations.filter(l => !DINING_HALLS.includes(l)).map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className="rounded-full bg-sf-red px-2.5 py-1 text-xs font-medium text-white">
                      {loc} &times;
                    </button>
                  ))}
                </div>
                <div className="mb-4 flex gap-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCustomLocation()}
                    placeholder="Custom location"
                    className="flex-1 rounded-lg border border-sage bg-cream px-2 py-1 text-xs text-charcoal focus:border-sf-red focus:outline-none focus:ring-1 focus:ring-sf-red"
                  />
                  <button
                    onClick={addCustomLocation}
                    disabled={!customInput.trim()}
                    className="rounded-lg bg-sf-red px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-sf-red-hover disabled:opacity-30">
                    Add
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-1 text-sm text-tan">{hostName}</p>
                <h1 className="mb-4 text-xl font-semibold text-charcoal">{prettySlug}</h1>
              </>
            )}
            <div className="space-y-2 text-sm text-charcoal/70">
              {/* Guest locations display */}
              {!owner && displayLocations.length > 0 && (
                <div className="relative flex items-center gap-2">
                  <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <button
                    onClick={() => setShowLocations(!showLocations)}
                    className="text-charcoal/70 underline-offset-2 hover:text-charcoal hover:underline">
                    {displayLocations.length} location{displayLocations.length !== 1 ? "s" : ""} available
                  </button>
                  {showLocations && (
                    <div className="absolute left-0 top-7 z-10 rounded-lg border border-sage bg-cream p-3 shadow-lg">
                      <ul className="space-y-1 text-sm text-charcoal">
                        {displayLocations.map(l => <li key={l}>{l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {durationMin && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  {durationMin} min
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
                </svg>
                {timeZone.replace(/_/g, " ")}
              </div>
            </div>
          </div>
          <div>
            <MiniCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>

        {/* Desktop: weekly calendar view */}
        <div className="hidden min-h-0 md:block">
          {slots ? (
            <WeeklyView
              slots={slots}
              selectedDate={selectedDate}
              onSlotClick={handleSlotClick}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-tan">No availability to show</p>
            </div>
          )}
        </div>

        {/* Mobile: title + time slot buttons */}
        <div className="border-t border-tan/30 p-6 md:hidden">
          <h2 className="mb-4 flex items-center justify-center gap-2 font-display text-sm font-extralight uppercase tracking-[3px] text-charcoal">
            <StanfoodLink size="h-6 w-6" />
            When2Eat
          </h2>
        </div>
        <div className="px-6 pb-6 md:hidden">
          {selectedDate && slotsForDay.length > 0 ? (
            <>
              <h2 className="mb-4 text-sm font-semibold text-charcoal">
                {formatDateHeading(selectedDate)}
              </h2>
              <div className="space-y-2">
                {slotsForDay.map((slot) => {
                  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
                  const meal = mealLabel(slot.start, dayOfWeek);
                  return (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotClick(slot)}
                      className="flex w-full items-center justify-center rounded-lg border border-sage px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-sf-red hover:text-sf-red">
                      {meal} &ndash; {formatTime(slot.start)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center">
              <p className="text-sm text-tan">
                {selectedDate ? "No available times" : "Select a date to view available times"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking confirmation modal */}
      {(bookingState.step === "confirming" || bookingState.step === "loading") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-cream p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-semibold text-charcoal">Confirm booking</h3>
            <p className="mb-4 text-sm text-tan">
              {formatDateHeading(bookingState.slot.start.slice(0, 10))} at{" "}
              {formatTime(bookingState.slot.start)} – {formatTime(bookingState.slot.end)}
            </p>
            {displayLocations.length > 0 && (
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-charcoal/70">Location</label>
                <div className="flex flex-wrap gap-1.5">
                  {displayLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc === selectedLocation ? "" : loc)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        loc === selectedLocation
                          ? "bg-sf-red text-white"
                          : "border border-sage text-charcoal/70 hover:border-tan",
                      )}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="mb-1 block text-sm font-medium text-charcoal/70">Your name</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              className="mb-4 w-full rounded-lg border border-sage bg-cream px-3 py-2 text-sm text-charcoal focus:border-sf-red focus:outline-none focus:ring-1 focus:ring-sf-red"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-sage px-4 py-2 text-sm font-medium text-charcoal/70 transition-colors hover:bg-cream-dark">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!guestName.trim() || bookingState.step === "loading"}
                className="flex-1 rounded-lg bg-sf-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sf-red-hover disabled:opacity-50">
                {bookingState.step === "loading" ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {bookingState.step === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-cream p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold text-sf-red">Booking failed</h3>
            <p className="mb-4 text-sm text-charcoal/70">{bookingState.message}</p>
            <button
              onClick={handleCancel}
              className="w-full rounded-lg border border-sage px-4 py-2 text-sm font-medium text-charcoal/70 transition-colors hover:bg-cream-dark">
              Try again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
