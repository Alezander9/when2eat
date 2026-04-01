import { useState } from "react";
import MiniCalendar from "./MiniCalendar";
import WeeklyView from "./WeeklyView";
import type { Slot, SlotsByDate, BookingResult } from "./calcom";

function formatTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function formatDateHeading(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type Props = {
  hostName: string;
  eventSlug: string;
  slots: SlotsByDate | null;
  timeZone: string;
  onBook: (slotStart: string, guestName: string) => Promise<BookingResult>;
  owner?: {
    name: string;
    calUrl: string;
    onSaveName: (name: string) => void;
    onSaveCalUrl: (calUrl: string) => void;
  };
};

type BookingState =
  | { step: "selecting" }
  | { step: "confirming"; slot: Slot }
  | { step: "loading"; slot: Slot }
  | { step: "success"; slot: Slot }
  | { step: "error"; message: string };

export default function BookingView({ hostName, eventSlug, slots, timeZone, onBook, owner }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<BookingState>({ step: "selecting" });
  const [guestName, setGuestName] = useState("");
  const [localName, setLocalName] = useState(owner?.name ?? "");
  const [localCalUrl, setLocalCalUrl] = useState(owner?.calUrl ?? "");

  const availableDates = slots ? new Set(Object.keys(slots)) : new Set<string>();
  const slotsForDay = selectedDate && slots ? (slots[selectedDate] ?? []) : [];

  const allSlots = slots ? Object.values(slots).flat() : [];
  const durationMin = allSlots.length > 0
    ? Math.round((new Date(allSlots[0].end).getTime() - new Date(allSlots[0].start).getTime()) / 60000)
    : null;

  const handleSlotClick = (slot: Slot) => {
    setBookingState({ step: "confirming", slot });
    setGuestName("");
  };

  const handleConfirm = async () => {
    if (bookingState.step !== "confirming" || !guestName.trim()) return;
    const { slot } = bookingState;
    setBookingState({ step: "loading", slot });
    try {
      await onBook(slot.start, guestName.trim());
      setBookingState({ step: "success", slot });
    } catch (err) {
      setBookingState({ step: "error", message: err instanceof Error ? err.message : "Booking failed" });
    }
  };

  const handleCancel = () => setBookingState({ step: "selecting" });

  const prettySlug = eventSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (bookingState.step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md p-8 text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Booked!</h2>
          <p className="mb-1 text-gray-600">You're meeting with {hostName}</p>
          <p className="mb-6 text-sm text-gray-500">
            {formatDateHeading(bookingState.slot.start.slice(0, 10))} at {formatTime(bookingState.slot.start)}
          </p>
          <button
            onClick={() => setBookingState({ step: "selecting" })}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
            Book another time
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen overflow-hidden bg-white md:grid md:h-screen md:grid-cols-[320px_1fr]">
        {/* Left column: event meta + calendar */}
        <div className="flex flex-col border-b border-gray-200 p-6 md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="mb-6">
            {owner ? (
              <>
                <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={() => owner.onSaveName(localName)}
                  placeholder="Your name"
                  className="mb-3 w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <label className="mb-1 block text-xs font-medium text-gray-500">Cal.com URL</label>
                <input
                  type="text"
                  value={localCalUrl}
                  onChange={(e) => setLocalCalUrl(e.target.value)}
                  onBlur={() => owner.onSaveCalUrl(localCalUrl)}
                  placeholder="cal.com/username/event-slug"
                  className="mb-4 w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </>
            ) : (
              <>
                <p className="mb-1 text-sm text-gray-500">{hostName}</p>
                <h1 className="mb-4 text-xl font-semibold text-gray-900">{prettySlug}</h1>
              </>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              {durationMin && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  {durationMin} min
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
                </svg>
                {timeZone.replace(/_/g, " ")}
              </div>
            </div>
          </div>
          <div className="mt-auto">
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
              <p className="text-sm text-gray-400">No availability to show</p>
            </div>
          )}
        </div>

        {/* Mobile: title + time slot buttons */}
        <div className="p-6 md:hidden">
          <h2 className="mb-4 text-center text-sm font-semibold text-gray-900">When2Eat</h2>
        </div>
        <div className="px-6 pb-6 md:hidden">
          {selectedDate && slotsForDay.length > 0 ? (
            <>
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                {formatDateHeading(selectedDate)}
              </h2>
              <div className="space-y-2">
                {slotsForDay.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => handleSlotClick(slot)}
                    className="flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900">
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center">
              <p className="text-sm text-gray-500">
                {selectedDate ? "No available times" : "Select a date to view available times"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking confirmation modal */}
      {(bookingState.step === "confirming" || bookingState.step === "loading") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Confirm booking</h3>
            <p className="mb-4 text-sm text-gray-500">
              {formatDateHeading(bookingState.slot.start.slice(0, 10))} at{" "}
              {formatTime(bookingState.slot.start)} – {formatTime(bookingState.slot.end)}
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              className="mb-4 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!guestName.trim() || bookingState.step === "loading"}
                className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {bookingState.step === "loading" ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {bookingState.step === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold text-red-600">Booking failed</h3>
            <p className="mb-4 text-sm text-gray-600">{bookingState.message}</p>
            <button
              onClick={handleCancel}
              className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Try again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
