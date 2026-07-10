import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

function StockForm({
  stock,
  isEditing,
  onSave,
}) {
  const emptyForm = {
    name: "",
    category: "İlaç",
    quantity: "",
    minQuantity: "",
    unit: "Adet",
    expiryDate: "",
    supplier: "",
    note: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (stock) {
      setForm(stock);
    } else {
      setForm(emptyForm);
    }
  }, [stock]);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Ürün adı zorunludur.");
      return;
    }

    if (form.quantity === "") {
      alert("Stok miktarı zorunludur.");
      return;
    }

    if (form.minQuantity === "") {
      alert("Minimum stok zorunludur.");
      return;
    }

    onSave({
      ...form,
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity),
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Ürün Adı"
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
            label="Kategori"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <MenuItem value="İlaç">İlaç</MenuItem>
            <MenuItem value="Aşı">Aşı</MenuItem>
            <MenuItem value="Sarf">Sarf Malzemesi</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Birim"
            name="unit"
            value={form.unit}
            onChange={handleChange}
          >
            <MenuItem value="Adet">Adet</MenuItem>
            <MenuItem value="Kutu">Kutu</MenuItem>
            <MenuItem value="Şişe">Şişe</MenuItem>
            <MenuItem value="Ampul">Ampul</MenuItem>
            <MenuItem value="ml">ml</MenuItem>
            <MenuItem value="gr">gr</MenuItem>
            <MenuItem value="kg">kg</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="number"
            label="Stok Miktarı"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="number"
            label="Minimum Stok"
            name="minQuantity"
            value={form.minQuantity}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Son Kullanma Tarihi"
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Tedarikçi"
            name="supplier"
            value={form.supplier}
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
            size="large"
            type="submit"
          >
            {isEditing
              ? "Stoğu Güncelle"
              : "Stoğu Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default StockForm;