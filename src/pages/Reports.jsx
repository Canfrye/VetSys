import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
} from "@mui/material";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getCustomers, getCustomerCount } from "../services/customerService";
import {
  getAnimals,
  getAnimalCount,
  getSpeciesStatistics,
} from "../services/animalService";

import {
  getAppointments,
  getTodayAppointments,
} from "../services/appointmentService";

import {
  getVaccines,
  getTodayVaccines,
} from "../services/vaccineService";

import {
  getExaminations,
  getExaminationCount,
  getTodayExaminations,
  getUpcomingControls,
  getAverageWeight,
  getMostCommonDiagnosis,
} from "../services/examinationService";

import {
  getCriticalStock,
} from "../services/stockService";

import {
  getSettings,
} from "../services/settingsService";

function Reports() {
  const customerCount = getCustomerCount();
  const animalCount = getAnimalCount();
  const examinationCount = getExaminationCount();
  const todayExaminations = getTodayExaminations();
  const todayAppointments = getTodayAppointments();
  const todayVaccines = getTodayVaccines();
  const upcomingControls = getUpcomingControls();
  const criticalStock = getCriticalStock();
  const species = getSpeciesStatistics();
  const avgWeight = getAverageWeight();
  const diagnosis = getMostCommonDiagnosis();

  function exportPDF() {
    const doc = new jsPDF();
    const settings = getSettings();

    doc.setFontSize(20);
    doc.text(settings.clinicName || "Klinik Raporu", 14, 20);

    doc.setFontSize(12);
    doc.text("Veteriner: " + (settings.veterinarian || "-"), 14, 30);
    doc.text("Telefon: " + (settings.phone || "-"), 14, 37);
    doc.text("E-Posta: " + (settings.email || "-"), 14, 44);
    doc.text("Adres: " + (settings.address || "-"), 14, 51);
    doc.text("Rapor Tarihi: " + new Date().toLocaleDateString("tr-TR"), 14, 58);

    autoTable(doc, {
      startY: 65,
      head: [["Bilgi", "Değer"]],
      body: [
        ["Toplam Müşteri", customerCount],
        ["Toplam Hayvan", animalCount],
        ["Toplam Muayene", examinationCount],
        ["Bugünkü Muayene", todayExaminations.length],
        ["Bugünkü Randevu", todayAppointments.length],
        ["Bugünkü Aşı", todayVaccines.length],
        ["Yaklaşan Kontrol", upcomingControls.length],
        ["Kritik Stok", criticalStock.length],
        ["Ortalama Kilo", avgWeight + " kg"],
        ["En Sık Tanı", diagnosis],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Hayvan Türü", "Adet"]],
      body: species.map((item) => [
        item.name,
        item.value,
      ]),
    });

    doc.text(
      "Bu rapor VetSys tarafından oluşturulmuştur.",
      14,
      doc.lastAutoTable.finalY + 20
    );

    doc.text(
      settings.veterinarian || "",
      14,
      doc.lastAutoTable.finalY + 30
    );

    doc.save("VetSys-Rapor.pdf");
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Raporlar</h1>
          <p>Klinik istatistikleri ve raporları</p>
        </div>

        <Button
          variant="contained"
          onClick={exportPDF}
        >
          PDF Oluştur
        </Button>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Toplam Müşteri
              </Typography>
              <Typography variant="h3">
                {customerCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Toplam Hayvan
              </Typography>
              <Typography variant="h3">
                {animalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Toplam Muayene
              </Typography>
              <Typography variant="h3">
                {examinationCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Günlük Durum
              </Typography>
              <Typography>
                Bugünkü Muayene : {todayExaminations.length}
              </Typography>
              <Typography>
                Bugünkü Randevu : {todayAppointments.length}
              </Typography>
              <Typography>
                Bugünkü Aşı : {todayVaccines.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Klinik Özeti
              </Typography>
              <Typography>
                Yaklaşan Kontrol : {upcomingControls.length}
              </Typography>
              <Typography>
                Kritik Stok : {criticalStock.length}
              </Typography>
              <Typography>
                Ortalama Kilo : {avgWeight} kg
              </Typography>
              <Typography>
                En Sık Teşhis : {diagnosis}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
              >
                Hayvan Türleri
              </Typography>
              {species.length === 0 ? (
                <Typography>
                  Veri bulunamadı.
                </Typography>
              ) : (
                species.map((item) => (
                  <Typography key={item.name}>
                    {item.name} : {item.value}
                  </Typography>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default Reports;