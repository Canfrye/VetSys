import { useMemo, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

import CalendarGrid from "./CalendarGrid";
import MiniMonthCalendar from "./MiniMonthCalendar";
import {
  calculateDayOccupancy,
  formatDayHeader,
  getStatusLegendItems,
  getVeterinarianOptions,
  toISODate,
} from "../../utils/calendarUtils";

import "../../styles/calendar.css";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const ALL_VETS = "__all__";

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRangeLabel(view, days) {
  if (view === "day") {
    const [day] = days;
    return `${formatDayHeader(day)} ${MONTH_LABELS[day.getMonth()]} ${day.getFullYear()}`;
  }

  const first = days[0];
  const last = days[days.length - 1];

  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()]} - ${last.getDate()} ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`;
}

const STATUS_COLOR_HEX = {
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#10B981",
  error: "#EF4444",
  default: "#6B7280",
};

function AppointmentCalendar({
  appointments = [],
  phoneByOwnerId = {},
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
  onAppointmentResize,
}) {
  const [view, setView] = useState("day");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [vetFilter, setVetFilter] = useState(ALL_VETS);

  const days = useMemo(() => {
    if (view === "day") return [referenceDate];

    const weekStart = getWeekStart(referenceDate);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [view, referenceDate]);

  const veterinarianOptions = useMemo(
    () => getVeterinarianOptions(appointments),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    if (vetFilter === ALL_VETS) return appointments;

    return appointments.filter(
      (a) => (a.veterinarian || "").trim() === vetFilter
    );
  }, [appointments, vetFilter]);

  const appointmentsByDay = useMemo(() => {
    const map = {};

    filteredAppointments.forEach((appointment) => {
      if (!map[appointment.date]) map[appointment.date] = [];
      map[appointment.date].push(appointment);
    });

    return map;
  }, [filteredAppointments]);

  const focusDateIso = toISODate(referenceDate);

  const occupancy = useMemo(
    () => calculateDayOccupancy(filteredAppointments, focusDateIso),
    [filteredAppointments, focusDateIso]
  );

  const legendItems = useMemo(() => getStatusLegendItems(), []);

  function goPrev() {
    setReferenceDate((prev) => addDays(prev, view === "day" ? -1 : -7));
  }

  function goNext() {
    setReferenceDate((prev) => addDays(prev, view === "day" ? 1 : 7));
  }

  function goToday() {
    setReferenceDate(new Date());
    setView("day");
  }

  function handleMiniSelect(date) {
    setReferenceDate(date);
    setView("day");
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-layout">
        <aside className="calendar-sidebar">
          <MiniMonthCalendar
            key={`${referenceDate.getFullYear()}-${referenceDate.getMonth()}`}
            selectedDate={referenceDate}
            onSelectDate={handleMiniSelect}
          />
        </aside>

        <div className="calendar-main">
          <div className="calendar-top-bar">
            <div className="calendar-view-tabs" role="tablist">
              <button
                type="button"
                className={view === "day" ? "is-active" : ""}
                onClick={() => setView("day")}
              >
                Günlük
              </button>
              <button
                type="button"
                className={view === "week" ? "is-active" : ""}
                onClick={() => setView("week")}
              >
                Haftalık
              </button>
            </div>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="vet-filter-label">Veteriner</InputLabel>
              <Select
                labelId="vet-filter-label"
                label="Veteriner"
                value={vetFilter}
                onChange={(e) => setVetFilter(e.target.value)}
              >
                <MenuItem value={ALL_VETS}>Tüm Veterinerler</MenuItem>
                {veterinarianOptions.map((vet) => (
                  <MenuItem key={vet} value={vet}>
                    {vet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="calendar-toolbar">
            <div className="calendar-nav">
              <button type="button" onClick={goPrev}>
                ‹
              </button>
              <button type="button" className="is-today-btn" onClick={goToday}>
                Bugün
              </button>
              <button type="button" onClick={goNext}>
                ›
              </button>
            </div>

            <div className="calendar-title">
              {formatRangeLabel(view, days)}
            </div>
          </div>

          <div className="calendar-occupancy">
            <span>
              <strong>
                {focusDateIso === toISODate(new Date()) ? "Bugün" : "Seçili gün"}
              </strong>{" "}
              · {focusDateIso}
            </span>
            <span>{occupancy.appointmentCount} Randevu</span>
            <span>{occupancy.emptySlots} Boş Slot</span>
            <span className="calendar-occupancy-pct">
              Doluluk %{occupancy.occupancyPercent}
            </span>
          </div>

          <div className="calendar-legend">
            {legendItems.map((item) => (
              <span key={item.status} className="calendar-legend-item">
                <span
                  className="calendar-legend-swatch"
                  style={{
                    background:
                      STATUS_COLOR_HEX[item.color] || STATUS_COLOR_HEX.default,
                  }}
                />
                {item.status}
              </span>
            ))}
          </div>

          <CalendarGrid
            days={days}
            appointmentsByDay={appointmentsByDay}
            phoneByOwnerId={phoneByOwnerId}
            onSlotClick={onSlotClick}
            onAppointmentClick={onAppointmentClick}
            onAppointmentMove={onAppointmentMove}
            onAppointmentResize={onAppointmentResize}
          />
        </div>
      </div>
    </div>
  );
}

export default AppointmentCalendar;
