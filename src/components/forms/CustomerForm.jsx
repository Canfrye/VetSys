import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  TextField,
} from "@mui/material";

function CustomerForm({
  customer,
  isEditing,
  onSave,
}) {
  const emptyForm = {
    ad: "",
    soyad: "",
    telefon: "",
    email: "",
    tcKimlik: "",
    adres: "",
    not: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (customer) {
      setForm(customer);
    } else {
      setForm(emptyForm);
    }
  }, [customer]);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.ad.trim()) {
      alert("Ad zorunludur.");
      return;
    }

    if (!form.soyad.trim()) {
      alert("Soyad zorunludur.");
      return;
    }

    if (!form.telefon.trim()) {
      alert("Telefon zorunludur.");
      return;
    }

    onSave(form);
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 1 }}
    >
      <Grid container spacing={2}>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Ad"
            name="ad"
            value={form.ad}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Soyad"
            name="soyad"
            value={form.soyad}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Telefon"
            name="telefon"
            value={form.telefon}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="E-Posta"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="TC Kimlik No"
            name="tcKimlik"
            value={form.tcKimlik}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Adres"
            name="adres"
            value={form.adres}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Not"
            name="not"
            value={form.not}
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
            {isEditing ? "Güncelle" : "Müşteri Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default CustomerForm;