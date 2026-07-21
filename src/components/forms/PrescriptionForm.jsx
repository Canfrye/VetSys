import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import SearchableAutocomplete from "../SearchableAutocomplete";
import { useNotification } from "../../hooks/useNotification";
import { todayDateOnly } from "../../utils/dateRange";
import { getStock } from "../../services/stockService";
import { getSettings } from "../../services/settingsService";
import {
  PRESCRIPTION_DURATIONS,
  PRESCRIPTION_FREQUENCIES,
  createEmptyPrescriptionItem,
  validatePrescriptionItems,
} from "../../utils/prescriptionUtils";
import {
  DEFAULT_MEDICATION_NAMES,
  mergeSuggestionLists,
  rememberRecentValue,
} from "../../utils/selectionMemory";

const EMPTY_INITIAL = {};

function animalLabel(animal) {
  if (!animal) return "";
  return `${animal.name || ""} · ${animal.ownerName || ""}`.trim();
}

function PrescriptionForm({
  prescription,
  animals = [],
  isEditing,
  onSave,
  initialValues = EMPTY_INITIAL,
  readOnly = false,
}) {
  const { notify } = useNotification();

  const emptyForm = {
    animalId: "",
    animalName: "",
    ownerId: "",
    ownerName: "",
    veterinarian: "",
    examinationId: "",
    examinationDate: "",
    date: todayDateOnly(),
    diagnosis: "",
    notes: "",
    items: [createEmptyPrescriptionItem()],
  };

  const [form, setForm] = useState(() => {
    if (prescription) {
      return {
        ...emptyForm,
        ...prescription,
        items:
          prescription.items?.length > 0
            ? prescription.items.map((item) => ({
                ...createEmptyPrescriptionItem(),
                ...item,
              }))
            : [createEmptyPrescriptionItem()],
      };
    }

    return {
      ...emptyForm,
      ...initialValues,
      items:
        initialValues.items?.length > 0
          ? initialValues.items.map((item) => ({
              ...createEmptyPrescriptionItem(),
              ...item,
            }))
          : [createEmptyPrescriptionItem()],
    };
  });

  const [stockItems, setStockItems] = useState([]);
  const [recentMeds, setRecentMeds] = useState([]);
  const [recentVets, setRecentVets] = useState([]);
  const [clinicVet, setClinicVet] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getStock(), getSettings()]).then(([stock, settings]) => {
      if (cancelled) return;
      setStockItems(stock);
      setRecentMeds(settings.recentSelections?.medications || []);
      setRecentVets(settings.recentSelections?.veterinarians || []);
      setClinicVet(settings.veterinarian || "");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const medicationOptions = useMemo(
    () =>
      mergeSuggestionLists({
        catalog: DEFAULT_MEDICATION_NAMES,
        recent: recentMeds,
        extras: stockItems.map((s) => s.name),
      }),
    [stockItems, recentMeds]
  );

  const veterinarianOptions = useMemo(
    () =>
      mergeSuggestionLists({
        catalog: clinicVet ? [clinicVet] : [],
        recent: recentVets,
      }),
    [clinicVet, recentVets]
  );

  const selectedAnimal = useMemo(
    () => animals.find((a) => String(a.id) === String(form.animalId)) || null,
    [animals, form.animalId]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(index, field, value) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }

  function handleAddItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyPrescriptionItem()],
    }));
  }

  function handleRemoveItem(index) {
    setForm((prev) => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (readOnly) return;

    if (!form.animalId) {
      notify("Hayvan seçiniz.", "error");
      return;
    }

    if (!form.veterinarian?.trim()) {
      notify("Veteriner giriniz.", "error");
      return;
    }

    const check = validatePrescriptionItems(form.items);

    if (!check.valid) {
      notify(check.error, "error");
      return;
    }

    await rememberRecentValue("veterinarians", form.veterinarian.trim());
    for (const item of check.items) {
      if (item.medicationName) {
        await rememberRecentValue("medications", item.medicationName);
      }
    }

    onSave({ ...form, items: check.items });
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SearchableAutocomplete
            label="Hayvan"
            value={selectedAnimal}
            options={animals}
            freeSolo={false}
            required
            disabled={readOnly || isEditing}
            getOptionLabel={animalLabel}
            isOptionEqualToValue={(a, b) =>
              String(a?.id || "") === String(b?.id || "")
            }
            onChange={(animal) =>
              setForm((prev) => ({
                ...prev,
                animalId: animal?.id || "",
                animalName: animal?.name || "",
                ownerId: animal?.ownerId || "",
                ownerName: animal?.ownerName || "",
              }))
            }
            placeholder="Hayvan ara..."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sahip"
            value={form.ownerName || "-"}
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SearchableAutocomplete
            label="Veteriner"
            value={form.veterinarian}
            options={veterinarianOptions}
            freeSolo
            required
            disabled={readOnly}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                veterinarian: typeof value === "string" ? value : value || "",
              }))
            }
            placeholder="Veteriner ara..."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Tarih"
            name="date"
            value={form.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            disabled={readOnly}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Muayene Bağlantısı"
            value={
              form.examinationId
                ? form.examinationDate || form.examinationId
                : "Yok"
            }
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Tanı"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            disabled={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Genel Not"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            disabled={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography fontWeight={700} mb={1}>
            İlaçlar
          </Typography>
        </Grid>

        {form.items.map((item, index) => (
          <Grid item xs={12} key={item.id || index}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={3}>
                <SearchableAutocomplete
                  size="small"
                  label="İlaç adı"
                  value={item.medicationName}
                  options={medicationOptions}
                  freeSolo
                  disabled={readOnly}
                  onChange={(value) =>
                    handleItemChange(
                      index,
                      "medicationName",
                      typeof value === "string" ? value : value || ""
                    )
                  }
                  helperText="Stoktaki ürün adıyla aynı olursa düşüm yapılır"
                  placeholder="İlaç ara..."
                />
              </Grid>

              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Doz"
                  placeholder="1 tablet"
                  value={item.dose}
                  onChange={(e) =>
                    handleItemChange(index, "dose", e.target.value)
                  }
                  disabled={readOnly}
                />
              </Grid>

              <Grid item xs={6} sm={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Adet"
                  value={item.quantity ?? 1}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  disabled={readOnly}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={6} sm={1.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Sıklık"
                  value={item.frequency}
                  onChange={(e) =>
                    handleItemChange(index, "frequency", e.target.value)
                  }
                  disabled={readOnly}
                >
                  {PRESCRIPTION_FREQUENCIES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} sm={1.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Süre"
                  value={item.duration}
                  onChange={(e) =>
                    handleItemChange(index, "duration", e.target.value)
                  }
                  disabled={readOnly}
                >
                  {PRESCRIPTION_DURATIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={5} sm={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Açıklama"
                  placeholder="Tok karnına"
                  value={item.instructions}
                  onChange={(e) =>
                    handleItemChange(index, "instructions", e.target.value)
                  }
                  disabled={readOnly}
                />
              </Grid>

              <Grid item xs={1}>
                <Tooltip title="Satırı sil">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={readOnly || form.items.length === 1}
                      onClick={() => handleRemoveItem(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        ))}

        {!readOnly && (
          <Grid item xs={12}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              İlaç Ekle
            </Button>
          </Grid>
        )}

        {!readOnly && (
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth>
              {isEditing ? "Güncelle" : "Kaydet"}
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default PrescriptionForm;
