import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import { formatCurrency } from "../../utils/invoiceCalc";
import {
  PAYMENT_METHOD_OPTIONS,
  computeInvoiceBalance,
  formatPaymentMethodLabel,
} from "../../utils/paymentUtils";
import { todayDateOnly } from "../../utils/dateRange";
import { useNotification } from "../../hooks/useNotification";

function createEmptyPaymentForm(remaining = 0) {
  return {
    amount: remaining > 0 ? String(remaining) : "",
    method: "Nakit",
    date: todayDateOnly(),
    note: "",
  };
}

function InvoicePaymentsPanel({
  invoice,
  payments = [],
  onAddPayment,
  onDeletePayment,
  onDownloadReceipt,
  canWrite = true,
  canDelete = false,
}) {
  const { notify } = useNotification();
  const balance = computeInvoiceBalance(invoice, payments);
  const canAdd =
    canWrite && balance.status !== "İptal" && balance.remaining > 0;

  // payments.length / remaining değişince üst bileşen key ile remount eder.
  const [form, setForm] = useState(() =>
    createEmptyPaymentForm(balance.remaining)
  );
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!canAdd || saving) return;

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      notify("Tutar zorunludur ve 0'dan büyük olmalıdır.", "error");
      return;
    }

    if (amount - balance.remaining > 0.001) {
      notify(
        `Kalan borç ${formatCurrency(balance.remaining)}. Daha fazla ödeme alınamaz.`,
        "error"
      );
      return;
    }

    if (!form.date) {
      notify("Ödeme tarihi zorunludur.", "error");
      return;
    }

    setSaving(true);

    try {
      await onAddPayment?.({
        invoiceId: invoice.id,
        amount,
        method: form.method,
        date: form.date,
        note: form.note,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Tahsilat Özeti
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
        <Typography variant="body2">
          Toplam: <strong>{formatCurrency(balance.total)}</strong>
        </Typography>
        <Typography variant="body2">
          Ödenen: <strong>{formatCurrency(balance.paid)}</strong>
        </Typography>
        <Typography variant="body2" color="error.main">
          Kalan: <strong>{formatCurrency(balance.remaining)}</strong>
        </Typography>
        <Typography variant="body2">
          Durum: <strong>{balance.status}</strong>
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography fontWeight={700} mb={1}>
        Ödeme Geçmişi
      </Typography>

      {payments.length === 0 ? (
        <Typography color="text.secondary" mb={2}>
          Henüz ödeme yok.
        </Typography>
      ) : (
        <Stack spacing={1.25} mb={2}>
          {payments.map((payment) => (
            <Box
              key={payment.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={700} noWrap>
                  {formatCurrency(payment.amount)}
                  {payment.receiptNumber ? ` · ${payment.receiptNumber}` : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {payment.date || "-"} ·{" "}
                  {formatPaymentMethodLabel(payment.method)}
                </Typography>
                {payment.note ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {payment.note}
                  </Typography>
                ) : null}
              </Box>

              <Stack direction="row" spacing={0.25}>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Makbuz PDF"
                  onClick={() => onDownloadReceipt?.(payment)}
                >
                  <PictureAsPdfIcon fontSize="small" />
                </IconButton>
                {canDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Ödemeyi sil"
                    onClick={() => onDeletePayment?.(payment.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      {balance.status === "İptal" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          İptal faturalara ödeme eklenemez.
        </Alert>
      )}

      {balance.status === "Ödendi" && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Bu fatura tamamen ödendi.
        </Alert>
      )}

      {!canWrite && balance.status !== "İptal" && balance.status !== "Ödendi" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Ödeme ekleme yetkiniz yok. Yalnızca görüntüleme.
        </Alert>
      )}

      {canAdd && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "success.light",
            bgcolor: "success.50",
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} mb={0.5}>
            Yeni Tahsilat
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Kalan borç: {formatCurrency(balance.remaining)}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="Tutar"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                inputProps={{ min: 0.01, step: 0.01 }}
                helperText="Zorunlu alan"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                select
                fullWidth
                required
                label="Ödeme yöntemi"
                name="method"
                value={form.method}
                onChange={handleChange}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                required
                type="date"
                label="Ödeme tarihi"
                name="date"
                value={form.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Açıklama"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Opsiyonel not"
              />
            </Grid>

            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                size="large"
                disabled={saving}
                startIcon={<AddIcon />}
              >
                {saving ? "Kaydediliyor..." : "Tahsilat Ekle"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default InvoicePaymentsPanel;
