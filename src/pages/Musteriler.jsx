import { useEffect, useState } from "react";

import "../styles/customer.css";

import CustomerTable from "../components/tables/CustomerTable";
import CustomerForm from "../components/forms/CustomerForm";
import AnimalForm from "../components/forms/AnimalForm";
import Drawer from "../components/Drawer";
import SearchBar from "../components/SearchBar";
import EmptyState from "../components/EmptyState";

import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService";
import { addAnimal } from "../services/animalService";
import {
  prepareVaccineSchedule,
  applyVaccineScheduleProposal,
  schedulePrepareErrorMessage,
} from "../services/vaccineService";

import VaccineScheduleDialog from "../components/VaccineScheduleDialog";

import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Musteriler() {
  const confirm = useConfirm();
  const { notify } = useNotification();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [newFormKey, setNewFormKey] = useState(0);

  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false);
  const [animalOwner, setAnimalOwner] = useState(null);
  const [animalFormKey, setAnimalFormKey] = useState(0);

  const [scheduleProposal, setScheduleProposal] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setCustomers(await getCustomers());
  }

  const filteredCustomers = customers.filter((customer) => {
    const text = `
      ${customer.ad || ""}
      ${customer.soyad || ""}
      ${customer.telefon || ""}
      ${customer.email || ""}
      ${customer.adres || ""}
    `
      .toLowerCase()
      .trim();

    return text.includes(search.toLowerCase());
  });

  function openAnimalDrawerForCustomer(customer) {
    setAnimalOwner(customer);
    setAnimalFormKey((key) => key + 1);
    setAnimalDrawerOpen(true);
  }

  async function handleSave(customer) {
    if (selectedCustomer) {
      await updateCustomer({
        ...customer,
        id: selectedCustomer.id,
        createdAt: selectedCustomer.createdAt,
      });
      notify("Müşteri güncellendi.");
      await loadCustomers();
      setDrawerOpen(false);
      setSelectedCustomer(null);
      return;
    }

    const created = await addCustomer(customer);
    notify("Müşteri eklendi.");
    await loadCustomers();

    setDrawerOpen(false);
    setSelectedCustomer(null);

    const addPet = await confirm({
      title: "Müşteri kaydedildi",
      message: `${created.ad} ${created.soyad} için şimdi hayvan kaydı eklemek ister misiniz?`,
      confirmText: "Hayvan Ekle",
      cancelText: "Tamam",
      confirmColor: "success",
    });

    if (addPet) {
      openAnimalDrawerForCustomer(created);
    }
  }

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

  async function handleAnimalSave(animal) {
    if (!animalOwner) return;

    const saved = await addAnimal({
      ...animal,
      ownerId: animalOwner.id,
    });

    setAnimalDrawerOpen(false);
    setAnimalOwner(null);
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

  async function handleDelete(id) {
    const confirmed = await confirm(
      "Müşteri ve tüm hayvanları ile ilişkili kayıtlar silinsin mi?"
    );

    if (!confirmed) return;

    await deleteCustomer(id);
    await loadCustomers();
    notify("Müşteri silindi.");
  }

  function handleEdit(customer) {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Müşteriler</h1>
          <p>Veteriner kliniğinizde kayıtlı müşteriler</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setSelectedCustomer(null);
            setNewFormKey((key) => key + 1);
            setDrawerOpen(true);
          }}
        >
          + Yeni Müşteri
        </button>
      </div>

      <SearchBar
        label="İsim, telefon, e-posta veya adres ara..."
        value={search}
        onChange={setSearch}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 15,
          color: "#666",
          fontSize: 14,
        }}
      >
        <span>
          Toplam Müşteri: <strong>{customers.length}</strong>
        </span>

        <span>
          Gösterilen: <strong>{filteredCustomers.length}</strong>
        </span>
      </div>

      <div className="customer-card">
        {filteredCustomers.length === 0 ? (
          <EmptyState
            message={
              customers.length === 0
                ? "Henüz kayıtlı müşteri yok. + Yeni Müşteri ile ekleyebilirsiniz."
                : "Arama kriterine uygun müşteri bulunamadı."
            }
          />
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={selectedCustomer ? "Müşteri Düzenle" : "Yeni Müşteri"}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCustomer(null);
        }}
      >
        <CustomerForm
          key={selectedCustomer?.id || `new-${newFormKey}`}
          customer={selectedCustomer}
          isEditing={!!selectedCustomer}
          onSave={handleSave}
        />
      </Drawer>

      <Drawer
        open={animalDrawerOpen}
        title={
          animalOwner
            ? `Hayvan Ekle · ${animalOwner.ad} ${animalOwner.soyad}`
            : "Hayvan Ekle"
        }
        onClose={() => {
          setAnimalDrawerOpen(false);
          setAnimalOwner(null);
        }}
      >
        {animalOwner && (
          <AnimalForm
            key={`animal-${animalOwner.id}-${animalFormKey}`}
            customers={[animalOwner]}
            initialOwnerId={animalOwner.id}
            lockOwner
            isEditing={false}
            onSave={handleAnimalSave}
          />
        )}
      </Drawer>

      <VaccineScheduleDialog
        open={scheduleDialogOpen}
        proposal={scheduleProposal}
        creating={creatingSchedule}
        onConfirm={handleScheduleConfirm}
        onCancel={() => {
          if (creatingSchedule) return;
          setScheduleDialogOpen(false);
          setScheduleProposal(null);
        }}
      />
    </div>
  );
}

export default Musteriler;
