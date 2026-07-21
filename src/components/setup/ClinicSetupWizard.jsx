import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/tr";

dayjs.extend(customParseFormat);

import { APP_VERSION } from "../../utils/vsbBackup";
import {
  formatPhoneMask,
  formatWorkingHoursSummary,
  LOGO_WARN_BYTES,
  normalizeWorkingHoursSchedule,
  pickClinicIdentityFields,
  readLogoAsDataUrl,
  validateClinicIdentity,
} from "../../utils/clinicIdentity";

const STEPS = [
  "Hoş Geldiniz",
  "Klinik Bilgileri",
  "Resmi Bilgiler",
  "Çalışma Saatleri",
  "Varsayılan Veteriner",
  "Logo",
  "Özet",
];

function timeToDayjs(value) {
  if (!value) return null;
  const parsed = dayjs(value, "HH:mm");
  return parsed.isValid() ? parsed : null;
}

function dayjsToTime(value) {
  if (!value || !value.isValid?.()) return "";
  return value.format("HH:mm");
}

function DayHoursEditor({ label, value, onChange }) {
  const day = value || {};

  function patch(partial) {
    onChange({ ...day, ...partial });
  }

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1}
        mb={1}
      >
        <Typography fontWeight={600}>{label}</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(day.closed)}
              onChange={(e) => patch({ closed: e.target.checked })}
            />
          }
          label="Kapalı"
        />
      </Stack>

      {!day.closed && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TimePicker
              label="Açılış"
              ampm={false}
              value={timeToDayjs(day.open)}
              onChange={(v) => patch({ open: dayjsToTime(v) || day.open })}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TimePicker
              label="Kapanış"
              ampm={false}
              value={timeToDayjs(day.close)}
              onChange={(v) => patch({ close: dayjsToTime(v) || day.close })}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(day.lunchEnabled)}
                  onChange={(e) => patch({ lunchEnabled: e.target.checked })}
                />
              }
              label="Öğle arası"
            />
          </Grid>
          {day.lunchEnabled && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TimePicker
                  label="Öğle başlangıç"
                  ampm={false}
                  value={timeToDayjs(day.lunchStart)}
                  onChange={(v) =>
                    patch({ lunchStart: dayjsToTime(v) || day.lunchStart })
                  }
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TimePicker
                  label="Öğle bitiş"
                  ampm={false}
                  value={timeToDayjs(day.lunchEnd)}
                  onChange={(v) =>
                    patch({ lunchEnd: dayjsToTime(v) || day.lunchEnd })
                  }
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Box>
  );
}

/**
 * İlk kurulum / klinik kimliği sihirbazı.
 * Kayıt yalnızca son adımda yapılır.
 */
