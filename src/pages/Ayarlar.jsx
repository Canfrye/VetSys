import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  getSettings,
  saveSettings,
} from "../services/settingsService";

function Ayarlar() {
  const [settings, setSettings] = useState({
    clinicName: "",
    veterinarian: "",
    phone: "",
    email: "",
    address: "",
    workingHours: "",
  });

  const [saved, setSaved] = useState(false);

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
    setSaved(true);
  }

  return (
    <Box>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Ayarlar
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} md={8}>

          <Card>

            <CardContent>

              <Typography
                variant="h6"
                mb={3}
              >
                Klinik Bilgileri
              </Typography>

              <Grid container spacing={2}>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Klinik Adı"
                    name="clinicName"
                    value={settings.clinicName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
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

                <Grid item xs={12} md={6}>
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

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Çalışma Saatleri"
                    name="workingHours"
                    value={settings.workingHours}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                  >
                    Kaydet
                  </Button>
                </Grid>

              </Grid>

            </CardContent>

          </Card>

        </Grid>

        <Grid item xs={12} md={4}>

          <Card>

            <CardContent>

              <Typography
                variant="h6"
                mb={2}
              >
                Sistem Bilgisi
              </Typography>

              <Typography>
                VetSys
              </Typography>

              <Typography>
                Sürüm: 1.0
              </Typography>

              <Typography>
                LocalStorage Veri Tabanı
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={2500}
        onClose={() => setSaved(false)}
      >
        <Alert severity="success">
          Ayarlar başarıyla kaydedildi.
        </Alert>
      </Snackbar>

    </Box>
  );
}

export default Ayarlar;