import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

function ExaminationForm({
  examination,
  animals = [],
  isEditing,
  onSave,
}) {
  const emptyForm = {
    animalId: "",
    animalName: "",
    ownerId: "",
    ownerName: "",

    veterinarian: "",

    examinationDate: new Date()
      .toISOString()
      .substring(0, 10),

    complaint: "",

    generalCondition: "",

    diagnosis: "",

    findings: "",

    treatment: "",

    temperature: "",
    pulse: "",
    respiration: "",
    height: "",
    weight: "",

    procedures: "",

    medicines: "",

    labResult: "",

    controlDate: "",

    notes: "",
  };

  const [form, setForm] =useState(emptyForm);

  useEffect(() => {
    if (examination) {
      setForm(examination);
    } else {
      setForm(emptyForm);
    }
  }, [examination]);

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

    if (!form.complaint.trim()) {
      alert("Şikayet alanı zorunludur.");
      return;
    }

    onSave(form);
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>

        <Grid size={12}>
          <TextField
            select
            fullWidth
            label="Hayvan"
            name="animalId"
            value={form.animalId}
            onChange={handleChange}
            required
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
            label="Veteriner"
            name="veterinarian"
            value={form.veterinarian}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Muayene Tarihi"
            name="examinationDate"
            value={form.examinationDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            required
            label="Şikayet"
            name="complaint"
            value={form.complaint}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Genel Durum"
            name="generalCondition"
            value={form.generalCondition}
            onChange={handleChange}
          >
            <MenuItem value="İyi">İyi</MenuItem>
            <MenuItem value="Orta">Orta</MenuItem>
            <MenuItem value="Kötü">Kötü</MenuItem>
            <MenuItem value="Kritik">Kritik</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Tanı"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Muayene Bulguları"
            name="findings"
            value={form.findings}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Uygulanan Tedavi"
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={2.4}>
          <TextField
            fullWidth
            label="Ateş (°C)"
            name="temperature"
            value={form.temperature}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={2.4}>
          <TextField
            fullWidth
            label="Nabız"
            name="pulse"
            value={form.pulse}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={2.4}>
          <TextField
            fullWidth
            label="Solunum"
            name="respiration"
            value={form.respiration}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={2.4}>
          <TextField
            fullWidth
            label="Boy (cm)"
            name="height"
            value={form.height}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={2.4}>
          <TextField
            fullWidth
            label="Kilo (kg)"
            name="weight"
            value={form.weight}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Yapılan İşlemler"
            name="procedures"
            value={form.procedures}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Kullanılan İlaçlar"
            name="medicines"
            value={form.medicines}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Laboratuvar Sonucu"
            name="labResult"
            value={form.labResult}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Kontrol Tarihi"
            name="controlDate"
            value={form.controlDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notlar"
            name="notes"
            value={form.notes}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
          >
            {isEditing
              ? "Muayeneyi Güncelle"
              : "Muayene Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default ExaminationForm;