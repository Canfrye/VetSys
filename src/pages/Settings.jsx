import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import {
  getSettings,
  saveSettings,
} from "../services/settingsService";

function Settings() {
  const [settings, setSettings] = useState({
    clinicName: "",
    veterinarian: "",
    phone: "",
    email: "",
    website: "",
    taxOffice: "",
    taxNumber: "",
    iban: "",
    licenceNo: "",
    city: "",
    district: "",
    logo: "",
    address: "",
    workingHours: "",
    footer: "",
  });

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function handleChange(e) {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  }

  function handleSave() {
    saveSettings(settings);
    alert("Ayarlar kaydedildi.");
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Ayarlar</h1>
          <p>Klinik bilgilerini düzenleyin</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Klinik Adı"
                name="clinicName"
                value={settings.clinicName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Veteriner"
                name="veterinarian"
                value={settings.veterinarian}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-Posta"
                name="email"
                value={settings.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Adres"
                name="address"
                value={settings.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Web Sitesi"
                name="website"
                value={settings.website}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vergi Dairesi"
                name="taxOffice"
                value={settings.taxOffice}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vergi No"
                name="taxNumber"
                value={settings.taxNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Çalışma Saatleri"
                name="workingHours"
                value={settings.workingHours}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Footer Yazısı"
                name="footer"
                value={settings.footer}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="İl"
                name="city"
                value={settings.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="İlçe"
                name="district"
                value={settings.district}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IBAN"
                name="iban"
                value={settings.iban}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ruhsat / Lisans No"
                name="licenceNo"
                value={settings.licenceNo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Logo (URL)"
                name="logo"
                value={settings.logo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSave}
              >
                Kaydet
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;