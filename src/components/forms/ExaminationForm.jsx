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
import { getSettings } from "../../services/settingsService";
import {
  getExamTypeOptions,
  getServiceDefaultPrice,
} from "../../utils/serviceCatalog";
import {
  mergeSuggestionLists,
  rememberRecentValue,
} from "../../utils/selectionMemory";

function animalLabel(animal) {
  if (!animal) return "";
  return `${animal.name || ""} - ${animal.ownerName || ""}`.trim();
}

function ExaminationForm({
  examination,
  animals = [],
  isEditing,
  onSave,
}) {
  const emptyForm = {
    animalId: "",
    animalName: "",
    ownerId: "",
    ownerName: "",

    veterinarian: "",

    examinationDate: todayDateOnly(),

    examType: "Genel Muayene",
    fee: "",
    feeSource: "",

    complaint: "",

    generalCondition: "",

    diagnosis: "",

    findings: "",

    treatment: "",

    temperature: "",
    pulse: "",
    respiration: "",
    height: "",
    weight: "",

    procedures: "",

    medicines: "",

    labResult: "",

    controlDate: "",

    notes: "",

    species: "",

    attachments: [],
  };

  const { notify } = useNotification();

  const [form, setForm] = useState(() =>
    examination
      ? {
          ...emptyForm,
          ...examination,
          fee:
            examination.fee != null && examination.fee !== ""
              ? examination.fee
              : "",
          feeSource: examination.feeSource || "",
        }
      : emptyForm
  );

  const [examTypes, setExamTypes] = useState([]);
  const [serviceFees, setServiceFees] = useState([]);
  const [recentVets, setRecentVets] = useState([]);
  const [clinicVet, setClinicVet] = useState("");

  useEffect(() => {
    let cancelled = false;

    getSettings().then((settings) => {
      if (cancelled) return;
      const fees = settings.serviceFees || [];
      setServiceFees(fees);
      setExamTypes(getExamTypeOptions(fees));
      setRecentVets(settings.recentSelections?.veterinarians || []);
      setClinicVet(settings.veterinarian || "");

      setForm((prev) => {
        if (prev.feeSource === "manual") return prev;
        if (prev.fee !== "" && prev.fee != null && Number(prev.fee) > 0) {
          return prev;
        }

        const price = getServiceDefaultPrice(
          fees,
          prev.examType || "Genel Muayene"
        );

        if (price <= 0) return prev;

        return {
          ...prev,
          fee: price,
          feeSource: "auto",
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  function applyExamTypeFee(examType, fees, keepManual) {
    if (keepManual) return {};

    const price = getServiceDefaultPrice(fees || serviceFees, examType);
    return {
      fee: price,
      feeSource: price > 0 || examType ? "auto" : "",
    };
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "examType") {
      setForm((prev) => ({
        ...prev,
        examType: value,
        ...applyExamTypeFee(value, serviceFees, false),
      }));
      return;
    }

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

    if (!form.complaint.trim()) {
      notify("Şikayet alanı zorunludur.", "error");
      return;
    }

    if (form.veterinarian?.trim()) {
      await rememberRecentValue("veterinarians", form.veterinarian.trim());
    }

    onSave(form);
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
            required
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
                species: animal?.species || "",
              }))
            }
            placeholder="Hayvan ara..."
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Muayene Türü"
            name="examType"
            value={form.examType || ""}
            onChange={handleChange}
          >
            {(examTypes.length > 0
              ? examTypes
              : [{ name: "Genel Muayene" }]
            ).map((opt) => (
              <MenuItem key={opt.name} value={opt.name}>
                {opt.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="number"
            label="Muayene Ücreti (₺)"
            name="fee"
            value={form.fee}
            onChange={handleChange}
            helperText={
              form.feeSource === "auto"
                ? "Otomatik (ayarlar)"
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

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Muayene Tarihi"
            name="examinationDate"
            value={form.examinationDate}
            onChange={handleChange}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            required
            label="Şikayet"
            name="complaint"
            value={form.complaint}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            select
            fullWidth
            label="Genel Durum"
            name="generalCondition"
            value={form.generalCondition}
            onChange={handleChange}
          >
            <MenuItem value="İyi">İyi</MenuItem>
            <MenuItem value="Orta">Orta</MenuItem>
            <MenuItem value="Kötü">Kötü</MenuItem>
            <MenuItem value="Kritik">Kritik</MenuItem>
          </TextField>
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Tanı"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Muayene Bulguları"
            name="findings"
            value={form.findings}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Uygulanan Tedavi"
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={4}>
          <TextField
            fullWidth
            label="Ateş (°C)"
            name="temperature"
            value={form.temperature}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={4}>
          <TextField
            fullWidth
            label="Nabız"
            name="pulse"
            value={form.pulse}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={4}>
          <TextField
            fullWidth
            label="Solunum"
            name="respiration"
            value={form.respiration}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Boy (cm)"
            name="height"
            value={form.height}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            label="Kilo (kg)"
            name="weight"
            value={form.weight}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Yapılan İşlemler"
            name="procedures"
            value={form.procedures}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Kullanılan İlaçlar"
            name="medicines"
            value={form.medicines}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Laboratuvar Sonucu"
            name="labResult"
            value={form.labResult}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={6}>
          <TextField
            fullWidth
            type="date"
            label="Kontrol Tarihi"
            name="controlDate"
            value={form.controlDate}
            onChange={handleChange}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Grid>

        <Grid size={6}>
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
            size="large"
            type="submit"
          >
            {isEditing
              ? "Muayeneyi Güncelle"
              : "Muayene Kaydet"}
          </Button>
        </Grid>

      </Grid>
    </Box>
  );
}

export default ExaminationForm;
