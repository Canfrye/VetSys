import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useNotification } from "../../hooks/useNotification";
import { calculateInvoiceTotals, formatCurrency, DISCOUNT_TYPES, VAT_RATE_OPTIONS } from "../../utils/invoiceCalc";
import { INVOICE_ITEM_TYPES } from "../../utils/invoiceStatus";
import { isInvoiceCancelled } from "../../utils/paymentUtils";
import { todayDateOnly } from "../../utils/dateRange";
import { getStock } from "../../services/stockService";
import { normalizeMoney } from "../../utils/serviceCatalog";

const emptyItem = () => ({
  type: "Muayene",
  description: "",
  unitPrice: "",
  quantity: 1,
  purchasePrice: 0,
  stockId: "",
  priceSource: "",
});

const createEmptyForm = () => ({
  animalId: "",
  animalName: "",
  ownerId: "",
  ownerName: "",
  date: todayDateOnly(),
  items: [emptyItem()],
  discountType: "none",
  discountValue: "",
  vatEnabled: false,
  vatRate: 20,
  cancelled: false,
  paymentStatus: "",
  note: "",
  isDraftPreview: false,
});

function priceFieldSx(priceSource) {
  if (priceSource === "auto") {
    return {
      bgcolor: "rgba(16, 185, 129, 0.12)",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "success.light",
      },
    };
  }

  if (priceSource === "manual") {
    return {
      bgcolor: "rgba(245, 158, 11, 0.1)",
    };
  }

  return undefined;
}

