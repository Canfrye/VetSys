import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  Grid,
  Button,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
} from "@mui/material";
import {
  getSettings,
  saveSettings,
  importLocalDataToApi,
  subscribeSettings,
} from "../services/settingsService";
import {
  createSystemBackup,
  pickAndInspectBackup,
  inspectBackupFile,
  applyInspectedBackup,
} from "../services/backupService";
import {
  APP_VERSION,
  formatBytes,
  formatDisplayDate,
} from "../utils/vsbBackup";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import VaccineTemplatesEditor from "../components/settings/VaccineTemplatesEditor";
import ServiceFeesEditor from "../components/settings/ServiceFeesEditor";
import ClinicIdentityCard from "../components/setup/ClinicIdentityCard";
import SystemStatusCard from "../components/settings/SystemStatusCard";
import { validateVaccineTemplates } from "../utils/vaccineTemplates";
import { validateServiceFees } from "../utils/serviceCatalog";
import { createAuditLog } from "../services/auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../utils/auditLog";
import { USE_API } from "../config/api";
import { normalizeApiErrorMessage } from "../utils/apiError";

import "../styles/customer.css";

function Settings() {
  const fileInputRef = useRef(null);
  const { notify } = useNotification();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    clinicName: "",
    clinicOwner: "",
    veterinarian: "",
    phone: "",
    email: "",
    website: "",
    taxOffice: "",
    taxNumber: "",
    mersis: "",
    tradeRegistryNo: "",
    iban: "",
    licenceNo: "",
    city: "",
    district: "",
    logo: "",
    address: "",
    workingHours: "",
    footer: "",
    vaccineTemplates: undefined,
    serviceFees: undefined,
    lastBackupMeta: null,
  });

  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setSettings(await getSettings());
    }

    loadSettings();
    return subscribeSettings(() => {
      loadSettings();
    });
  }, []);

  async function handleIdentitySave(nextSettings) {
    setIdentitySaving(true);
    try {
      const saved = await saveSettings(nextSettings);
      setSettings(saved);

      await createAuditLog({
        module: AUDIT_MODULES.SETTINGS,
        action: AUDIT_ACTIONS.CHANGED,
        description: "Klinik bilgileri güncellendi",
      });

      notify("Klinik bilgileri kaydedildi.");
    } finally {
      setIdentitySaving(false);
    }
  }

  function handleTemplatesChange(vaccineTemplates) {
    setSettings({
      ...settings,
      vaccineTemplates,
    });
  }

  function handleServiceFeesChange(serviceFees) {
    setSettings({
      ...settings,
      serviceFees,
    });
  }

  async function handleSave() {
    const templatesCheck = validateVaccineTemplates(settings.vaccineTemplates);

    if (!templatesCheck.valid) {
      notify(templatesCheck.error, "error");
      return;
    }

    const feesCheck = validateServiceFees(settings.serviceFees);

    if (!feesCheck.valid) {
      notify(feesCheck.error, "error");
      return;
    }

    const saved = await saveSettings({
      ...settings,
      vaccineTemplates: templatesCheck.data,
      serviceFees: feesCheck.data,
    });
    setSettings(saved);

    await createAuditLog({
      module: AUDIT_MODULES.SETTINGS,
      action: AUDIT_ACTIONS.CHANGED,
      description: "Ayarlar değiştirildi",
    });

    notify("Ayarlar kaydedildi.");
  }

  async function handleCreateBackup() {
    setBackupBusy(true);
    try {
      const result = await createSystemBackup({ user });

      if (result?.canceled) {
        notify("Yedekleme iptal edildi.");
        return;
      }

      const refreshed = await getSettings();
      setSettings(refreshed);

      await createAuditLog({
        module: AUDIT_MODULES.SETTINGS,
        action: AUDIT_ACTIONS.SAVE,
        description: "Sistem yedeği alındı (.vsb)",
      });

      notify("Yedek başarıyla oluşturuldu.");
    } catch (error) {
      notify(error?.message || "Yedek oluşturulamadı.", "error");
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportLocalToApi() {
    try {
      await importLocalDataToApi();
      notify("Local veriler PostgreSQL'e aktarıldı.");
    } catch (error) {
      notify(normalizeApiErrorMessage(error), "error");
    }
  }

  async function openRestorePreview(inspected) {
    if (inspected?.canceled) {
      return;
    }

    if (!inspected?.ok) {
      notify(inspected?.error || "Yedek dosyası okunamadı.", "error");
      return;
    }

    setRestorePreview(inspected);
  }

  async function handleRestoreClick() {
    const picked = await pickAndInspectBackup();

    if (picked?.needsBrowserPicker) {
      fileInputRef.current?.click();
      return;
    }

    await openRestorePreview(picked);
  }

  async function handleBrowserFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const inspected = await inspectBackupFile(file);
      await openRestorePreview(inspected);
    } catch (error) {
      notify(error?.message || "Yedek dosyası okunamadı.", "error");
    }
  }

  async function handleConfirmRestore() {
    if (!restorePreview?.ok) return;

    setRestoreBusy(true);
    try {
      await applyInspectedBackup(restorePreview, { user });
      setRestorePreview(null);

      await createAuditLog({
        module: AUDIT_MODULES.SETTINGS,
        action: AUDIT_ACTIONS.CHANGED,
        description: "Yedekten geri yükleme yapıldı",
        user,
      });

      const isElectron = Boolean(window.vetsysDesktop?.isElectron);

      if (isElectron && window.vetsysDesktop.relaunch) {
        notify("Yedek geri yüklendi. Uygulama yeniden başlatılıyor…");
        setTimeout(() => {
          window.vetsysDesktop.relaunch();
        }, 600);
        return;
      }

      notify(
        "Yedek geri yüklendi. Güvenlik için yeniden giriş yapmanız gerekiyor."
      );
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      notify(error?.message || "Geri yükleme başarısız.", "error");
    } finally {
      setRestoreBusy(false);
    }
  }

  const lastMeta = settings.lastBackupMeta;
  const summary = restorePreview?.summary;

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Ayarlar</h1>
          <p>Klinik bilgilerini düzenleyin</p>
        </div>
      </div>

      <ClinicIdentityCard
        settings={settings}
        onChange={setSettings}
        onSave={handleIdentitySave}
        saving={identitySaving}
      />

      <SystemStatusCard />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Aşı Takvimi Şablonları
          </Typography>

          <Typography color="text.secondary" mb={2}>
            Yeni hayvan eklerken önerilen otomatik aşı takvimi bu şablonlardan
            üretilir. Mevcut aşı ve randevu kayıtları etkilenmez.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <VaccineTemplatesEditor
            value={settings.vaccineTemplates}
            onChange={handleTemplatesChange}
          />

          <Button variant="contained" sx={{ mt: 1 }} onClick={handleSave}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Hizmet Ücretleri
          </Typography>

          <Typography color="text.secondary" mb={2}>
            Muayene ve klinik hizmetlerin varsayılan ücretleri. Faturalarda
            otomatik doldurulur; kullanıcı her zaman değiştirebilir.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <ServiceFeesEditor
            value={settings.serviceFees}
            onChange={handleServiceFeesChange}
          />

          <Button variant="contained" sx={{ mt: 1 }} onClick={handleSave}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Veri Yönetimi
          </Typography>

          <Typography color="text.secondary" mb={2}>
            Tüm klinik verilerini tek bir .vsb (VetSys Backup) dosyası olarak
            yedekleyin veya geri yükleyin. Geri yüklemeden önce otomatik güvenlik
            yedeği alınır.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="body2">
              Son yedek tarihi:{" "}
              <strong>
                {lastMeta?.createdAt
                  ? formatDisplayDate(lastMeta.createdAt)
                  : "Henüz yedek alınmadı"}
              </strong>
            </Typography>
            <Typography variant="body2">
              Dosya boyutu:{" "}
              <strong>
                {lastMeta?.sizeBytes != null
                  ? formatBytes(lastMeta.sizeBytes)
                  : "—"}
              </strong>
            </Typography>
            <Typography variant="body2">
              VetSys sürümü: <strong>{APP_VERSION}</strong>
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                onClick={handleCreateBackup}
                disabled={backupBusy}
              >
                {backupBusy ? "Yedekleniyor…" : "Yedek Al"}
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleRestoreClick}
                disabled={restoreBusy}
              >
                Yedekten Geri Yükle
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".vsb,.json,application/json,application/octet-stream"
                hidden
                onChange={handleBrowserFile}
              />
            </Grid>

            {USE_API && (
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleImportLocalToApi}
                >
                  Local Veriyi Aktar
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(restorePreview)}
        onClose={() => !restoreBusy && setRestorePreview(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yedekten Geri Yükleme</DialogTitle>
        <DialogContent dividers>
          {summary && (
            <Stack spacing={1.25}>
              <Typography>
                Klinik: <strong>{summary.clinicName}</strong>
              </Typography>
              <Typography>
                Tarih: <strong>{summary.date}</strong>
                {summary.time && summary.time !== "—"
                  ? ` ${summary.time}`
                  : ""}
              </Typography>
              <Typography>
                VetSys: <strong>{summary.vetsysVersion}</strong>
              </Typography>
              {summary.kind === "legacy" && (
                <Typography color="warning.main" variant="body2">
                  Bu dosya eski formatta bir yedek. Destekleniyor; yine de
                  içeriği kontrol edin.
                </Typography>
              )}
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">
                  Müşteri: <strong>{summary.counts.customers}</strong>
                </Typography>
                <Typography variant="body2">
                  Hayvan: <strong>{summary.counts.animals}</strong>
                </Typography>
                <Typography variant="body2">
                  Fatura: <strong>{summary.counts.invoices}</strong>
                </Typography>
                <Typography variant="body2">
                  Muayene: <strong>{summary.counts.examinations}</strong>
                </Typography>
                <Typography variant="body2">
                  Aşı: <strong>{summary.counts.vaccines}</strong>
                </Typography>
                <Typography variant="body2">
                  Randevu: <strong>{summary.counts.appointments}</strong>
                </Typography>
              </Box>
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                Onaylarsanız mevcut verilerin üzerine yazılır. Öncesinde otomatik
                güvenlik yedeği alınacaktır.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRestorePreview(null)}
            disabled={restoreBusy}
          >
            İptal
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleConfirmRestore}
            disabled={restoreBusy}
          >
            {restoreBusy ? "Yükleniyor…" : "Geri Yüklemeyi Onayla"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Settings;
