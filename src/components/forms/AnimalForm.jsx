import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import SearchableAutocomplete from "../SearchableAutocomplete";
import { isMicrochipExists, getAnimals } from "../../services/animalService";
import { getSettings } from "../../services/settingsService";
import { useNotification } from "../../hooks/useNotification";
import {
  SPECIES_OPTIONS,
  buildBreedOptions,
  groupBreedOption,
} from "../../utils/breedCatalog";
import { rememberRecentBreed } from "../../utils/selectionMemory";
import {
  OWNER_TYPE,
  OWNER_TYPE_OPTIONS,
  hidesCustomerPicker,
  normalizeOwnerType,
  requiresCustomerOwner,
  resolveAnimalOwnerFields,
} from "../../utils/ownerType";

const emptyForm = {
  ownerType: OWNER_TYPE.CUSTOMER,
  ownerId: "",
  ownerName: "",
  otherOwnerName: "",
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

function customerLabel(customer) {
  if (!customer) return "";
  return `${customer.ad || ""} ${customer.soyad || ""}`.trim();
}

function AnimalForm({
  animal,
  customers = [],
  animals: animalsProp,
  isEditing,
  onSave,
  lockOwner = false,
  initialOwnerId = "",
}) {
  const { notify } = useNotification();

  const [form, setForm] = useState(() => {
    const ownerType = lockOwner
      ? OWNER_TYPE.CUSTOMER
      : normalizeOwnerType(animal?.ownerType);

    return {
      ...emptyForm,
      ...(animal || {}),
      ownerType,
      ownerId: animal?.ownerId || initialOwnerId || "",
      otherOwnerName:
        ownerType === OWNER_TYPE.OTHER
          ? animal?.ownerName || ""
          : "",
    };
  });

  const [animals, setAnimals] = useState(animalsProp || []);
  const [recentBreeds, setRecentBreeds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      const [settings, animalsData] = await Promise.all([
        getSettings(),
        animalsProp ? Promise.resolve(animalsProp) : getAnimals(),
      ]);

      if (cancelled) return;

      setRecentBreeds(settings.recentBreeds || []);
      if (!animalsProp) setAnimals(animalsData);
    }

    loadMeta();

    return () => {
      cancelled = true;
    };
  }, [animalsProp]);

  const breedMeta = useMemo(
    () =>
      buildBreedOptions({
        species: form.species,
        animals,
        recentBreeds,
      }),
    [form.species, animals, recentBreeds]
  );

  const selectedOwner = useMemo(
    () => customers.find((c) => String(c.id) === String(form.ownerId)) || null,
    [customers, form.ownerId]
  );

  const showCustomerPicker = !hidesCustomerPicker(form.ownerType);
  const showOtherName = normalizeOwnerType(form.ownerType) === OWNER_TYPE.OTHER;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "ownerType") {
      setForm((prev) => ({
        ...prev,
        ownerType: value,
        ownerId: value === OWNER_TYPE.CUSTOMER ? prev.ownerId : "",
        otherOwnerName: value === OWNER_TYPE.OTHER ? prev.otherOwnerName : "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSpeciesChange(next) {
    const species = typeof next === "string" ? next : next || "";
    setForm((prev) => ({
      ...prev,
      species,
      breed: "",
    }));
  }

  function handleBreedChange(next) {
    const breed = typeof next === "string" ? next : next || "";
    setForm((prev) => ({
      ...prev,
      breed,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (requiresCustomerOwner(form.ownerType) && !form.ownerId) {
      notify("Lütfen hayvan sahibini seçiniz.", "error");
      return;
    }

    if (
      normalizeOwnerType(form.ownerType) === OWNER_TYPE.OTHER &&
      !String(form.otherOwnerName || "").trim()
    ) {
      notify("Diğer sahip için bir isim giriniz.", "error");
      return;
    }

    if (!form.name.trim()) {
      notify("Hayvan adı zorunludur.", "error");
      return;
    }

    if (!form.species) {
      notify("Tür seçiniz.", "error");
      return;
    }

    const microchipNo = form.microchipNo.trim();

    const microchipTaken =
      microchipNo &&
      (await isMicrochipExists(
        microchipNo,
        isEditing ? animal?.id : null
      ));

    if (microchipTaken) {
      notify("Bu mikroçip numarası zaten kayıtlı.", "error");
      return;
    }

    if (form.breed?.trim()) {
      await rememberRecentBreed(form.species, form.breed.trim());
    }

    const ownerFields = resolveAnimalOwnerFields({
      ownerType: form.ownerType,
      ownerId: form.ownerId,
      ownerName: selectedOwner
        ? customerLabel(selectedOwner)
        : form.ownerName,
      otherOwnerName: form.otherOwnerName,
    });

    onSave({
      ...form,
      ...ownerFields,
      microchipNo,
    });

    if (!isEditing) {
      setForm(emptyForm);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>

        <Grid size={showCustomerPicker || showOtherName ? 6 : 12}>
          <TextField
            select
            fullWidth
            label="Sahip Tipi"
            name="ownerType"
            value={form.ownerType}
            onChange={handleChange}
            disabled={lockOwner}
            required
          >
            {OWNER_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {showCustomerPicker && (
          <Grid size={6}>
            <SearchableAutocomplete
              label="Hayvan Sahibi"
              value={selectedOwner}
              options={customers}
              freeSolo={false}
              required
              disabled={lockOwner}
              getOptionLabel={customerLabel}
              isOptionEqualToValue={(a, b) =>
                String(a?.id || "") === String(b?.id || "")
              }
              onChange={(customer) =>
                setForm((prev) => ({
                  ...prev,
                  ownerId: customer?.id || "",
                }))
              }
              helperText={
                lockOwner
                  ? "Sahip, az önce oluşturulan müşteri olarak sabitlendi."
                  : "İsim yazarak arayın"
              }
              placeholder="Müşteri ara..."
            />
          </Grid>
        )}

        {showOtherName && (
          <Grid size={6}>
            <TextField
              fullWidth
              label="Sahip / Kurum Adı"
              name="otherOwnerName"
              value={form.otherOwnerName}
              onChange={handleChange}
              required
              placeholder="Örn. Doğa Koruma, Hayvansever Derneği"
            />
          </Grid>
        )}

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
          <SearchableAutocomplete
            label="Tür"
            value={form.species}
            options={SPECIES_OPTIONS}
            freeSolo={false}
            required
            onChange={handleSpeciesChange}
            placeholder="Tür ara..."
          />
        </Grid>

        <Grid size={6}>
          <SearchableAutocomplete
            label="Irk"
            value={form.breed}
            options={breedMeta.options}
            freeSolo
            disabled={!form.species}
            onChange={handleBreedChange}
            groupBy={(option) =>
              groupBreedOption(
                option,
                breedMeta.recentSet,
                breedMeta.frequentSet
              )
            }
            helperText={
              form.species
                ? "Yazarak arayın; listede yoksa Enter ile ekleyin"
                : "Önce tür seçiniz"
            }
            placeholder="Irk ara..."
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
            slotProps={{
              inputLabel: { shrink: true }
            }}
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
            slotProps={{
              htmlInput: {
                maxLength: 30,
              }
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
            slotProps={{
              htmlInput: {
                min: 0,
                max: 150,
                step: 0.1,
              }
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
