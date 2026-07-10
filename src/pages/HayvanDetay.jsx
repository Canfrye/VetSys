import { useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

import OwnerAnimalsTable from "../components/tables/OwnerAnimalsTable";

import { getAnimalById } from "../services/animalService";
import { getCustomerById } from "../services/customerService";

import { getAnimalExaminations } from "../services/examinationService";
import { getAnimalVaccines } from "../services/vaccineService";
import { getAnimalAppointments } from "../services/appointmentService";

function HayvanDetay() {
  const { id } = useParams();

  const animal = useMemo(
    () => getAnimalById(id),
    [id]
  );

  const owner = useMemo(() => {
    if (!animal) return null;
    return getCustomerById(animal.ownerId);
  }, [animal]);

  const examinations = useMemo(
    () => getAnimalExaminations(id),
    [id]
  );

  const vaccines = useMemo(
    () => getAnimalVaccines(id),
    [id]
  );

  const appointments = useMemo(
    () => getAnimalAppointments(id),
    [id]
  );

  if (!animal) {
    return (
      <Typography variant="h5">
        Hayvan bulunamadı.
      </Typography>
    );
  }

  return (
    <Box>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        {animal.name}
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>

              <Typography variant="h6">
                Hayvan Bilgileri
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography><b>Tür</b></Typography>
              <Typography mb={2}>
                {animal.species}
              </Typography>

              <Typography><b>Irk</b></Typography>
              <Typography mb={2}>
                {animal.breed || "-"}
              </Typography>

              <Typography><b>Cinsiyet</b></Typography>
              <Typography mb={2}>
                {animal.gender || "-"}
              </Typography>

              <Typography><b>Doğum Tarihi</b></Typography>
              <Typography mb={2}>
                {animal.birthDate || "-"}
              </Typography>

              <Typography><b>Renk</b></Typography>
              <Typography mb={2}>
                {animal.color || "-"}
              </Typography>

              <Typography><b>Kilo</b></Typography>
              <Typography mb={2}>
                {animal.weight || "-"} kg
              </Typography>

              <Typography><b>Mikroçip</b></Typography>
              <Typography>
                {animal.microchipNo || "-"}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>

              <Typography variant="h6">
                Sahip Bilgileri
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography mb={1}>
                <b>Ad Soyad:</b>{" "}
                {owner
                  ? `${owner.ad} ${owner.soyad}`
                  : "-"}
              </Typography>

              <Typography mb={1}>
                <b>Telefon:</b>{" "}
                {owner?.telefon || "-"}
              </Typography>

              <Typography mb={1}>
                <b>E-Posta:</b>{" "}
                {owner?.email || "-"}
              </Typography>

              <Typography>
                <b>Adres:</b>{" "}
                {owner?.adres || "-"}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                mb={2}
              >
                Muayene Geçmişi
              </Typography>

              {examinations.length === 0 ? (
                <Typography>
                  Muayene kaydı bulunmuyor.
                </Typography>
              ) : (
                <OwnerAnimalsTable
                  animals={examinations}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )}

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>

              <Typography variant="h6">
                Aşı Geçmişi
              </Typography>

              <Divider sx={{ my: 2 }} />

              {vaccines.length === 0 ? (
                <Typography>
                  Aşı kaydı bulunmuyor.
                </Typography>
              ) : (
                vaccines.map((vaccine) => (
                  <Box
                    key={vaccine.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: "1px solid #ddd",
                      borderRadius: 2,
                    }}
                  >
                    <Typography fontWeight="bold">
                      {vaccine.vaccineName}
                    </Typography>

                    <Typography>
                      Uygulama:
                      {" "}
                      {vaccine.applicationDate}
                    </Typography>

                    <Typography>
                      Sonraki Doz:
                      {" "}
                      {vaccine.nextDoseDate}
                    </Typography>
                  </Box>
                ))
              )}

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>

              <Typography variant="h6">
                Randevu Geçmişi
              </Typography>

              <Divider sx={{ my: 2 }} />

              {appointments.length === 0 ? (
                <Typography>
                  Randevu bulunmuyor.
                </Typography>
              ) : (
                appointments.map((appointment) => (
                  <Box
                    key={appointment.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: "1px solid #ddd",
                      borderRadius: 2,
                    }}
                  >
                    <Typography fontWeight="bold">
                      {appointment.reason}
                    </Typography>

                    <Typography>
                      Tarih:
                      {" "}
                      {appointment.appointmentDate}
                    </Typography>

                    <Typography>
                      Durum:
                      {" "}
                      {appointment.status}
                    </Typography>
                  </Box>
                ))
              )}

            </CardContent>
          </Card>
        </Grid>

      </Grid>

    </Box>
  );
}

export default HayvanDetay;