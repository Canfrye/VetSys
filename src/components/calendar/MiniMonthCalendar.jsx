import { useMemo, useState } from "react";

import {
  buildMonthCells,
  formatMonthTitle,
  toISODate,
} from "../../utils/calendarUtils";

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

/**
 * Sol panel mini aylık takvim — güne tıklanınca günlük görünüme atlar.
 */
function MiniMonthCalendar({ selectedDate, onSelectDate }) {
  const [cursor, setCursor] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const cells = useMemo(
    () => buildMonthCells(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const selectedIso = toISODate(selectedDate);
  const todayIso = toISODate(new Date());

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button
          type="button"
          aria-label="Önceki ay"
          onClick={() => setCursor((prev) => addMonths(prev, -1))}
        >
          ‹
        </button>
        <strong>{formatMonthTitle(cursor)}</strong>
        <button
          type="button"
          aria-label="Sonraki ay"
          onClick={() => setCursor((prev) => addMonths(prev, 1))}
        >
          ›
        </button>
      </div>

      <div className="mini-calendar-weekdays">
        {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mini-calendar-grid">
        {cells.map((cell) => {
          const classes = [
            "mini-calendar-day",
            cell.inMonth ? "" : "is-outside",
            cell.iso === selectedIso ? "is-selected" : "",
            cell.iso === todayIso ? "is-today" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.iso + String(cell.inMonth)}
              type="button"
              className={classes}
              onClick={() => onSelectDate?.(new Date(cell.date))}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MiniMonthCalendar;
