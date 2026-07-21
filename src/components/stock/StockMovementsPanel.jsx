import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { todayDateOnly } from "../../utils/dateRange";
import { STOCK_MOVEMENT_TYPES } from "../../utils/stockUtils";

const MANUAL_TYPES = STOCK_MOVEMENT_TYPES.filter((t) => t !== "Reçete");

function StockMovementsPanel({
  stock,
  movements = [],
  onApplyMovement,
  canWrite = true,
}) {
  const [form, setForm] = useState({
    type: "Giriş",
    quantity: "",
    date: todayDateOnly(),
    note: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const quantity = Number(form.quantity);
    if (!quantity || quantity <= 0) return;

    await onApplyMovement?.({
      stockId: stock.id,
      type: form.type,
      quantity,
      date: form.date,
      note: form.note,
    });

    setForm({
      type: "Giriş",
      quantity: "",
      date: todayDateOnly(),
      note: "",
    });
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Stok Hareketleri
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Mevcut:{" "}
        <strong>
          {stock.quantity} {stock.unit}
        </strong>
        {stock.lotNo ? ` · Lot: ${stock.lotNo}` : ""}
        {stock.expiryDate ? ` · SKT: ${stock.expiryDate}` : ""}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {canWrite && (
        <Box component="form" onSubmit={handleSubmit} mb={3}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="İşlem"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                {MANUAL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={form.type === "Düzeltme" ? "Yeni miktar" : "Miktar"}
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Tarih"
                name="date"
                value={form.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Açıklama"
                name="note"
                value={form.note}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={12}>
              <Button type="submit" variant="contained" fullWidth>
                Hareket Kaydet
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <Typography fontWeight={700} mb={1}>
        Hareket Geçmişi
      </Typography>

      {movements.length === 0 ? (
        <Typography color="text.secondary">Henüz hareket yok.</Typography>
      ) : (
        <Stack spacing={1.25}>
          {movements.map((movement) => (
            <Box
              key={movement.id}
              sx={{
                p: 1.5,
                border: "1px solid #eee",
                borderRadius: 2,
                borderLeft: "4px solid",
                borderLeftColor:
                  movement.type === "Giriş"
                    ? "success.main"
                    : movement.type === "Çıkış" || movement.type === "Reçete"
                      ? "error.main"
                      : "info.main",
              }}
            >
              <Typography fontWeight={700} variant="body2">
                {movement.date || "-"} · {movement.type}
              </Typography>
              <Typography variant="body2">
                Miktar: {movement.quantity} {stock.unit || ""}
                {` · ${movement.previousQuantity} → ${movement.newQuantity}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Kullanıcı: {movement.userName || "-"}
              </Typography>
              {movement.note ? (
                <Typography variant="caption" color="text.secondary">
                  {movement.note}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default StockMovementsPanel;
