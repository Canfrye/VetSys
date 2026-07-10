import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

function VaccineForm({
  vaccine,
  animals = [],
  isEditing,
  onSave,
}) {
  const emptyForm = {
    animalId: "",
    animalName: "",
    ownerId: "",
    ownerName: "",

    vaccineName: "",
    brand: "",
    batchNo: "",
    dose: "",

    applicationDate: new Date()
      .toISOString()
      .substring(0, 10),

    nextDoseDate: "",

    veterinarian: "",

    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (vaccine) {
      setForm(vaccine);
    } else {
      setForm(emptyForm);
    }
  }, [vaccine]);

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

    if (!form.vaccineName) {
      alert("Aşı seçiniz.");
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
          >
            {animals.map((animal) => (
              <MenuItem key={animal.id} value={animal.id}>
                {animal.name} - {animal.ownerName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Aşı Türü"
            name="vaccineName"
            value={form.vaccineName}
            onChange={handleChange}
          >
            <MenuItem value="Kuduz">Kuduz</MenuItem>
            <MenuItem value="Karma">Karma</MenuItem>
            <MenuItem value="Lösemi">Lösemi</MenuItem>
            <MenuItem value="Bronchine">Bronchine</MenuItem>
            <MenuItem value="Corona">Corona</MenuItem>
            <MenuItem value="İç Parazit">İç Parazit</MenuItem>
            <MenuItem value="Dış Parazit">Dış Parazit</MenuItem>
            <MenuItem value="Lyme">Lyme</MenuItem>
            <MenuItem value="Bordetella">Bordetella</MenuItem>
            <MenuItem value="Diğer">Diğer</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Marka"
            name="brand"
            value={form.brand}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Seri No"
            name="batchNo"
            value={form.batchNo}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Doz"
            name="dose"
            value={form.dose}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Uygulama Tarihi"
            name="applicationDate"
            value={form.applicationDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Sonraki Doz"
            name="nextDoseDate"
            value={form.nextDoseDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Veteriner"
            name="veterinarian"
            value={form.veterinarian}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
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
            type="submit"
            size="large"
          >
            {isEditing
              ? "Aşıyı Güncelle"
              : "Aşı Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default VaccineForm;