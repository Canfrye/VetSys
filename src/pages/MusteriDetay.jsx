import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Box, Typography, Grid } from "@mui/material";

import CustomerInfoCard from "../components/cards/CustomerInfoCard";
import CustomerStatsCard from "../components/cards/CustomerStatsCard";
import ActivityHistoryCard from "../components/cards/ActivityHistoryCard";
import OwnerAnimalsTable from "../components/tables/OwnerAnimalsTable";
import Drawer from "../components/Drawer";
import AnimalForm from "../components/forms/AnimalForm";
import EmptyState from "../components/EmptyState";
import PageLoading from "../components/PageLoading";

import { getCustomerById } from "../services/customerService";
import {
  getAnimalsByOwner,
  deleteAnimal,
  updateAnimal,
} from "../services/animalService";
import { getAuditLogsByOwner } from "../services/auditLogService";

import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function MusteriDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { notify } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    async function loadCustomerAndAnimals() {
      setLoading(true);

      const [customerData, animalsData, activitiesData] = await Promise.all([
        getCustomerById(id),
        getAnimalsByOwner(id),
        getAuditLogsByOwner(id, user),
      ]);

      setCustomer(customerData || null);
      setAnimals(animalsData);
      setActivities(activitiesData);
      setLoading(false);
    }

    loadCustomerAndAnimals();
  }, [id, user]);

  async function loadAnimals() {
    setAnimals(await getAnimalsByOwner(id));
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedAnimal(null);
  }

  async function handleSave(animal) {
    await updateAnimal({
      ...animal,
      id: selectedAnimal.id,
      createdAt: selectedAnimal.createdAt,
    });

    await loadAnimals();
    handleCloseDrawer();
    notify("Hayvan güncellendi.");
  }

  async function handleDeleteAnimal(animalId) {
    const confirmed = await confirm("Hayvan silinsin mi?");

    if (!confirmed) return;

    await deleteAnimal(animalId);
    await loadAnimals();
    notify("Hayvan silindi.");
  }

  if (loading) {
    return <PageLoading message="Müşteri bilgileri yükleniyor..." />;
  }

  if (!customer) {
    return <EmptyState message="Müşteri bulunamadı." />;
  }

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        noWrap
        title={`${customer.ad} ${customer.soyad}`}
      >
        {customer.ad} {customer.soyad}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <CustomerInfoCard customer={customer} />
        </Grid>

        <Grid item xs={12} md={8}>
          <CustomerStatsCard
            title="Toplam Hayvan"
            value={animals.length}
          />
        </Grid>

        <Grid item xs={12}>
          <ActivityHistoryCard activities={activities} />
        </Grid>

        <Grid item xs={12}>
          {animals.length === 0 ? (
            <EmptyState message="Bu müşteriye kayıtlı hayvan bulunmuyor." />
          ) : (
            <OwnerAnimalsTable
              animals={animals}
              onView={(animalId) =>
                navigate(`/hayvanlar/${animalId}`)
              }
              onEdit={(animal) => {
                setSelectedAnimal(animal);
                setDrawerOpen(true);
              }}
              onDelete={handleDeleteAnimal}
            />
          )}
        </Grid>
      </Grid>

      <Drawer
        open={drawerOpen}
        title="Hayvan Düzenle"
        onClose={handleCloseDrawer}
      >
        <AnimalForm
          key={selectedAnimal?.id || "new"}
          animal={selectedAnimal}
          customers={[customer]}
          isEditing
          onSave={handleSave}
        />
      </Drawer>
    </Box>
  );
}

export default MusteriDetay;
