const CAL_API = "https://api.cal.com/v2";
const SLOTS_API_VERSION = "2024-09-04";
const BOOKINGS_API_VERSION = "2024-08-13";

export type Slot = { start: string; end: string };
export type SlotsByDate = Record<string, Slot[]>;

export async function fetchSlots(
  username: string,
  eventSlug: string,
  start: string,
  end: string,
  timeZone: string,
): Promise<SlotsByDate> {
  const params = new URLSearchParams({
    username,
    eventTypeSlug: eventSlug,
    start,
    end,
    timeZone,
    format: "range",
  });
  const res = await fetch(`${CAL_API}/slots?${params}`, {
    headers: { "cal-api-version": SLOTS_API_VERSION },
  });
  if (!res.ok) throw new Error(`Cal.com slots error: ${res.status}`);
  const json = await res.json();
  return json.data as SlotsByDate;
}

export type BookingResult = {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
};

export async function createBooking(
  username: string,
  eventSlug: string,
  start: string,
  attendeeName: string,
  attendeeEmail: string,
  timeZone: string,
): Promise<BookingResult> {
  const res = await fetch(`${CAL_API}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cal-api-version": BOOKINGS_API_VERSION,
    },
    body: JSON.stringify({
      username,
      eventTypeSlug: eventSlug,
      start,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cal.com booking error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.data as BookingResult;
}
