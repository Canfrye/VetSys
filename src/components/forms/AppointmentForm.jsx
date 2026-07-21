import { useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

import { useNotification } from "../../hooks/useNotification";
import { isAppointmentConflict } from "../../services/appointmentService";
import { APPOINTMENT_STATUSES } from "../../utils/appointmentStatus";
import { todayDateOnly } from "../../utils/dateRange";

const EMPTY_INITIAL_VALUES = {};

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

function AppointmentForm({
  appointment,
  animals = [],
  isEditing,
  onSave,
  initialValues = EMPTY_INITIAL_VALUES,
}) {
  const emptyForm = {
    animalId: "",
    animalName: "",

    ownerId: "",
    ownerName: "",

    date: todayDateOnly(),
    time: "",
    duration: 30,

    veterinarian: "",

    reason: "",

    status: "Bekliyor",

    note: "",
  };

  const { notify } = useNotification();

  // NOT: `appointment`/`initialValues` değiştiğinde formu resetlemek için
  // useEffect yerine "derived state" deseni kullanılıyor. Üst bileşen
  // (Appointments.jsx), düzenlenen randevu veya takvimden seçilen slot
  // değiştiğinde bu bileşeni `key` prop'u ile yeniden mount eder.
  const [form, setForm] = useState(() =>
    appointment ? appointment : { ...emptyForm, ...initialValues }
  );

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "animalId") {
      const animal = animals.find(
        (a) => String(a.id) === String(value)
      );

      setForm((prev) => ({
        ...prev,
        animalId: value,
        animalName: animal?.name || "",
        ownerId: animal?.ownerId || "",
        ownerName: animal?.ownerName || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.animalId) {
      notify("Hayvan seçiniz.", "error");
      return;
    }

    if (!form.date) {
      notify("Tarih seçiniz.", "error");
      return;
    }

    if (!form.time) {
      notify("Saat seçiniz.", "error");
      return;
    }

    if (!form.veterinarian?.trim()) {
      notify("Veteriner seçiniz / giriniz.", "error");
      return;
    }

    const conflict = await isAppointmentConflict(
      form,
      isEditing ? appointment?.id : null
    );

    if (conflict) {
      notify(
        `Bu saatte ${form.veterinarian} için başka bir randevu var: ${conflict.time} - ${conflict.animalName}`,
        "error"
      );
      return;
    }

    onSave(form);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>

        <Grid size={12}>
          <TextField
            select
            fullWidth
            label="Hayvan"
            name="animalId"
            value={form.animalId}
            onChange={handleChange}
          >
            {animals.map((animal) => (
              <MenuItem
                key={animal.id}
                value={animal.id}
              >
                {animal.name} - {animal.ownerName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Tarih"
            name="date"
            value={form.date}
            onChange={handleChange}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="time"
            label="Saat"
            name="time"
            value={form.time}
            onChange={handleChange}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Süre"
            name="duration"
            value={form.duration || 30}
            onChange={handleChange}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <MenuItem key={minutes} value={minutes}>
                {minutes} dakika
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Veteriner"
            name="veterinarian"
            value={form.veterinarian}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Durum"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {APPOINTMENT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Randevu Nedeni"
            name="reason"
            value={form.reason}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Not"
            name="note"
            value={form.note}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
          >
            {isEditing
              ? "Randevuyu Güncelle"
              : "Randevu Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default AppointmentForm;