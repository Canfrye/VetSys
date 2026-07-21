import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";
import VaccineForm from "../components/forms/VaccineForm";
import InvoiceForm from "../components/forms/InvoiceForm";
import VaccineTable from "../components/tables/VaccineTable";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";

import {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
} from "../services/vaccineService";

import { addInvoice, logInvoiceDraftCreated } from "../services/invoiceService";
import { prepareVaccineCompletionInvoiceOffer } from "../utils/vaccineInvoiceOffer";
import { INVOICE_WRITE_ROLES } from "../utils/roles";

import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Vaccines() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const canWriteInvoice = hasRole(INVOICE_WRITE_ROLES);

  const [vaccines, setVaccines] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingVaccine, setEditingVaccine] =
    useState(null);

  const [newFormKey, setNewFormKey] = useState(0);

  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const [invoiceFormKey, setInvoiceFormKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [vaccinesData, animalsData] = await Promise.all([
      getVaccines(),
      getAnimals(),
    ]);

    setVaccines(vaccinesData);
    setAnimals(animalsData);
  }

  async function maybeOfferInvoiceDraft(savedVaccine, previousStatus) {
    if (!canWriteInvoice || !savedVaccine) return;
    if (savedVaccine.status !== "Tamamlandı") return;
    if (previousStatus === "Tamamlandı") return;

    const offer = await prepareVaccineCompletionInvoiceOffer(savedVaccine);
    if (!offer?.draft) return;

    setInvoiceDraft(offer.draft);
    setInvoiceFormKey((k) => k + 1);
    setInvoiceDrawerOpen(true);
    await logInvoiceDraftCreated(offer.draft);
    notify("Aşı uygulaması için fatura taslağı oluşturuldu.", "info");
  }

  async function handleSave(vaccine) {
    if (editingVaccine) {
      const previousStatus = editingVaccine.status;
      const saved = await updateVaccine({
        ...editingVaccine,
        ...vaccine,
      });
      notify("Aşı kaydı güncellendi.");
      setEditingVaccine(null);
      setDrawerOpen(false);
      await loadData();
      await maybeOfferInvoiceDraft(saved, previousStatus);
      return;
    }

    const saved = await addVaccine(vaccine);
    notify("Aşı kaydı eklendi.");
    setEditingVaccine(null);
    setDrawerOpen(false);
    await loadData();
    await maybeOfferInvoiceDraft(saved, "");
  }

  function handleEdit(vaccine) {
    setEditingVaccine(vaccine);
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    const confirmed = await confirm("Aşı silinsin mi?");

    if (!confirmed) return;

    await deleteVaccine(id);

    await loadData();
    notify("Aşı kaydı silindi.");
  }

  function handleClose() {
    setEditingVaccine(null);
    setDrawerOpen(false);
  }

  async function handleInvoiceSave(form) {
    const { isDraftPreview, ...payload } = form;
    void isDraftPreview;

    await addInvoice(payload);
    setInvoiceDrawerOpen(false);
    setInvoiceDraft(null);
    notify("Fatura eklendi.");
  }

  return (
    <div className="customer-page">

      <div className="customer-header">
        <div>
          <h1>Aşılar</h1>
          <p>Kayıtlı aşılar</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setEditingVaccine(null);
            setNewFormKey((key) => key + 1);
            setDrawerOpen(true);
          }}
        >
          + Yeni Aşı
        </button>
      </div>

      <div className="customer-card">
        {vaccines.length === 0 ? (
          <EmptyState message="Henüz kayıtlı aşı yok. + Yeni Aşı ile ekleyebilirsiniz." />
        ) : (
          <VaccineTable
            vaccines={vaccines}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={
          editingVaccine
            ? "Aşı Düzenle"
            : "Yeni Aşı"
        }
        onClose={handleClose}
      >
        <VaccineForm
          key={editingVaccine?.id || `new-${newFormKey}`}
          vaccine={editingVaccine}
          animals={animals}
          isEditing={!!editingVaccine}
          onSave={handleSave}
        />
      </Drawer>

      <Drawer
        open={invoiceDrawerOpen}
        title="Aşı uygulaması için fatura taslağı oluşturuldu."
        onClose={() => {
          setInvoiceDrawerOpen(false);
          setInvoiceDraft(null);
        }}
      >
        {invoiceDraft && (
          <InvoiceForm
            key={`vaccine-invoice-${invoiceFormKey}`}
            invoice={invoiceDraft}
            animals={animals}
            isEditing={false}
            onSave={handleInvoiceSave}
          />
        )}
      </Drawer>

    </div>
  );
}

export default Vaccines;