function InvoiceForm({
  invoice,
  animals = [],
  isEditing,
  onSave,
}) {
  const { notify } = useNotification();
  const [stockItems, setStockItems] = useState([]);

  const [form, setForm] = useState(() => {
    if (!invoice) return createEmptyForm();

    return {
      ...createEmptyForm(),
      ...invoice,
      cancelled: isInvoiceCancelled(invoice),
      items:
        Array.isArray(invoice.items) && invoice.items.length > 0
          ? invoice.items.map((item) => ({
              ...emptyItem(),
              ...item,
            }))
          : [emptyItem()],
    };
  });

  useEffect(() => {
    let cancelled = false;

    getStock().then((items) => {
      if (!cancelled) setStockItems(items);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  function handleVatToggle(e) {
    setForm((prev) => ({ ...prev, vatEnabled: e.target.checked }));
  }

  function applyStockToItem(item, stock) {
    if (!stock) {
      return {
        ...item,
        description: item.description,
        stockId: "",
        purchasePrice: 0,
      };
    }

    return {
      ...item,
      description: stock.name,
      stockId: stock.id,
      unitPrice: normalizeMoney(stock.salePrice),
      purchasePrice: normalizeMoney(stock.purchasePrice),
      priceSource: "auto",
    };
  }

  function handleItemChange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;

        if (field === "unitPrice") {
          return { ...item, unitPrice: value, priceSource: "manual" };
        }

        if (field === "stockId") {
          const stock = stockItems.find(
            (s) => String(s.id) === String(value)
          );
          return applyStockToItem(
            { ...item, type: item.type === "Ürün" ? "Ürün" : item.type },
            stock
          );
        }

        if (field === "description" && item.type === "Ürün") {
          const stock = stockItems.find(
            (s) =>
              String(s.name || "")
                .trim()
                .toLocaleLowerCase("tr") ===
              String(value || "")
                .trim()
                .toLocaleLowerCase("tr")
          );

          if (stock) {
            return applyStockToItem({ ...item, description: value }, stock);
          }

          return {
            ...item,
            description: value,
            stockId: "",
            purchasePrice: 0,
          };
        }

        return { ...item, [field]: value };
      }),
    }));
  }

  function handleAddItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  }

  function handleRemoveItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.animalId) {
      notify("Hayvan seçiniz.", "error");
      return;
    }

    if (!form.date) {
      notify("Tarih seçiniz.", "error");
      return;
    }

    const validItems = form.items.filter(
      (item) => item.description.trim() && Number(item.unitPrice) > 0
    );

    if (validItems.length === 0) {
      notify(
        "En az bir hizmet satırı ekleyip açıklama ve birim fiyat giriniz.",
        "error"
      );
      return;
    }

    const { isDraftPreview, ...rest } = form;
    void isDraftPreview;

    onSave({ ...rest, items: validItems });
  }

  const totals = calculateInvoiceTotals(form);
  const isPreview = Boolean(form.isDraftPreview);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {isPreview && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Otomatik taslak önizleme. Satırları düzenleyebilirsiniz; kaydetmeden
          fatura oluşmaz.
        </Alert>
      )}

      <Grid container spacing={2}>

        <Grid size={8}>
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
              <MenuItem key={animal.id} value={animal.id}>
                {animal.name} - {animal.ownerName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={4}>
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

        <Grid size={12}>
          <Divider />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            Hizmet / Ürün Satırları
          </Typography>
        </Grid>

        {form.items.map((item, index) => (
          <Grid size={12} key={item.id || index}>
            <Grid container spacing={1} alignItems="center">
              <Grid size={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tür"
                  value={item.type}
                  onChange={(e) =>
                    handleItemChange(index, "type", e.target.value)
                  }
                >
                  {INVOICE_ITEM_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={item.type === "Ürün" && stockItems.length > 0 ? 2.2 : 3.8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Açıklama"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                />
              </Grid>

              {item.type === "Ürün" && stockItems.length > 0 && (
                <Grid size={1.6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Stok"
                    value={item.stockId || ""}
                    onChange={(e) =>
                      handleItemChange(index, "stockId", e.target.value)
                    }
                  >
                    <MenuItem value="">Seçiniz</MenuItem>
                    {stockItems.map((stock) => (
                      <MenuItem key={stock.id} value={stock.id}>
                        {stock.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              <Grid size={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Birim Fiyat"
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleItemChange(index, "unitPrice", e.target.value)
                  }
                  helperText={
                    item.priceSource === "auto"
                      ? "Otomatik"
                      : item.priceSource === "manual"
                        ? "Manuel"
                        : " "
                  }
                  sx={priceFieldSx(item.priceSource)}
                  FormHelperTextProps={{ sx: { m: 0, minHeight: 16 } }}
                  slotProps={{
                    htmlInput: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>

              <Grid size={1.2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Adet"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  slotProps={{
                    htmlInput: { min: 1, step: 1 }
                  }}
                />
              </Grid>

              <Grid size={1.6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ara Toplam"
                  value={formatCurrency(
                    (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)
                  )}
                  slotProps={{
                    input: { readOnly: true }
                  }}
                />
              </Grid>

              <Grid size={0.6}>
                <Tooltip title="Satırı Sil">
                  <IconButton
                    color="error"
                    size="small"
                    disabled={form.items.length === 1}
                    onClick={() => handleRemoveItem(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        ))}

        <Grid size={12}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
          >
            Satır Ekle
          </Button>
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        <Grid size={4}>
          <TextField
            select
            fullWidth
            label="İndirim Türü"
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
          >
            {DISCOUNT_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={4}>
          <TextField
            fullWidth
            type="number"
            label="İndirim Değeri"
            name="discountValue"
            value={form.discountValue}
            onChange={handleChange}
            disabled={form.discountType === "none"}
            slotProps={{
              htmlInput: { min: 0, step: 0.01 }
            }}
          />
        </Grid>

        <Grid size={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(form.cancelled)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cancelled: e.target.checked,
                    paymentStatus: e.target.checked ? "İptal" : "",
                  }))
                }
              />
            }
            label="Faturayı iptal et"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Ödeme durumu tahsilat ledger&apos;ından hesaplanır.
          </Typography>
        </Grid>

        <Grid size={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.vatEnabled}
                onChange={handleVatToggle}
              />
            }
            label="KDV Uygula"
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="KDV Oranı (%)"
            name="vatRate"
            value={form.vatRate}
            onChange={handleChange}
            disabled={!form.vatEnabled}
          >
            {VAT_RATE_OPTIONS.map((rate) => (
              <MenuItem key={rate} value={rate}>
                %{rate}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Not"
            name="note"
            value={form.note}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <Box
            sx={{
              backgroundColor: "#f5f5f5",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Ara Toplam</Typography>
              <Typography>{formatCurrency(totals.subtotal)}</Typography>
            </Box>

            {totals.discountAmount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>İndirim</Typography>
                <Typography color="error">
                  - {formatCurrency(totals.discountAmount)}
                </Typography>
              </Box>
            )}

            {form.vatEnabled && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>KDV (%{form.vatRate})</Typography>
                <Typography>{formatCurrency(totals.vatAmount)}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight="bold">
                Genel Toplam
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totals.total)}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={12}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
          >
            {isEditing ? "Faturayı Güncelle" : "Faturayı Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default InvoiceForm;
