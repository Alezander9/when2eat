import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import { fetchSlots, createBooking, type SlotsByDate } from "./calcom";
import BookingView from "./BookingView";

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function dateRange(weeks: number) {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + weeks * 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function parseCalUrl(input: string): { username: string; slug: string } | null {
  if (!input.trim()) return null;
  const cleaned = input
    .replace(/^https?:\/\//, "")
    .replace(/^cal\.com\//, "")
    .replace(/\?.*$/, "")
    .replace(/^\//, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { username: parts[0], slug: parts[1] };
}

function buildNotes(location: string): string {
  const parts = [];
  if (location) parts.push(`Location: ${location}`);
  parts.push("Booked via when2eat.stanfood.live");
  return parts.join("\n\n");
}

export default function UserPage() {
  const { sunetId } = useParams<{ sunetId: string }>();
  const profile = useQuery(api.profiles.getBySunetId, sunetId ? { sunetId } : "skip");
  const myProfile = useQuery(api.profiles.getMy);
  const update = useMutation(api.profiles.update);
  const [slots, setSlots] = useState<SlotsByDate | null>(null);

  const hasCalConfig = !!(profile?.calUsername && profile?.eventSlugs?.length);

  useEffect(() => {
    if (!hasCalConfig) return;
    const { start, end } = dateRange(4);
    fetchSlots(profile!.calUsername!, profile!.eventSlugs![0], start, end, timeZone)
      .then(setSlots)
      .catch((err) => console.error("[when2eat] slot fetch failed:", err));
  }, [hasCalConfig, profile?.calUsername, profile?.eventSlugs]);

  if (profile === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-cream"><p className="text-tan">Loading...</p></div>;
  }
  if (profile === null) {
    return <div className="flex min-h-screen items-center justify-center bg-cream"><p className="text-tan">Page not found</p></div>;
  }

  const isOwner = myProfile?._id === profile._id;
  const eventSlug = profile.eventSlugs?.[0] ?? "";
  const profileLocations = profile.locations ?? [];

  const handleBook = (slotStart: string, guestName: string, location: string) =>
    createBooking(
      profile.calUsername!, eventSlug, slotStart,
      guestName, profile.email, timeZone,
      buildNotes(location),
    );

  const calUrl = profile.calUsername && profile.eventSlugs?.length
    ? `cal.com/${profile.calUsername}/${profile.eventSlugs[0]}`
    : "";

  if (isOwner) {
    return (
      <BookingView
        hostName={profile.name ?? profile.sunetId}
        eventSlug={eventSlug}
        slots={slots}
        timeZone={timeZone}
        locations={profileLocations}
        onBook={handleBook}
        owner={{
          name: profile.name ?? "",
          calUrl,
          onSaveName: (name: string) => void update({ name: name || undefined }),
          onSaveCalUrl: (url: string) => {
            const parsed = parseCalUrl(url);
            void update({
              calUsername: parsed?.username,
              eventSlugs: parsed?.slug ? [parsed.slug] : undefined,
            });
          },
          onSaveLocations: (locs: string[]) => void update({ locations: locs }),
        }}
      />
    );
  }

  if (hasCalConfig && slots) {
    return (
      <BookingView
        hostName={profile.name ?? profile.sunetId}
        eventSlug={eventSlug}
        slots={slots}
        timeZone={timeZone}
        locations={profileLocations}
        onBook={handleBook}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-tan">
        {hasCalConfig ? "Loading availability..." : "This host hasn't set up their calendar yet"}
      </p>
    </div>
  );
}
