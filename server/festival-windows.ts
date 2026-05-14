// Server-side festival window detection. Used by /api/pandits to give Gold
// pandits a temporary ranking bump during major Hindu festivals (when puja
// demand spikes). Mirrors the festival mdRange list in
// client/src/lib/festivals.ts but kept here so the server has zero client
// imports.
//
// Each window is an inclusive [startMd, endMd] range in "MM-DD" format,
// month-day only — the same window applies every year. Windows that wrap
// year-end (e.g. late December into early January) set start > end.

export type FestivalWindow = {
  id: string;
  name: string;
  mdRange: [string, string];
};

export const FESTIVAL_WINDOWS: FestivalWindow[] = [
  { id: "akshaya-tritiya",   name: "Akshaya Tritiya",   mdRange: ["04-16", "04-25"] },
  { id: "ganga-dussehra",    name: "Ganga Dussehra",    mdRange: ["05-20", "05-30"] },
  { id: "rath-yatra",        name: "Rath Yatra",        mdRange: ["06-22", "07-02"] },
  { id: "guru-purnima",      name: "Guru Purnima",      mdRange: ["07-05", "07-15"] },
  { id: "shravan",           name: "Shravan / Kanwar",  mdRange: ["07-20", "08-25"] },
  { id: "raksha-bandhan",    name: "Raksha Bandhan",    mdRange: ["08-08", "08-18"] },
  { id: "janmashtami",       name: "Janmashtami",       mdRange: ["08-20", "08-30"] },
  { id: "ganesh-chaturthi",  name: "Ganesh Chaturthi",  mdRange: ["08-28", "09-12"] },
  { id: "pitru-paksha",      name: "Pitru Paksha",      mdRange: ["09-15", "10-05"] },
  { id: "navratri-sharad",   name: "Sharad Navratri",   mdRange: ["09-25", "10-15"] },
  { id: "dussehra",          name: "Dussehra",          mdRange: ["10-08", "10-18"] },
  { id: "karwa-chauth",      name: "Karwa Chauth",      mdRange: ["10-15", "10-25"] },
  { id: "dhanteras",         name: "Dhanteras",         mdRange: ["10-25", "11-02"] },
  { id: "diwali",            name: "Diwali",            mdRange: ["10-28", "11-08"] },
  { id: "govardhan-puja",    name: "Govardhan Puja",    mdRange: ["10-30", "11-08"] },
  { id: "bhai-dooj",         name: "Bhai Dooj",         mdRange: ["10-30", "11-10"] },
  { id: "chhath",            name: "Chhath Puja",       mdRange: ["11-02", "11-12"] },
  { id: "tulsi-vivah",       name: "Tulsi Vivah",       mdRange: ["11-10", "11-20"] },
  { id: "vasant-panchami",   name: "Vasant Panchami",   mdRange: ["01-25", "02-05"] },
  { id: "maha-shivratri",    name: "Maha Shivratri",    mdRange: ["02-20", "03-10"] },
  { id: "holi",              name: "Holi",              mdRange: ["03-08", "03-22"] },
  { id: "ram-navami",        name: "Ram Navami",        mdRange: ["03-25", "04-10"] },
  { id: "navratri-chaitra",  name: "Chaitra Navratri",  mdRange: ["03-25", "04-10"] },
];

function mdKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

/** Returns the festival window currently active, or null if none. */
export function getActiveFestivalWindow(now: Date = new Date()): FestivalWindow | null {
  const today = mdKey(now);
  for (const w of FESTIVAL_WINDOWS) {
    const [start, end] = w.mdRange;
    const inWindow = start <= end ? today >= start && today <= end : today >= start || today <= end;
    if (inWindow) return w;
  }
  return null;
}

export function isFestivalWindow(now: Date = new Date()): boolean {
  return getActiveFestivalWindow(now) !== null;
}
