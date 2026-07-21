import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import SearchableAutocomplete from "../SearchableAutocomplete";
import { useNotification } from "../../hooks/useNotification";
import { getStock } from "../../services/stockService";
import { getSettings } from "../../services/settingsService";
import {
  STOCK_CATEGORIES,
  STOCK_UNITS,
  normalizeMoney,
} from "../../utils/stockUtils";
import {
  mergeSuggestionLists,
  rememberRecentValue,
} from "../../utils/selectionMemory";

const EMPTY_FORM = {
  name: "",
  category: "İlaç",
  quantity: "",
  minQuantity: "",
  unit: "Adet",
  expiryDate: "",
  lotNo: "",
  purchasePrice: "",
  salePrice: "",
  currency: "TL",
  supplierName: "",
  supplierPhone: "",
  supplierEmail: "",
  supplierNote: "",
  note: "",
};

function toFormState(stock) {
  if (!stock) return { ...EMPTY_FORM };

  return {
    ...EMPTY_FORM,
    ...stock,
    supplierName: stock.supplierName || stock.supplier || "",
    quantity: stock.quantity ?? "",
    minQuantity: stock.minQuantity ?? "",
    purchasePrice:
      stock.purchasePrice === 0 || stock.purchasePrice
        ? stock.purchasePrice
        : "",
    salePrice:
      stock.salePrice === 0 || stock.salePrice ? stock.salePrice : "",
    currency: stock.currency || "TL",
  };
}

function StockForm({ stock, isEditing, onSave, stockItems: stockItemsProp }) {
  const { notify } = useNotification();

  const [form, setForm] = useState(() => toFormState(stock));
  const [stockItems, setStockItems] = useState(stockItemsProp || []);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentSuppliers, setRecentSuppliers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      const [items, settings] = await Promise.all([
        stockItemsProp ? Promise.resolve(stockItemsProp) : getStock(),
        getSettings(),
      ]);

      if (cancelled) return;

      setStockItems(items);
      setRecentProducts(settings.recentSelections?.products || []);
      setRecentSuppliers(settings.recentSelections?.suppliers || []);
    }

    loadMeta();

    return () => {
      cancelled = true;
    };
  }, [stockItemsProp]);

  const productOptions = useMemo(
    () =>
      mergeSuggestionLists({
        recent: recentProducts,
        extras: stockItems.map((item) => item.name),
      }),
    [stockItems, recentProducts]
  );

  const supplierOptions = useMemo(
    () =>
      mergeSuggestionLists({
        recent: recentSuppliers,
        extras: stockItems.map(
          (item) => item.supplierName || item.supplier || ""
        ),
      }),
    [stockItems, recentSuppliers]
  );

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      notify("Ürün adı zorunludur.", "error");
      return;
    }

    if (form.quantity === "") {
      notify("Stok miktarı zorunludur.", "error");
      return;
    }

    if (form.minQuantity === "") {
      notify("Minimum stok zorunludur.", "error");
      return;
    }

    if (form.purchasePrice !== "" && Number(form.purchasePrice) < 0) {
      notify("Alış fiyatı 0'dan küçük olamaz.", "error");
      return;
    }

    if (form.salePrice !== "" && Number(form.salePrice) < 0) {
      notify("Satış fiyatı 0'dan küçük olamaz.", "error");
      return;
    }

    await rememberRecentValue("products", form.name.trim());
    if (form.supplierName?.trim()) {
      await rememberRecentValue("suppliers", form.supplierName.trim());
    }

    onSave({
      ...form,
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity),
      purchasePrice: normalizeMoney(form.purchasePrice),
      salePrice: normalizeMoney(form.salePrice),
      currency: form.currency || "TL",
      supplier: form.supplierName,
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <SearchableAutocomplete
            label="Ürün Adı"
            value={form.name}
            options={productOptions}
            freeSolo
            required
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                name: typeof value === "string" ? value : value || "",
              }))
            }
            placeholder="Ürün ara..."
            helperText="Yazarak arayın; yeni ürün adı Enter ile eklenebilir"
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
            {STOCK_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option === "Sarf" ? "Sarf Malzemesi" : option}
              </MenuItem>
            ))}
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
            {STOCK_UNITS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
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
            disabled={isEditing}
            helperText={
              isEditing
                ? "Miktar Giriş/Çıkış/Düzeltme ile değiştirilir."
                : undefined
            }
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
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Lot / Batch No"
            name="lotNo"
            value={form.lotNo}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" fontWeight={700} mt={1}>
            Fiyat Bilgisi
          </Typography>
        </Grid>

        <Grid size={5}>
          <TextField
            fullWidth
            type="number"
            label="Alış Fiyatı"
            name="purchasePrice"
            value={form.purchasePrice}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="İlaç / aşı maliyet kaydı"
          />
        </Grid>

        <Grid size={5}>
          <TextField
            fullWidth
            type="number"
            label="Satış Fiyatı"
            name="salePrice"
            value={form.salePrice}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Şimdilik sadece saklanır"
          />
        </Grid>

        <Grid size={2}>
          <TextField
            fullWidth
            label="Para Birimi"
            name="currency"
            value={form.currency || "TL"}
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" fontWeight={700} mt={1}>
            Tedarikçi Bilgisi
          </Typography>
        </Grid>

        <Grid size={12}>
          <SearchableAutocomplete
            label="Tedarikçi Adı"
            value={form.supplierName}
            options={supplierOptions}
            freeSolo
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                supplierName: typeof value === "string" ? value : value || "",
              }))
            }
            placeholder="Tedarikçi ara..."
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Telefon"
            name="supplierPhone"
            value={form.supplierPhone}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="E-posta"
            name="supplierEmail"
            value={form.supplierEmail}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Tedarikçi Notu"
            name="supplierNote"
            value={form.supplierNote}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Ürün Notu"
            name="note"
            value={form.note}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <Button fullWidth variant="contained" size="large" type="submit">
            {isEditing ? "Stoğu Güncelle" : "Stoğu Kaydet"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default StockForm;
