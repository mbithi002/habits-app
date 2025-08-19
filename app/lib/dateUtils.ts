/**
 * Formats a timestamp into a human-friendly string.
 * 
 * Examples:
 * - just now
 * - 3 minutes ago
 * - 6 hours ago
 * - yesterday
 * - 5 days ago
 * - 24th June 2025
 */

export const formatDate = (timestamp: string | number | Date): string => {
  const now = new Date();
  const date = new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // relative time
  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  // yesterday
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  // absolute fallback
  return formatAbsoluteDate(date);
};

/**
 * Formats an absolute date into `24th June 2025` format
 */
export const formatAbsoluteDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${getOrdinalSuffix(day)} ${month} ${year}`;
};

/**
 * Adds ordinal suffix to day (st, nd, rd, th)
 */
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return `${day}th`; // covers 11th–19th
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};
