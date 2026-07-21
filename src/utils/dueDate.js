/**
 * Takip / hatırlatma tarih yardımcıları.
 * Dashboard ve liste kartlarında ortak kullanılır.
 */

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) return null;

  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * @returns {{ label: string, color: "default" | "error" | "warning" | "success" | "info" }}
 */
export function getDueBadge(dateStr) {
  const days = getDaysUntil(dateStr);

  if (days === null) return { label: "Tarih yok", color: "default" };
  if (days < 0) {
    return { label: `${Math.abs(days)} gün geçti`, color: "error" };
  }
  if (days === 0) return { label: "Bugün", color: "error" };
  if (days === 1) return { label: "Yarın", color: "warning" };
  if (days <= 7) return { label: `${days} gün kaldı`, color: "warning" };
  return { label: `${days} gün kaldı`, color: "default" };
}
