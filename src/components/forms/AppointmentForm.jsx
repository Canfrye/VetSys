import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

function AppointmentForm({
  appointment,
  animals = [],
  isEditing,
  onSave,
}) {
  const emptyForm = {
    animalId: "",
    animalName: "",

    ownerId: "",
    ownerName: "",

    date: new Date().toISOString().substring(0, 10),
    time: "",

    veterinarian: "",

    reason: "",

    status: "Bekliyor",

    note: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (appointment) {
      setForm(appointment);
    } else {
      setForm(emptyForm);
    }
  }, [appointment]);

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

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.animalId) {
      alert("Hayvan seçiniz.");
      return;
    }

    if (!form.date) {
      alert("Tarih seçiniz.");
      return;
    }

    if (!form.time) {
      alert("Saat seçiniz.");
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
            InputLabelProps={{ shrink: true }}
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
            InputLabelProps={{ shrink: true }}
          />
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
            <MenuItem value="Bekliyor">
              Bekliyor
            </MenuItem>

            <MenuItem value="Geldi">
              Geldi
            </MenuItem>

            <MenuItem value="Tamamlandı">
              Tamamlandı
            </MenuItem>

            <MenuItem value="İptal">
              İptal
            </MenuItem>
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