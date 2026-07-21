import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  formatPhoneMask,
  formatWorkingHoursSummary,
  pickClinicIdentityFields,
  readLogoAsDataUrl,
  validateClinicIdentity,
} from "../../utils/clinicIdentity";
import { openClinicSetupWizard } from "../../utils/clinicSetupEvents";

/**
 * Ayarlar — Klinik Bilgileri kartı (Settings alanları, yeni key yok).
 */
export default function ClinicIdentityCard({
  settings,
  onChange,
  onSave,
  saving = false,
}) {
  const fileRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [logoWarning, setLogoWarning] = useState("");
  const fields = pickClinicIdentityFields(settings);

  function patch(partial) {
    onChange({ ...settings, ...partial });
  }

  function handleField(e) {
    const { name, value } = e.target;
    patch({ [name]: value });
  }

  async function handleLogo(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    try {
      const result = await readLogoAsDataUrl(file);
      patch({ logo: result.dataUrl });
      setLogoWarning(
        result.warnLarge
          ? `Logo ${(result.sizeBytes / 1024).toFixed(0)} KB — 300 KB üzerinde.`
          : ""
      );
    } catch (error) {
      setLogoWarning(error?.message || "Logo yüklenemedi.");
    }
  }

  async function handleSaveClick() {
    const check = validateClinicIdentity(fields, { requireOfficial: true });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    await onSave({
      ...settings,
      ...fields,
      clinicName: String(fields.clinicName || "").trim(),
      phone: formatPhoneMask(fields.phone),
      workingHours:
        fields.workingHours ||
        formatWorkingHoursSummary(fields.workingHoursSchedule),
    });
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
          mb={1}
        >
          <Typography variant="h6" fontWeight="bold">
            Klinik Bilgileri
          </Typography>
          <Button variant="outlined" onClick={openClinicSetupWizard}>
            Kurulum Sihirbazını Çalıştır
          </Button>
        </Stack>

        <Typography color="text.secondary" mb={2}>
          Logo, iletişim ve resmi bilgiler fatura/reçete PDF’lerinde otomatik
          görünür. Tüm alanlar mevcut Settings kaydında tutulur.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Klinik Adı"
              name="clinicName"
              value={fields.clinicName}
              error={Boolean(errors.clinicName)}
              helperText={errors.clinicName}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Klinik Sahibi"
              name="clinicOwner"
              value={fields.clinicOwner}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Varsayılan Veteriner"
              name="veterinarian"
              value={fields.veterinarian}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Telefon"
              name="phone"
              value={fields.phone}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              onChange={(e) =>
                patch({ phone: formatPhoneMask(e.target.value) })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="E-posta"
              name="email"
              value={fields.email}
              error={Boolean(errors.email)}
              helperText={errors.email}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Web Sitesi"
              name="website"
              value={fields.website}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Adres"
              name="address"
              value={fields.address}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="İl"
              name="city"
              value={fields.city}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="İlçe"
              name="district"
              value={fields.district}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Vergi Dairesi"
              name="taxOffice"
              value={fields.taxOffice}
              error={Boolean(errors.taxOffice)}
              helperText={errors.taxOffice}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Vergi Numarası"
              name="taxNumber"
              value={fields.taxNumber}
              error={Boolean(errors.taxNumber)}
              helperText={errors.taxNumber}
              onChange={(e) =>
                patch({
                  taxNumber: e.target.value.replace(/\D/g, "").slice(0, 11),
                })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="MERSİS"
              name="mersis"
              value={fields.mersis}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ticaret Sicil No"
              name="tradeRegistryNo"
              value={fields.tradeRegistryNo}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IBAN"
              name="iban"
              value={fields.iban}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ruhsat / Lisans No"
              name="licenceNo"
              value={fields.licenceNo}
              onChange={handleField}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Çalışma Saatleri (özet)"
              name="workingHours"
              value={fields.workingHours}
              onChange={handleField}
              helperText="Detaylı saatler için kurulum sihirbazını kullanın."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Footer Yazısı"
              name="footer"
              value={fields.footer}
              onChange={handleField}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Button variant="outlined" onClick={() => fileRef.current?.click()}>
                Logo Yükle
              </Button>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  handleLogo(e.target.files);
                  e.target.value = "";
                }}
              />
              {fields.logo && (
                <Button color="inherit" onClick={() => patch({ logo: "" })}>
                  Logoyu Kaldır
                </Button>
              )}
            </Stack>
            {logoWarning && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {logoWarning}
              </Alert>
            )}
            {fields.logo && (
              <Box mt={2}>
                <Box
                  component="img"
                  src={fields.logo}
                  alt="Klinik logosu"
                  sx={{ maxHeight: 80, maxWidth: 200, objectFit: "contain" }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSaveClick}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
