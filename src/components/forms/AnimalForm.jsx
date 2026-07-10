import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const speciesList = [
  "Kedi",
  "Köpek",
  "Kuş",
  "Tavşan",
  "Kemirgen",
  "At",
  "Büyükbaş",
  "Küçükbaş",
  "Sürüngen",
  "Diğer",
];

const emptyForm = {
  ownerId: "",
  name: "",
  species: "",
  breed: "",
  gender: "",
  birthDate: "",
  color: "",
  microchipNo: "",
  passportNo: "",
  weight: "",
  neutered: false,
  active: true,
  note: "",
};

function AnimalForm({
  animal,
  customers = [],
  isEditing,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (animal) {
      setForm({
        ...emptyForm,
        ...animal,
      });
    } else {
      setForm(emptyForm);
    }
  }, [animal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.ownerId) {
      alert("Lütfen hayvan sahibini seçiniz.");
      return;
    }

    if (!form.name.trim()) {
      alert("Hayvan adı zorunludur.");
      return;
    }

    if (!form.species) {
      alert("Tür seçiniz.");
      return;
    }

    onSave(form);

    if (!isEditing) {
      setForm(emptyForm);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>

        <Grid size={12}>
          <TextField
            select
            fullWidth
            label="Hayvan Sahibi"
            name="ownerId"
            value={form.ownerId}
            onChange={handleChange}
            required
          >
            {customers.map((customer) => (
              <MenuItem
                key={customer.id}
                value={customer.id}
              >
                {customer.ad} {customer.soyad}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Hayvan Adı"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Tür"
            name="species"
            value={form.species}
            onChange={handleChange}
            required
          >
            {speciesList.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Irk"
            name="breed"
            value={form.breed}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Cinsiyet"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <MenuItem value="Erkek">Erkek</MenuItem>
            <MenuItem value="Dişi">Dişi</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Doğum Tarihi"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Renk"
            name="color"
            value={form.color}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Mikroçip No"
            name="microchipNo"
            value={form.microchipNo}
            onChange={handleChange}
            inputProps={{
              maxLength: 30,
            }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Pasaport No"
            name="passportNo"
            value={form.passportNo}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="number"
            label="Kilo (kg)"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            inputProps={{
              min: 0,
              max: 150,
              step: 0.1,
            }}
          />
        </Grid>

        <Grid size={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.neutered}
                onChange={handleChange}
                name="neutered"
              />
            }
            label="Kısırlaştırıldı"
          />
        </Grid>

        <Grid size={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.active}
                onChange={handleChange}
                name="active"
              />
            }
            label="Aktif"
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
            size="large"
            type="submit"
          >
            {isEditing
              ? "Hayvanı Güncelle"
              : "Hayvanı Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default AnimalForm;