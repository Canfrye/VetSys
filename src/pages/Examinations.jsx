import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Drawer from "../components/Drawer";
import ExaminationForm from "../components/forms/ExaminationForm";
import InvoiceForm from "../components/forms/InvoiceForm";
import ExaminationTable from "../components/tables/ExaminationTable";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import { getAnimals, getAnimalById } from "../services/animalService";
import {
  getExaminations,
  addExamination,
  updateExamination,
  deleteExamination,
} from "../services/examinationService";
import { getAnimalVaccines } from "../services/vaccineService";
import { getPrescriptionsByAnimal } from "../services/prescriptionService";
import { getStock } from "../services/stockService";
import { getSettings } from "../services/settingsService";
import { addInvoice, logInvoiceDraftCreated } from "../services/invoiceService";
import { buildClinicalInvoiceDraft } from "../utils/invoiceDraft";
import { toDateOnly, todayDateOnly } from "../utils/dateRange";
import { INVOICE_WRITE_ROLES } from "../utils/roles";

import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Examinations() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canWriteInvoice = hasRole(INVOICE_WRITE_ROLES);

  const [examinations, setExaminations] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [newFormKey, setNewFormKey] = useState(0);

  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const [invoiceFormKey, setInvoiceFormKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [examinationsData, animalsData] = await Promise.all([
      getExaminations(),
      getAnimals(),
    ]);

    setExaminations(examinationsData);
    setAnimals(animalsData);
  }

  async function handleSave(exam) {
    if (editingExam) {
      await updateExamination({
        ...editingExam,
        ...exam,
      });
      notify("Muayene kaydı güncellendi.");
    } else {
      await addExamination(exam);
      notify("Muayene kaydı eklendi.");
    }

    await loadData();
    handleClose();
  }

  function handleEdit(exam) {
    setEditingExam(exam);
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    const confirmed = await confirm("Muayene silinsin mi?");

    if (!confirmed) return;

    await deleteExamination(id);
    await loadData();
    notify("Muayene kaydı silindi.");
  }

  function handleCreatePrescription(exam) {
    navigate("/receteler", {
      state: {
        prescriptionDraft: {
          animalId: exam.animalId,
          animalName: exam.animalName,
          ownerId: exam.ownerId,
          ownerName: exam.ownerName,
          veterinarian: exam.veterinarian || "",
          examinationId: exam.id,
          examinationDate: exam.examinationDate || "",
          diagnosis: exam.diagnosis || "",
          date: todayDateOnly(),
        },
      },
    });
  }

  async function handleCreateInvoice(exam) {
    if (!canWriteInvoice) return;

    const examDate = exam.examinationDate
      ? toDateOnly(exam.examinationDate)
      : null;

    const [animal, vaccines, prescriptions, stockItems, settings] =
      await Promise.all([
        getAnimalById(exam.animalId),
        getAnimalVaccines(exam.animalId),
        getPrescriptionsByAnimal(exam.animalId),
        getStock(),
        getSettings(),
      ]);

    const relatedVaccines = examDate
      ? vaccines.filter((v) => toDateOnly(v.applicationDate) === examDate)
      : vaccines;

    const relatedPrescriptions = examDate
      ? prescriptions.filter((p) => toDateOnly(p.date) === examDate)
      : prescriptions;

    const draft = buildClinicalInvoiceDraft({
      animal: animal || {
        id: exam.animalId,
        name: exam.animalName,
        ownerId: exam.ownerId,
        ownerName: exam.ownerName,
      },
      examination: exam,
      vaccines: relatedVaccines,
      prescriptions: relatedPrescriptions,
      stockItems,
      settings,
    });

    setInvoiceDraft(draft);
    setInvoiceFormKey((k) => k + 1);
    setInvoiceDrawerOpen(true);
    await logInvoiceDraftCreated(draft);
    notify("Taslak fatura hazır. Kaydetmeden önce kontrol edin.", "info");
  }

  async function handleInvoiceSave(form) {
    const { isDraftPreview, ...payload } = form;
    void isDraftPreview;

    await addInvoice(payload);
    setInvoiceDrawerOpen(false);
    setInvoiceDraft(null);
    notify("Fatura eklendi.");
  }

  function handleClose() {
    setDrawerOpen(false);
    setEditingExam(null);
  }

  const filteredExaminations = useMemo(() => {
    const text = search.toLowerCase();

    return examinations.filter((exam) =>
      [
        exam.animalName,
        exam.ownerName,
        exam.veterinarian,
        exam.diagnosis,
        exam.generalCondition,
        exam.examType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [search, examinations]);

  return (
    <div className="customer-page">

      <div className="customer-header">
        <div>
          <h1>Muayeneler</h1>
          <p>Kayıtlı muayeneler</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setEditingExam(null);
            setNewFormKey((key) => key + 1);
            setDrawerOpen(true);
          }}
        >
          + Yeni Muayene
        </button>
      </div>

      <div className="customer-card">

        <input
          className="search-input"
          placeholder="Hayvan, sahip, veteriner veya tanı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredExaminations.length === 0 ? (
          <EmptyState
            message={
              examinations.length === 0
                ? "Henüz kayıtlı muayene yok. + Yeni Muayene ile ekleyebilirsiniz."
                : "Arama kriterine uygun muayene bulunamadı."
            }
          />
        ) : (
          <ExaminationTable
            examinations={filteredExaminations}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreatePrescription={handleCreatePrescription}
            onCreateInvoice={canWriteInvoice ? handleCreateInvoice : undefined}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editingExam ? "Muayene Düzenle" : "Yeni Muayene"}
        onClose={handleClose}
      >
        <ExaminationForm
          key={editingExam?.id || `new-${newFormKey}`}
          examination={editingExam}
          animals={animals}
          isEditing={!!editingExam}
          onSave={handleSave}
        />
      </Drawer>

      <Drawer
        open={invoiceDrawerOpen}
        title="Taslak Fatura Önizleme"
        onClose={() => {
          setInvoiceDrawerOpen(false);
          setInvoiceDraft(null);
        }}
      >
        {invoiceDraft && (
          <InvoiceForm
            key={`exam-invoice-${invoiceFormKey}`}
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

export default Examinations;
