import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@mui/material";

import { getAppointmentStatusColor } from "../../utils/appointmentStatus";
import {
  SLOT_HEIGHT,
  buildSlots,
  getBlockPosition,
  getNowLineOffset,
  getPxPerMinute,
  isSlotInPast,
  minutesToTime,
  snapDuration,
  toISODate,
  toMinutes,
  formatDayHeader,
  yToSnappedMinutes,
  START_HOUR,
  END_HOUR,
} from "../../utils/calendarUtils";

const DRAG_THRESHOLD_PX = 5;

function AppointmentTooltipContent({ appointment, ownerPhone }) {
  return (
    <div className="calendar-tooltip">
      <div>
        <strong>Hayvan:</strong> {appointment.animalName || "-"}
      </div>
      <div>
        <strong>Sahip:</strong> {appointment.ownerName || "-"}
      </div>
      <div>
        <strong>Telefon:</strong> {ownerPhone || "-"}
      </div>
      <div>
        <strong>Veteriner:</strong> {appointment.veterinarian || "-"}
      </div>
      <div>
        <strong>Not:</strong> {appointment.note || "-"}
      </div>
    </div>
  );
}

function CalendarGrid({
  days,
  appointmentsByDay,
  phoneByOwnerId = {},
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
  onAppointmentResize,
}) {
  const slots = buildSlots();
  const totalHeight = slots.length * SLOT_HEIGHT;
  const todayIso = toISODate(new Date());

  const [nowOffset, setNowOffset] = useState(() => getNowLineOffset());
  const [draft, setDraft] = useState(null);

  const interactionRef = useRef(null);
  const draftRef = useRef(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowOffset(getNowLineOffset());
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  function beginInteraction(e, appointment, dateIso, mode) {
    e.preventDefault();
    e.stopPropagation();

    const { top, height } = getBlockPosition(appointment);

    interactionRef.current = {
      mode,
      appointment,
      dateIso,
      startClientY: e.clientY,
      originTop: top,
      originHeight: height,
      originDuration: Number(appointment.duration) || 30,
      moved: false,
    };

    function handlePointerMove(ev) {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const deltaY = ev.clientY - interaction.startClientY;

      if (!interaction.moved && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      interaction.moved = true;

      if (interaction.mode === "move") {
        const nextTop = Math.max(
          0,
          Math.min(
            totalHeight - SLOT_HEIGHT,
            interaction.originTop + deltaY
          )
        );
        const snappedMinutes = yToSnappedMinutes(nextTop);
        const snappedTop =
          (snappedMinutes - START_HOUR * 60) * getPxPerMinute();

        setDraft({
          id: interaction.appointment.id,
          top: snappedTop,
          height: interaction.originHeight,
          time: minutesToTime(snappedMinutes),
          date: interaction.dateIso,
          duration: Number(interaction.appointment.duration) || 30,
        });
        return;
      }

      const pxPerMinute = getPxPerMinute();
      const rawDuration =
        interaction.originDuration + deltaY / pxPerMinute;
      const duration = snapDuration(rawDuration);
      const maxDuration =
        END_HOUR * 60 - toMinutes(interaction.appointment.time);
      const clamped = Math.min(duration, Math.max(30, maxDuration));
      const nextHeight = Math.max(20, clamped * pxPerMinute - 2);

      setDraft({
        id: interaction.appointment.id,
        top: interaction.originTop,
        height: nextHeight,
        time: interaction.appointment.time,
        date: interaction.dateIso,
        duration: clamped,
      });
    }

    async function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const interaction = interactionRef.current;
      interactionRef.current = null;

      const snapshot = draftRef.current;
      setDraft(null);

      if (!interaction) return;

      if (!interaction.moved) {
        onAppointmentClick?.(interaction.appointment);
        return;
      }

      const appt = interaction.appointment;

      if (interaction.mode === "move") {
        const time =
          snapshot?.time ||
          minutesToTime(yToSnappedMinutes(interaction.originTop));
        const date = snapshot?.date || interaction.dateIso;

        if (date === appt.date && time === appt.time) return;

        await onAppointmentMove?.(appt, { date, time });
        return;
      }

      const duration = snapshot?.duration || Number(appt.duration) || 30;

      if (duration === Number(appt.duration)) return;

      await onAppointmentResize?.(appt, duration);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-time-gutter">
        <div className="calendar-day-header">&nbsp;</div>

        {slots.map((slot) => (
          <div
            key={slot.minutes}
            className="calendar-time-slot-label"
            style={{ height: SLOT_HEIGHT }}
          >
            {slot.label}
          </div>
        ))}
      </div>

      {days.map((day) => {
        const iso = toISODate(day);
        const dayAppointments = appointmentsByDay[iso] || [];
        const isToday = iso === todayIso;

        return (
          <div key={iso} className="calendar-day-column">
            <div
              className={`calendar-day-header ${
                isToday ? "is-today" : ""
              }`}
            >
              {formatDayHeader(day)}
            </div>

            <div className="calendar-body" style={{ height: totalHeight }}>
              {slots.map((slot) => {
                const past = isSlotInPast(slot.minutes, iso);

                return (
                  <div
                    key={slot.minutes}
                    className={`calendar-slot-row${past ? " is-past" : ""}`}
                    style={{ height: SLOT_HEIGHT }}
                    onClick={() =>
                      onSlotClick?.(iso, minutesToTime(slot.minutes))
                    }
                  />
                );
              })}

              {isToday && nowOffset != null && (
                <div
                  className="calendar-now-line"
                  style={{ top: nowOffset }}
                  aria-hidden
                />
              )}

              {dayAppointments.map((appointment) => {
                const base = getBlockPosition(appointment);
                const isDrafting = draft?.id === appointment.id;
                const top = isDrafting ? draft.top : base.top;
                const height = isDrafting ? draft.height : base.height;
                const colorClass = `status-${getAppointmentStatusColor(
                  appointment.status
                )}`;
                const ownerPhone =
                  phoneByOwnerId[String(appointment.ownerId)] || "";

                return (
                  <Tooltip
                    key={appointment.id}
                    title={
                      <AppointmentTooltipContent
                        appointment={appointment}
                        ownerPhone={ownerPhone}
                      />
                    }
                    placement="right"
                    enterDelay={400}
                    disableHoverListener={Boolean(draft)}
                  >
                    <div
                      className={`calendar-appointment-block ${colorClass}${
                        isDrafting ? " is-dragging" : ""
                      }`}
                      style={{ top, height }}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        beginInteraction(e, appointment, iso, "move");
                      }}
                    >
                      <strong>
                        {(isDrafting ? draft.time : appointment.time) ||
                          appointment.time}{" "}
                        · {appointment.animalName}
                      </strong>
                      <span>
                        {appointment.reason ||
                          appointment.veterinarian ||
                          ""}
                      </span>
                      {isDrafting && (
                        <span className="calendar-draft-meta">
                          {draft.duration} dk
                        </span>
                      )}

                      <div
                        className="calendar-appointment-resize"
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          beginInteraction(e, appointment, iso, "resize");
                        }}
                      />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CalendarGrid;
