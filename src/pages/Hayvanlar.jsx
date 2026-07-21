import { useEffect, useMemo, useState } from "react";
import { MenuItem, TextField } from "@mui/material";

import Drawer from "../components/Drawer";
import SearchBar from "../components/SearchBar";
import AnimalForm from "../components/forms/AnimalForm";
import AnimalTable from "../components/tables/AnimalTable";
import EmptyState from "../components/EmptyState";
import VaccineScheduleDialog from "../components/VaccineScheduleDialog";

import "../styles/customer.css";

import { getCustomers } from "../services/customerService";

import {
  getAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
} from "../services/animalService";

import {
  prepareVaccineSchedule,
  applyVaccineScheduleProposal,
  schedulePrepareErrorMessage,
} from "../services/vaccineService";

import {
  OWNER_TYPE_FILTER_OPTIONS,
  matchesOwnerTypeFilter,
} from "../utils/ownerType";

import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Hayvanlar() {
  const confirm = useConfirm();
  const { notify } = useNotification();

  const [animals, setAnimals] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [newFormKey, setNewFormKey] = useState(0);

  const [scheduleProposal, setScheduleProposal] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [animalsData, customersData] = await Promise.all([
      getAnimals(),
      getCustomers(),
    ]);

    setAnimals(animalsData);
    setCustomers(customersData);
  }

  const filteredAnimals = useMemo(() => {
    const query = search.toLowerCase().trim();

    return animals.filter((animal) => {
      if (!matchesOwnerTypeFilter(animal, ownerTypeFilter)) return false;

      if (!query) return true;

      const owner = customers.find(
        (c) => String(c.id) === String(animal.ownerId)
      );

      const ownerName = owner
        ? `${owner.ad} ${owner.soyad}`
        : animal.ownerName || "";

      const text = `
        ${animal.name}
        ${animal.species}
        ${animal.breed}
        ${animal.gender}
        ${animal.microchipNo}
        ${animal.weight}
        ${animal.ownerType || ""}
        ${ownerName}
        ${owner?.telefon || ""}
      `.toLowerCase();

      return text.includes(query);
    });
  }, [animals, customers, search, ownerTypeFilter]);

  /**
   * Aşı takvimi akışı: mevcut otomatik takvim uyarısı → önizleme diyaloğu.
   */
  async function offerVaccineSchedule(animal) {
    const prepared = await prepareVaccineSchedule(animal);

    if (!prepared.ok) {
      notify(schedulePrepareErrorMessage(prepared.reason), "info");
      return;
    }

    if (prepared.hasExistingAutoSchedule) {
      const recreate = await confirm({
        title: "Aşı takvimi mevcut",
        message:
          "Bu hayvan için daha önce bir aşı takvimi oluşturulmuş. Tekrar oluşturmak ister misiniz? Aynı aşı / tarih / doz kayıtları tekrar eklenmez; yalnızca eksikler oluşturulur.",
        confirmText: "Tekrar Oluştur",
        cancelText: "Vazgeç",
        confirmColor: "warning",
      });

      if (!recreate) return;
    }

    if (
      !prepared.proposal.vaccines.length &&
      prepared.proposal.skippedVaccines?.length
    ) {
      notify(
        "Eklenecek yeni aşı yok; şablondaki tüm aşılar zaten kayıtlı.",
        "info"
      );
      return;
    }

    setScheduleProposal(prepared.proposal);
    setScheduleDialogOpen(true);
  }

  async function handleAddAnimal(animal) {
    const saved = await addAnimal(animal);
    await loadData();
    notify("Hayvan eklendi.");

    const wantSchedule = await confirm({
      title: "Hayvan kaydedildi",
      message: `${saved.name} için otomatik aşı takvimi oluşturulsun mu?`,
      confirmText: "Aşı Takvimi Oluştur",
      cancelText: "Tamam",
      confirmColor: "success",
    });

    if (wantSchedule) {
      await offerVaccineSchedule(saved);
    }

    return saved;
  }

  async function handleUpdateAnimal(animal) {
    await updateAnimal(animal);
    await loadData();
    notify("Hayvan güncellendi.");
  }

  async function handleDeleteAnimal(id) {
    const confirmed = await confirm(
      "Hayvan ve ilişkili randevu, aşı, muayene ve fatura kayıtları silinsin mi?"
    );

    if (!confirmed) return;

    await deleteAnimal(id);
    await loadData();
    notify("Hayvan silindi.");
  }

  function handleEditAnimal(id) {
    const animal = animals.find((a) => String(a.id) === String(id));

    if (!animal) return;

    setSelectedAnimal(animal);
    setIsEditing(true);
    setDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedAnimal(null);
    setIsEditing(false);
  }

  function handleScheduleCancel() {
    if (creatingSchedule) return;

    setScheduleDialogOpen(false);
    setScheduleProposal(null);
  }

  async function handleScheduleConfirm() {
    if (!scheduleProposal || creatingSchedule) return;

    setCreatingSchedule(true);

    try {
      const result = await applyVaccineScheduleProposal(scheduleProposal);

      if (result.createdVaccines === 0) {
        notify("Yeni aşı oluşturulmadı; kayıtlar zaten mevcut.", "info");
      } else {
        notify(
          `${result.createdVaccines} aşı ve ${result.createdAppointments} randevu oluşturuldu.`
        );
      }
    } finally {
      setCreatingSchedule(false);
      setScheduleDialogOpen(false);
      setScheduleProposal(null);
    }
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Hayvanlar</h1>
          <p>Kayıtlı hayvanlar</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setSelectedAnimal(null);
            setIsEditing(false);
            setNewFormKey((key) => key + 1);
            setDrawerOpen(true);
          }}
        >
          + Yeni Hayvan
        </button>
      </div>

      <SearchBar label="Hayvan Ara..." value={search} onChange={setSearch} />

      <TextField
        select
        size="small"
        label="Sahip Tipi"
        value={ownerTypeFilter}
        onChange={(e) => setOwnerTypeFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 200 }}
      >
        {OWNER_TYPE_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <div className="customer-card">
        {filteredAnimals.length === 0 ? (
          <EmptyState
            message={
              animals.length === 0
                ? "Henüz kayıtlı hayvan yok. + Yeni Hayvan ile ekleyebilirsiniz."
                : "Arama kriterine uygun hayvan bulunamadı."
            }
          />
        ) : (
          <AnimalTable
            animals={filteredAnimals}
            customers={customers}
            onEdit={handleEditAnimal}
            onDelete={handleDeleteAnimal}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={isEditing ? "Hayvan Düzenle" : "Yeni Hayvan"}
        onClose={handleCloseDrawer}
      >
        <AnimalForm
          key={selectedAnimal?.id || `new-${newFormKey}`}
          animal={selectedAnimal}
          customers={customers}
          isEditing={isEditing}
          onSave={async (animal) => {
            if (isEditing) {
              await handleUpdateAnimal(animal);
            } else {
              await handleAddAnimal(animal);
            }

            handleCloseDrawer();
          }}
        />
      </Drawer>

      <VaccineScheduleDialog
        open={scheduleDialogOpen}
        proposal={scheduleProposal}
        creating={creatingSchedule}
        onConfirm={handleScheduleConfirm}
        onCancel={handleScheduleCancel}
      />
    </div>
  );
}

export default Hayvanlar;
