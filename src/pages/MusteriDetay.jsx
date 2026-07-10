import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Box, Typography, Grid } from "@mui/material";

import CustomerInfoCard from "../components/cards/CustomerInfoCard";
import CustomerStatsCard from "../components/cards/CustomerStatsCard";
import OwnerAnimalsTable from "../components/tables/OwnerAnimalsTable";

import { getCustomerById } from "../services/customerService";
import {
  getAnimalsByOwner,
  deleteAnimal,
} from "../services/animalService";

function MusteriDetay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const customer = useMemo(() => getCustomerById(id), [id]);

  const animals = useMemo(() => getAnimalsByOwner(id), [id]);

  if (!customer) {
    return (
      <Typography variant="h5">
        Müşteri bulunamadı.
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
        {customer.ad} {customer.soyad}
      </Typography>

      <Grid container spacing={3}>

        {/* Sol taraf */}

        <Grid item xs={12} md={4}>
          <CustomerInfoCard customer={customer} />
        </Grid>

        {/* Sağ taraf */}

        <Grid item xs={12} md={8}>
          <CustomerStatsCard
            title="Toplam Hayvan"
            value={animals.length}
          />
        </Grid>

        {/* Hayvan Listesi */}

        <Grid item xs={12}>
          <OwnerAnimalsTable
            animals={animals}
            onView={(animalId) =>
              navigate(`/hayvanlar/${animalId}`)
            }
            onEdit={(animal) =>
              console.log("Edit:", animal)
            }
            onDelete={(animalId) => {
              if (
                window.confirm(
                  "Hayvan silinsin mi?"
                )
              ) {
                deleteAnimal(animalId);
                window.location.reload();
              }
            }}
          />
        </Grid>

      </Grid>

    </Box>
  );
}

export default MusteriDetay;