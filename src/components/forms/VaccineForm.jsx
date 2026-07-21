import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

import SearchableAutocomplete from "../SearchableAutocomplete";
import { useNotification } from "../../hooks/useNotification";
import { todayDateOnly } from "../../utils/dateRange";
import { getStock } from "../../services/stockService";
import { getSettings } from "../../services/settingsService";
import { getServiceDefaultPrice } from "../../utils/serviceCatalog";
import { resolveStockSalePrice } from "../../utils/invoiceDraft";
import {
  DEFAULT_VACCINE_NAMES,
  mergeSuggestionLists,
  rememberRecentValue,
} from "../../utils/selectionMemory";

function animalLabel(animal) {
  if (!animal) return "";
  return `${animal.name || ""} - ${animal.ownerName || ""}`.trim();
}

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

    applicationDate: todayDateOnly(),

    nextDoseDate: "",

    fee: "",
    feeSource: "",

    status: "Tamamlandı",

    veterinarian: "",

    notes: "",
  };

  const { notify } = useNotification();

  const [form, setForm] = useState(() =>
    vaccine
      ? {
          ...emptyForm,
          ...vaccine,
          fee:
            vaccine.fee != null && vaccine.fee !== ""
              ? vaccine.fee
              : "",
          feeSource: vaccine.feeSource || "",
        }
      : emptyForm
  );

  const [stockItems, setStockItems] = useState([]);
  const [serviceFees, setServiceFees] = useState([]);
  const [recentVaccines, setRecentVaccines] = useState([]);
  const [recentVets, setRecentVets] = useState([]);
  const [clinicVet, setClinicVet] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getStock(), getSettings()]).then(([stock, settings]) => {
      if (cancelled) return;
      setStockItems(stock);
      setServiceFees(settings.serviceFees || []);
      setRecentVaccines(settings.recentSelections?.vaccines || []);
      setRecentVets(settings.recentSelections?.veterinarians || []);
      setClinicVet(settings.veterinarian || "");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const vaccineOptions = useMemo(() => {
    const fromStock = stockItems
      .filter((s) =>
        String(s.category || "")
          .toLocaleLowerCase("tr")
          .includes("aşı")
      )
      .map((s) => s.name);

    return mergeSuggestionLists({
      catalog: DEFAULT_VACCINE_NAMES,
      recent: recentVaccines,
      extras: fromStock,
    });
  }, [stockItems, recentVaccines]);

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

  function resolveVaccineFee(vaccineName, stock = stockItems, fees = serviceFees) {
    const fromStock = resolveStockSalePrice(stock, vaccineName);
    if (fromStock && fromStock.salePrice > 0) {
      return {
        fee: fromStock.salePrice,
        feeSource: "auto",
      };
    }

    const fallback = getServiceDefaultPrice(fees, "Aşı Uygulama");
    return {
      fee: fallback,
      feeSource: fallback > 0 ? "auto" : "",
    };
  }

  function handleVaccineNameChange(value) {
    const vaccineName = typeof value === "string" ? value : value || "";
    setForm((prev) => ({
      ...prev,
      vaccineName,
      ...resolveVaccineFee(vaccineName),
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "fee") {
      setForm((prev) => ({
        ...prev,
        fee: value,
        feeSource: "manual",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.animalId) {
      notify("Hayvan seçiniz.", "error");
      return;
    }

    if (!form.vaccineName) {
      notify("Aşı seçiniz.", "error");
      return;
    }

    if (!form.applicationDate) {
      notify("Uygulama tarihi seçiniz.", "error");
      return;
    }

    await rememberRecentValue("vaccines", form.vaccineName);
    if (form.veterinarian?.trim()) {
      await rememberRecentValue("veterinarians", form.veterinarian.trim());
    }

    onSave({
      ...form,
      status: form.status || "Tamamlandı",
    });
  }

  const feeHighlight =
    form.feeSource === "auto"
      ? {
          bgcolor: "rgba(16, 185, 129, 0.12)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "success.light",
          },
        }
      : form.feeSource === "manual"
        ? {
            bgcolor: "rgba(245, 158, 11, 0.1)",
          }
        : undefined;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>

        <Grid size={12}>
          <SearchableAutocomplete
            label="Hayvan"
            value={selectedAnimal}
            options={animals}
            freeSolo={false}
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

        <Grid size={6}>
          <SearchableAutocomplete
            label="Aşı Adı"
            value={form.vaccineName}
            options={vaccineOptions}
            freeSolo
            onChange={handleVaccineNameChange}
            placeholder="Aşı ara..."
            helperText="Yazarak arayın; listede yoksa Enter ile ekleyin"
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Durum"
            name="status"
            value={form.status || "Tamamlandı"}
            onChange={handleChange}
          >
            <MenuItem value="Bekliyor">Bekliyor</MenuItem>
            <MenuItem value="Tamamlandı">Tamamlandı</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="number"
            label="Ücret (₺)"
            name="fee"
            value={form.fee}
            onChange={handleChange}
            helperText={
              form.feeSource === "auto"
                ? "Otomatik (stok / ayarlar)"
                : form.feeSource === "manual"
                  ? "Manuel düzenlendi"
                  : " "
            }
            sx={feeHighlight}
            slotProps={{
              htmlInput: { min: 0, step: 0.01 },
            }}
          />
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
            slotProps={{
              inputLabel: { shrink: true }
            }}
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
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Grid>

        <Grid size={12}>
          <SearchableAutocomplete
            label="Veteriner"
            value={form.veterinarian}
            options={veterinarianOptions}
            freeSolo
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                veterinarian: typeof value === "string" ? value : value || "",
              }))
            }
            placeholder="Veteriner ara..."
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
