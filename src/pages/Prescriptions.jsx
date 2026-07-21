import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Drawer from "../components/Drawer";
import PrescriptionForm from "../components/forms/PrescriptionForm";
import PrescriptionTable from "../components/tables/PrescriptionTable";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";
import {
  getPrescriptions,
  savePrescriptionWithStockCheck,
  updatePrescription,
  deletePrescription,
  logPrescriptionPdfDownload,
} from "../services/prescriptionService";
import { getSettings } from "../services/settingsService";
import { generatePrescriptionPdf } from "../utils/prescriptionPdf";
import {
  PRESCRIPTION_DELETE_ROLES,
  PRESCRIPTION_WRITE_ROLES,
} from "../utils/roles";
import { todayDateOnly } from "../utils/dateRange";

import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Prescriptions() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canWrite = hasRole(PRESCRIPTION_WRITE_ROLES);
  const canDelete = hasRole(PRESCRIPTION_DELETE_ROLES);

  const [prescriptions, setPrescriptions] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [slotDraft, setSlotDraft] = useState({});
  const [newFormKey, setNewFormKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const draft = location.state?.prescriptionDraft;

    if (!draft || !canWrite) return;

    // Muayene ekranından gelen prefill — effect içinde senkron setState lint'e takılmasın.
    const timer = window.setTimeout(() => {
      setEditingPrescription(null);
      setViewOnly(false);
      setSlotDraft(draft);
      setNewFormKey((key) => key + 1);
      setDrawerOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.state, location.pathname, canWrite, navigate]);

  async function loadData() {
    const [prescriptionsData, animalsData] = await Promise.all([
      getPrescriptions(),
      getAnimals(),
    ]);

    setPrescriptions(prescriptionsData);
    setAnimals(animalsData);
  }

  async function handleSave(prescription) {
    try {
      if (editingPrescription) {
        await updatePrescription({
          ...editingPrescription,
          ...prescription,
        });
        notify("Reçete güncellendi.");
      } else {
        const result = await savePrescriptionWithStockCheck(prescription, {
          userName: user?.fullName || user?.username || "",
          confirmFn: confirm,
        });

        if (!result) {
          notify("Reçete kaydı iptal edildi.", "info");
          return;
        }

        if (result.warnings?.length) {
          notify(result.warnings.join(" "), "warning");
        }

        notify("Reçete oluşturuldu.");
      }

      await loadData();
      handleClose();
    } catch (error) {
      notify(error?.message || "Reçete kaydedilemedi.", "error");
    }
  }

  function handleEdit(prescription) {
    if (!canWrite) {
      handleView(prescription);
      return;
    }

    setEditingPrescription(prescription);
    setViewOnly(false);
    setSlotDraft({});
    setDrawerOpen(true);
  }

  function handleView(prescription) {
    setEditingPrescription(prescription);
    setViewOnly(true);
    setSlotDraft({});
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    if (!canDelete) return;

    const confirmed = await confirm("Reçete silinsin mi?");

    if (!confirmed) return;

    await deletePrescription(id);
    await loadData();
    notify("Reçete silindi.");
  }

  async function handleDownloadPdf(prescription) {
    const settings = await getSettings();
    generatePrescriptionPdf(prescription, settings);
    await logPrescriptionPdfDownload(prescription);
  }

  function handleNew() {
    if (!canWrite) return;

    setEditingPrescription(null);
    setViewOnly(false);
    setSlotDraft({});
    setNewFormKey((key) => key + 1);
    setDrawerOpen(true);
  }

  function handleClose() {
    setDrawerOpen(false);
    setEditingPrescription(null);
    setViewOnly(false);
    setSlotDraft({});
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Reçeteler</h1>
          <p>Klinik reçete kayıtları</p>
        </div>

        {canWrite && (
          <button className="add-btn" onClick={handleNew}>
            + Yeni Reçete
          </button>
        )}
      </div>

      <div className="customer-card">
        {prescriptions.length === 0 ? (
          <EmptyState message="Henüz reçete yok. + Yeni Reçete ile ekleyebilirsiniz." />
        ) : (
          <PrescriptionTable
            prescriptions={prescriptions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownloadPdf={handleDownloadPdf}
            onView={handleView}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={
          viewOnly
            ? "Reçete Detayı"
            : editingPrescription
              ? "Reçete Düzenle"
              : "Yeni Reçete"
        }
        onClose={handleClose}
      >
        <PrescriptionForm
          key={
            editingPrescription?.id ||
            `new-${newFormKey}-${slotDraft.animalId || "blank"}`
          }
          prescription={editingPrescription}
          animals={animals}
          isEditing={!!editingPrescription && !viewOnly}
          readOnly={viewOnly}
          onSave={handleSave}
          initialValues={
            editingPrescription
              ? undefined
              : {
                  date: todayDateOnly(),
                  ...slotDraft,
                }
          }
        />
      </Drawer>
    </div>
  );
}

export default Prescriptions;