export default function ClinicSetupWizard({
  open,
  onClose,
  onSave,
  initialSettings = {},
  users = [],
  allowCancel = true,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState(() =>
    pickClinicIdentityFields(initialSettings)
  );
  const [errors, setErrors] = useState({});
  const [logoWarning, setLogoWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const schedule = useMemo(
    () => normalizeWorkingHoursSchedule(draft.workingHoursSchedule),
    [draft.workingHoursSchedule]
  );

  function patchDraft(partial) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function patchSchedule(dayKey, dayValue) {
    patchDraft({
      workingHoursSchedule: {
        ...schedule,
        [dayKey]: dayValue,
      },
    });
  }

  function validateCurrentStep() {
    if (activeStep === 1) {
      const check = validateClinicIdentity(draft, { requireOfficial: false });
      const stepErrors = {};
      if (check.errors.clinicName) stepErrors.clinicName = check.errors.clinicName;
      if (check.errors.phone) stepErrors.phone = check.errors.phone;
      if (check.errors.email) stepErrors.email = check.errors.email;
      setErrors(stepErrors);
      return Object.keys(stepErrors).length === 0;
    }

    if (activeStep === 2) {
      const check = validateClinicIdentity(draft, { requireOfficial: true });
      const stepErrors = {};
      if (check.errors.taxOffice) stepErrors.taxOffice = check.errors.taxOffice;
      if (check.errors.taxNumber) stepErrors.taxNumber = check.errors.taxNumber;
      setErrors(stepErrors);
      return Object.keys(stepErrors).length === 0;
    }

    setErrors({});
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setErrors({});
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function handleLogoFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;

    try {
      const result = await readLogoAsDataUrl(file);
      patchDraft({ logo: result.dataUrl });
      setLogoWarning(
        result.warnLarge
          ? `Logo ${(result.sizeBytes / 1024).toFixed(0)} KB — 300 KB üzerinde; PDF boyutu artabilir.`
          : ""
      );
    } catch (error) {
      setLogoWarning(error?.message || "Logo yüklenemedi.");
    }
  }

  async function handleSave() {
    if (!validateClinicIdentity(draft, { requireOfficial: true }).valid) {
      setActiveStep(1);
      validateCurrentStep();
      return;
    }

    setSaving(true);
    try {
      const workingHoursSchedule = normalizeWorkingHoursSchedule(
        draft.workingHoursSchedule
      );
      const payload = {
        ...initialSettings,
        ...draft,
        clinicName: String(draft.clinicName || "").trim(),
        workingHoursSchedule,
        workingHours: formatWorkingHoursSummary(workingHoursSchedule),
        phone: formatPhoneMask(draft.phone),
      };
      await onSave?.(payload);
    } finally {
      setSaving(false);
    }
  }

  function goToStep(index) {
    setActiveStep(index);
  }

  return (
    <Dialog open={open} fullWidth maxWidth="md" disableEscapeKeyDown={!allowCancel}>
      <DialogTitle>Klinik Kurulum Sihirbazı</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                VetSys’e Hoş Geldiniz
              </Typography>
              <Typography color="text.secondary">
                Bu sihirbaz klinik kimliğinizi (adres, iletişim, resmi bilgiler,
                çalışma saatleri ve logo) birkaç adımda tanımlamanıza yardımcı
                olur. Bilgiler fatura, reçete ve diğer PDF çıktılarında otomatik
                kullanılır.
              </Typography>
              <Typography variant="body2">
                Program sürümü: <strong>{APP_VERSION}</strong>
              </Typography>
            </Stack>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Klinik Adı"
                  value={draft.clinicName}
                  error={Boolean(errors.clinicName)}
                  helperText={errors.clinicName}
                  onChange={(e) => patchDraft({ clinicName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Klinik Sahibi"
                  value={draft.clinicOwner}
                  onChange={(e) => patchDraft({ clinicOwner: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Telefon"
                  value={draft.phone}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                  onChange={(e) =>
                    patchDraft({ phone: formatPhoneMask(e.target.value) })
                  }
                  placeholder="0 (5XX) XXX XX XX"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="E-posta"
                  value={draft.email}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  onChange={(e) => patchDraft({ email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Web Sitesi"
                  value={draft.website}
                  onChange={(e) => patchDraft({ website: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Adres"
                  value={draft.address}
                  onChange={(e) => patchDraft({ address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="İl"
                  value={draft.city}
                  onChange={(e) => patchDraft({ city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="İlçe"
                  value={draft.district}
                  onChange={(e) => patchDraft({ district: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Vergi Dairesi"
                  value={draft.taxOffice}
                  error={Boolean(errors.taxOffice)}
                  helperText={errors.taxOffice}
                  onChange={(e) => patchDraft({ taxOffice: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Vergi Numarası"
                  value={draft.taxNumber}
                  error={Boolean(errors.taxNumber)}
                  helperText={errors.taxNumber || "10 veya 11 hane"}
                  onChange={(e) =>
                    patchDraft({
                      taxNumber: e.target.value.replace(/\D/g, "").slice(0, 11),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MERSİS (opsiyonel)"
                  value={draft.mersis}
                  onChange={(e) => patchDraft({ mersis: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ticaret Sicil No (opsiyonel)"
                  value={draft.tradeRegistryNo}
                  onChange={(e) =>
                    patchDraft({ tradeRegistryNo: e.target.value })
                  }
                />
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                Bu bilgiler PDF ve faturalarda kullanılabilir.
              </Typography>
            </Grid>
          )}

          {activeStep === 3 && (
            <Box>
              <DayHoursEditor
                label="Hafta içi"
                value={schedule.weekday}
                onChange={(v) => patchSchedule("weekday", v)}
              />
              <DayHoursEditor
                label="Cumartesi"
                value={schedule.saturday}
                onChange={(v) => patchSchedule("saturday", v)}
              />
              <DayHoursEditor
                label="Pazar"
                value={schedule.sunday}
                onChange={(v) => patchSchedule("sunday", v)}
              />
            </Box>
          )}

          {activeStep === 4 && (
            <Stack spacing={2}>
              {users.length === 0 ? (
                <Alert severity="info">
                  İlk kullanıcı daha sonra oluşturulacak.
                </Alert>
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Varsayılan Veteriner"
                  value={draft.veterinarian || ""}
                  onChange={(e) => patchDraft({ veterinarian: e.target.value })}
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  {users.map((u) => {
                    const label = u.fullName || u.username || u.id;
                    return (
                      <MenuItem key={u.id || label} value={label}>
                        {label}
                        {u.role ? ` (${u.role})` : ""}
                      </MenuItem>
                    );
                  })}
                </TextField>
              )}
              <Typography variant="body2" color="text.secondary">
                Seçim Settings içindeki “Veteriner” alanına yazılır.
              </Typography>
            </Stack>
          )}

          {activeStep === 5 && (
            <Stack spacing={2}>
              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleLogoFiles(e.dataTransfer.files);
                }}
                sx={{
                  border: "2px dashed",
                  borderColor: dragOver ? "primary.main" : "divider",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  bgcolor: dragOver ? "action.hover" : "transparent",
                }}
              >
                <Typography mb={1}>
                  Logo sürükleyip bırakın veya dosya seçin (PNG, JPG, WEBP)
                </Typography>
                <Button variant="outlined" component="label">
                  Dosya Seç
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleLogoFiles(e.target.files)}
                  />
                </Button>
                <Typography variant="caption" display="block" mt={1}>
                  Önerilen boyut: ~{Math.round(LOGO_WARN_BYTES / 1024)} KB altı
                </Typography>
              </Box>

              {logoWarning && <Alert severity="warning">{logoWarning}</Alert>}

              {draft.logo && (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Önizleme
                  </Typography>
                  <Box
                    component="img"
                    src={draft.logo}
                    alt="Klinik logosu"
                    sx={{ maxHeight: 120, maxWidth: "100%", objectFit: "contain" }}
                  />
                  <Box mt={1}>
                    <Button color="inherit" onClick={() => patchDraft({ logo: "" })}>
                      Logoyu Kaldır
                    </Button>
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          {activeStep === 6 && (
            <Stack spacing={1.25}>
              <Typography>
                Klinik: <strong>{draft.clinicName || "—"}</strong>
              </Typography>
              <Typography>
                Sahip: <strong>{draft.clinicOwner || "—"}</strong>
              </Typography>
              <Typography>
                Telefon: <strong>{draft.phone || "—"}</strong>
              </Typography>
              <Typography>
                E-posta: <strong>{draft.email || "—"}</strong>
              </Typography>
              <Typography>
                Adres: <strong>{draft.address || "—"}</strong>
              </Typography>
              <Typography>
                İl / İlçe:{" "}
                <strong>
                  {[draft.district, draft.city].filter(Boolean).join(" / ") || "—"}
                </strong>
              </Typography>
              <Typography>
                Vergi:{" "}
                <strong>
                  {draft.taxOffice || "—"} / {draft.taxNumber || "—"}
                </strong>
              </Typography>
              <Typography>
                Veteriner: <strong>{draft.veterinarian || "—"}</strong>
              </Typography>
              <Typography>
                Çalışma saatleri:{" "}
                <strong>{formatWorkingHoursSummary(schedule)}</strong>
              </Typography>
              <Typography>
                Logo: <strong>{draft.logo ? "Yüklendi" : "Yok"}</strong>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" onClick={() => goToStep(1)}>
                  Klinik Bilgilerini Düzenle
                </Button>
                <Button size="small" onClick={() => goToStep(2)}>
                  Resmi Bilgileri Düzenle
                </Button>
                <Button size="small" onClick={() => goToStep(3)}>
                  Saatleri Düzenle
                </Button>
                <Button size="small" onClick={() => goToStep(5)}>
                  Logoyu Düzenle
                </Button>
              </Stack>
            </Stack>
          )}
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {allowCancel && (
          <Button onClick={onClose} disabled={saving}>
            İptal
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleBack} disabled={activeStep === 0 || saving}>
          Geri
        </Button>
        {activeStep === 0 && (
          <Button variant="contained" onClick={handleNext}>
            Kuruluma Başla
          </Button>
        )}
        {activeStep > 0 && activeStep < STEPS.length - 1 && (
          <Button variant="contained" onClick={handleNext}>
            İleri
          </Button>
        )}
        {activeStep === STEPS.length - 1 && (
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
