import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx + tailwind-merge.
 * Handles conditional classes and deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Pakistani Rupees.
 * Example: 15000000 → "Rs 1,50,00,000"
 */
export function formatBudget(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get priority label from lead score (1-3).
 */
export function getPriorityLabel(score: number): string {
  switch (score) {
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
      return "Low";
    default:
      return "Unknown";
  }
}

/**
 * Generate WhatsApp chat URL from a phone number.
 * Strips non-numeric characters, converts leading 0 to 92 (Pakistan).
 * Example: "+92 300 1234567" → "https://wa.me/923001234567"
 */
export function getWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const international = cleaned.startsWith("0")
    ? "92" + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${international}`;
}

/**
 * Relative time string from a date.
 * Example: "2 hours ago", "3 days ago"
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
