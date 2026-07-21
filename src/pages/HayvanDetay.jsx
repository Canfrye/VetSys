import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import MedicationIcon from "@mui/icons-material/Medication";

import AnimalInfoCard from "../components/cards/AnimalInfoCard";
import CustomerInfoCard from "../components/cards/CustomerInfoCard";
import PrescriptionHistoryCard from "../components/cards/PrescriptionHistoryCard";
import ActivityHistoryCard from "../components/cards/ActivityHistoryCard";
import AnimalSummaryCard from "../components/medical/AnimalSummaryCard";
import MedicalTimeline from "../components/medical/MedicalTimeline";
import ClinicalNotesPanel from "../components/medical/ClinicalNotesPanel";
import WeightHistoryChart from "../components/medical/WeightHistoryChart";
import ExamAttachmentsPanel from "../components/medical/ExamAttachmentsPanel";

import Drawer from "../components/Drawer";
import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";

import ExaminationForm from "../components/forms/ExaminationForm";
import VaccineForm from "../components/forms/VaccineForm";
import AppointmentForm from "../components/forms/AppointmentForm";
import InvoiceForm from "../components/forms/InvoiceForm";
import PrescriptionForm from "../components/forms/PrescriptionForm";

import { getAnimalById, updateAnimal, getAnimals } from "../services/animalService";
import { getCustomerById } from "../services/customerService";
import {
  getAnimalExaminations,
  addExamination,
  updateExamination,
} from "../services/examinationService";
import {
  getAnimalVaccines,
  addVaccine,
  prepareVaccineSchedule,
  prepareVaccineScheduleRecreate,
  applyVaccineScheduleProposal,
  deletePendingAutoVaccineSchedule,
  schedulePrepareErrorMessage,
} from "../services/vaccineService";
import {
  getAnimalAppointments,
  addAppointment,
} from "../services/appointmentService";
import {
  getInvoicesByAnimal,
  addInvoice,
  logInvoiceDraftCreated,
} from "../services/invoiceService";
import {
  getPrescriptionsByAnimal,
  savePrescriptionWithStockCheck,
} from "../services/prescriptionService";
import { getPaymentsByAnimal } from "../services/paymentService";
import { getAuditLogsByAnimal } from "../services/auditLogService";
import { getStock } from "../services/stockService";
import { getSettings } from "../services/settingsService";
import { createEmptyPrescriptionItem } from "../utils/prescriptionUtils";
import {
  attachInvoiceBalances,
  isInvoiceCancelled,
  sumPayments,
} from "../utils/paymentUtils";
import { formatCurrency } from "../utils/invoiceCalc";
import { buildVaccineScheduleStatus } from "../utils/vaccineTemplates";
import { buildClinicalInvoiceDraft, getInvoicedVaccineIds } from "../utils/invoiceDraft";
import { toDateOnly } from "../utils/dateRange";
import { PRESCRIPTION_WRITE_ROLES, INVOICE_WRITE_ROLES } from "../utils/roles";
import { requiresCustomerOwner, getAnimalOwnerDisplay } from "../utils/ownerType";
import { prepareVaccineCompletionInvoiceOffer } from "../utils/vaccineInvoiceOffer";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";

import {
  buildAnimalSummary,
  buildMedicalTimeline,
} from "../utils/medicalRecord";
import { generateMedicalRecordPdf } from "../utils/medicalRecordPdf";
import { todayDateOnly } from "../utils/dateRange";
import { useNotification } from "../hooks/useNotification";

import VaccineScheduleDialog from "../components/VaccineScheduleDialog";
import VaccineScheduleStatusCard from "../components/cards/VaccineScheduleStatusCard";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

function buildPrefill(animal) {
  return {
    animalId: animal.id,
    animalName: animal.name,
    ownerId: animal.ownerId,
    ownerName: animal.ownerName || "",
    species: animal.species || "",
  };
}

function HayvanDetay() {
  const { id } = useParams();
  const { notify } = useNotification();
  const confirm = useConfirm();
  const { hasRole, user } = useAuth();
  const canWritePrescription = hasRole(PRESCRIPTION_WRITE_ROLES);
  const canWriteInvoice = hasRole(INVOICE_WRITE_ROLES);

  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState(null);
  const [owner, setOwner] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notesSaving, setNotesSaving] = useState(false);

  const [drawerType, setDrawerType] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [invoiceDraft, setInvoiceDraft] = useState(null);

  const [scheduleProposal, setScheduleProposal] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [scheduleDialogTitle, setScheduleDialogTitle] = useState(
    "Aşı Takvimi Oluştur"
  );
  const [scheduleConfirmLabel, setScheduleConfirmLabel] = useState(
    "Takvimi Oluştur"
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAnimalDetail() {
      setLoading(true);

      const [
        animalData,
        examinationsData,
        vaccinesData,
        appointmentsData,
        invoicesData,
        prescriptionsData,
        paymentsData,
        animalsData,
        activitiesData,
      ] = await Promise.all([
        getAnimalById(id),
        getAnimalExaminations(id),
        getAnimalVaccines(id),
        getAnimalAppointments(id),
        getInvoicesByAnimal(id),
        getPrescriptionsByAnimal(id),
        getPaymentsByAnimal(id),
        getAnimals(),
        getAuditLogsByAnimal(id, user),
      ]);

      if (cancelled) return;

      setAnimal(animalData || null);
      setExaminations(examinationsData);
      setVaccines(vaccinesData);
      setAppointments(appointmentsData);
      setInvoices(invoicesData);
      setPrescriptions(prescriptionsData);
      setPayments(paymentsData);
      setAnimals(animalsData);
      setActivities(activitiesData);

      if (animalData?.ownerId) {
        setOwner((await getCustomerById(animalData.ownerId)) || null);
      } else {
        setOwner(null);
      }

      setLoading(false);
    }

    loadAnimalDetail();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const invoicesWithBalances = useMemo(
    () => attachInvoiceBalances(invoices, payments),
    [invoices, payments]
  );

  const summary = useMemo(
    () =>
      buildAnimalSummary(animal, {
        examinations,
        vaccines,
        appointments,
        invoices: invoicesWithBalances,
      }),
    [animal, examinations, vaccines, appointments, invoicesWithBalances]
  );

  const timeline = useMemo(
    () =>
      buildMedicalTimeline({
        examinations,
        vaccines,
        appointments,
        invoices: invoicesWithBalances,
        prescriptions,
      }),
    [
      examinations,
      vaccines,
      appointments,
      invoicesWithBalances,
      prescriptions,
    ]
  );

  const scheduleStatus = useMemo(
    () =>
      animal
        ? buildVaccineScheduleStatus(animal.id, vaccines, appointments)
        : null,
    [animal, vaccines, appointments]
  );

  const financeSummary = useMemo(() => {
    const remaining = invoicesWithBalances
      .filter((inv) => !isInvoiceCancelled(inv))
      .reduce((sum, inv) => sum + (Number(inv.remainingAmount) || 0), 0);

    return {
      collected: sumPayments(payments),
      remaining: Math.round((remaining + Number.EPSILON) * 100) / 100,
    };
  }, [invoicesWithBalances, payments]);

  async function reloadHistory() {
    const [
      animalData,
      examinationsData,
      vaccinesData,
      appointmentsData,
      invoicesData,
      prescriptionsData,
      paymentsData,
      activitiesData,
    ] = await Promise.all([
      getAnimalById(id),
      getAnimalExaminations(id),
      getAnimalVaccines(id),
      getAnimalAppointments(id),
      getInvoicesByAnimal(id),
      getPrescriptionsByAnimal(id),
      getPaymentsByAnimal(id),
      getAuditLogsByAnimal(id, user),
    ]);

    setAnimal(animalData || null);
    setExaminations(examinationsData);
    setVaccines(vaccinesData);
    setAppointments(appointmentsData);
    setInvoices(invoicesData);
    setPrescriptions(prescriptionsData);
    setPayments(paymentsData);
    setActivities(activitiesData);

    if (animalData?.ownerId) {
      setOwner((await getCustomerById(animalData.ownerId)) || null);
    } else {
      setOwner(null);
    }
  }

  function openQuick(type) {
    if (type === "invoice") {
      setInvoiceDraft(null);
    }
    setDrawerType(type);
    setFormKey((k) => k + 1);
  }

  function closeDrawer() {
    setDrawerType(null);
    setInvoiceDraft(null);
  }

  async function handleCreateClinicalInvoice(examination = null) {
    if (!animal || !canWriteInvoice) return;

    const exam =
      examination ||
      [...examinations].sort(
        (a, b) =>
          new Date(b.examinationDate || 0) - new Date(a.examinationDate || 0)
      )[0] ||
      null;

    const examDate = exam?.examinationDate
      ? toDateOnly(exam.examinationDate)
      : null;

    const billedVaccineIds = getInvoicedVaccineIds(invoices);

    const relatedVaccines = (examDate
      ? vaccines.filter(
          (v) => toDateOnly(v.applicationDate) === examDate
        )
      : vaccines
    ).filter((v) => !billedVaccineIds.has(String(v.id)));

    const relatedPrescriptions = examDate
      ? prescriptions.filter((p) => toDateOnly(p.date) === examDate)
      : prescriptions;

    const [settings, stockItems] = await Promise.all([
      getSettings(),
      getStock(),
    ]);

    const draft = buildClinicalInvoiceDraft({
      animal,
      examination: exam,
      vaccines: relatedVaccines,
      prescriptions: relatedPrescriptions,
      stockItems,
      settings,
    });

    setInvoiceDraft(draft);
    setDrawerType("invoice");
    setFormKey((k) => k + 1);
    await logInvoiceDraftCreated(draft);
    notify("Taslak fatura hazır. Kaydetmeden önce kontrol edin.", "info");
  }

  async function handleSaveNotes(serialized) {
    if (!animal) return;

    setNotesSaving(true);

    try {
      const saved = await updateAnimal({
        ...animal,
        note: serialized,
      });
      setAnimal(saved);
      notify("Klinik notları kaydedildi.");
    } catch {
      notify("Notlar kaydedilemedi.", "error");
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleAddAttachment(exam, attachment) {
    const next = [...(exam.attachments || []), attachment];
    await updateExamination({ ...exam, attachments: next });
    await reloadHistory();
    notify("Dosya eklendi.");
  }

  async function handleRemoveAttachment(exam, attachmentId) {
    const next = (exam.attachments || []).filter(
      (f) => String(f.id) !== String(attachmentId)
    );
    await updateExamination({ ...exam, attachments: next });
    await reloadHistory();
    notify("Dosya silindi.");
  }

  async function handleExamSave(form) {
    await addExamination({
      ...form,
      ...buildPrefill(animal),
      attachments: form.attachments || [],
    });
    closeDrawer();
    await reloadHistory();
    notify("Muayene eklendi.");
  }

  async function handleVaccineSave(form) {
    const saved = await addVaccine({
      ...form,
      ...buildPrefill(animal),
      status: form.status || "Tamamlandı",
    });
    closeDrawer();
    await reloadHistory();
    notify("Aşı eklendi.");

    if (
      canWriteInvoice &&
      saved?.status === "Tamamlandı"
    ) {
      const offer = await prepareVaccineCompletionInvoiceOffer(saved);
      if (offer?.draft) {
        setInvoiceDraft(offer.draft);
        setDrawerType("invoice");
        setFormKey((k) => k + 1);
        await logInvoiceDraftCreated(offer.draft);
        notify(
          "Aşı uygulaması için fatura taslağı oluşturuldu.",
          "info"
        );
      }
    }
  }

  async function handleCreateVaccineSchedule() {
    if (!animal) return;

    const prepared = await prepareVaccineSchedule(animal);

    if (!prepared.ok) {
      notify(schedulePrepareErrorMessage(prepared.reason), "info");
      return;
    }

    if (
      !prepared.proposal.vaccines.length &&
      prepared.proposal.skippedVaccines?.length
    ) {
      notify(
        "Eklenecek yeni aşı yok; şablondaki tüm aşılar zaten kayıtlı. Yeniden oluşturmak için “Aşı Takvimini Yeniden Oluştur”u kullanın.",
        "info"
      );
      return;
    }

    setScheduleDialogTitle("Aşı Takvimi Oluştur");
    setScheduleConfirmLabel("Takvimi Oluştur");
    setScheduleProposal(prepared.proposal);
    setScheduleDialogOpen(true);
  }

  async function handleRecreateVaccineSchedule() {
    if (!animal) return;

    const confirmed = await confirm({
      title: "Aşı takvimini yeniden oluştur",
      message:
        "Bu işlem uygulanmamış otomatik aşı kayıtlarını yeniden oluşturacaktır. Tamamlanmış aşılar ve manuel kayıtlar korunacaktır.",
      confirmText: "Yeniden Oluştur",
      cancelText: "Vazgeç",
      confirmColor: "warning",
    });

    if (!confirmed) return;

    const prepared = await prepareVaccineScheduleRecreate(animal);

    if (!prepared.ok) {
      notify(schedulePrepareErrorMessage(prepared.reason), "info");
      await reloadHistory();
      return;
    }

    if (prepared.deleted?.deletedVaccines) {
      notify(
        `${prepared.deleted.deletedVaccines} bekleyen otomatik aşı silindi; şablon yeniden hazırlandı.`,
        "info"
      );
    }

    await reloadHistory();

    if (
      !prepared.proposal.vaccines.length &&
      prepared.proposal.skippedVaccines?.length
    ) {
      notify(
        "Yeniden eklenecek aşı yok; tamamlanmış / mevcut kayıtlar korundu.",
        "info"
      );
      return;
    }

    setScheduleDialogTitle("Aşı Takvimini Yeniden Oluştur");
    setScheduleConfirmLabel("Yeniden Oluştur");
    setScheduleProposal({ ...prepared.proposal, recreate: true });
    setScheduleDialogOpen(true);
  }

  async function handleDeleteAutoVaccineSchedule() {
    if (!animal) return;

    const confirmed = await confirm({
      title: "Otomatik takvimi sil",
      message:
        "Uygulanmamış otomatik aşı kayıtları ve bunlara ait otomatik randevular silinecek. Manuel aşılar, tamamlanmış aşılar ve manuel randevular korunacak. Devam edilsin mi?",
      confirmText: "Takvimi Sil",
      cancelText: "Vazgeç",
      confirmColor: "error",
    });

    if (!confirmed) return;

    const result = await deletePendingAutoVaccineSchedule(animal.id);
    await reloadHistory();

    if (result.deletedVaccines === 0 && result.deletedAppointments === 0) {
      notify("Silinecek bekleyen otomatik takvim kaydı bulunamadı.", "info");
    } else {
      notify(
        `${result.deletedVaccines} aşı ve ${result.deletedAppointments} randevu silindi.`
      );
    }
  }

  async function handleScheduleConfirm() {
    if (!scheduleProposal || creatingSchedule) return;

    setCreatingSchedule(true);

    try {
      const result = await applyVaccineScheduleProposal(scheduleProposal, {
        recreate: Boolean(scheduleProposal.recreate),
      });

      if (result.createdVaccines === 0) {
        notify("Yeni aşı oluşturulmadı; kayıtlar zaten mevcut.", "info");
      } else {
        notify(
          `${result.createdVaccines} aşı ve ${result.createdAppointments} randevu oluşturuldu.`
        );
      }

      await reloadHistory();
    } finally {
      setCreatingSchedule(false);
      setScheduleDialogOpen(false);
      setScheduleProposal(null);
    }
  }

  function scrollToVaccinesTimeline() {
    document
      .getElementById("animal-medical-timeline")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleAppointmentSave(form) {
    await addAppointment({
      ...form,
      ...buildPrefill(animal),
    });
    closeDrawer();
    await reloadHistory();
    notify("Randevu eklendi.");
  }

  async function handleInvoiceSave(form) {
    const { isDraftPreview, ...payload } = form;
    void isDraftPreview;

    await addInvoice({
      ...payload,
      ...buildPrefill(animal),
    });
    closeDrawer();
    await reloadHistory();
    notify("Fatura eklendi.");
  }

  async function handlePrescriptionSave(form) {
    try {
      const result = await savePrescriptionWithStockCheck(
        {
          ...form,
          ...buildPrefill(animal),
        },
        {
          userName: user?.fullName || user?.username || "",
          confirmFn: confirm,
        }
      );

      if (!result) {
        notify("Reçete kaydı iptal edildi.", "info");
        return;
      }

      if (result.warnings?.length) {
        notify(result.warnings.join(" "), "warning");
      }

      closeDrawer();
      await reloadHistory();
      notify("Reçete eklendi.");
    } catch (error) {
      notify(error?.message || "Reçete kaydedilemedi.", "error");
    }
  }

  async function handlePrintPdf() {
    const settings = await getSettings();
    generateMedicalRecordPdf({
      animal,
      owner,
      examinations,
      vaccines,
      appointments,
      invoices,
      prescriptions,
      settings,
    });
    notify("PDF indirildi.");
  }

  if (loading) {
    return <PageLoading message="Hasta dosyası yükleniyor..." />;
  }

  if (!animal) {
    return <EmptyState message="Hayvan bulunamadı." />;
  }

  const prefill = buildPrefill(animal);
  const drawerTitle = {
    exam: "Yeni Muayene",
    vaccine: "Yeni Aşı",
    appointment: "Yeni Randevu",
    invoice: invoiceDraft?.note?.includes("Aşı")
      ? "Aşı uygulaması için fatura taslağı oluşturuldu."
      : invoiceDraft
        ? "Taslak Fatura Önizleme"
        : "Yeni Fatura",
    prescription: "Yeni Reçete",
  }[drawerType];

  return (
    <Box>
      <AnimalSummaryCard animal={animal} summary={summary} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={3}
        flexWrap="wrap"
        useFlexGap
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: "success.50",
            border: "1px solid",
            borderColor: "success.light",
            minWidth: 180,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Toplam Tahsilat
          </Typography>
          <Typography fontWeight={800}>
            {formatCurrency(financeSummary.collected)}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: "warning.50",
            border: "1px solid",
            borderColor: "warning.light",
            minWidth: 180,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Kalan Borç
          </Typography>
          <Typography fontWeight={800}>
            {formatCurrency(financeSummary.remaining)}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        mb={3}
      >
        <Button
          variant="contained"
          startIcon={<NoteAddOutlinedIcon />}
          onClick={() => openQuick("exam")}
        >
          Yeni Muayene
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<VaccinesOutlinedIcon />}
          onClick={() => openQuick("vaccine")}
        >
          Yeni Aşı
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<EventAvailableOutlinedIcon />}
          onClick={handleCreateVaccineSchedule}
        >
          Aşı Takvimi Oluştur
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RefreshOutlinedIcon />}
          onClick={handleRecreateVaccineSchedule}
        >
          Aşı Takvimini Yeniden Oluştur
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={handleDeleteAutoVaccineSchedule}
        >
          Otomatik Takvimi Sil
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<EventOutlinedIcon />}
          onClick={() => openQuick("appointment")}
        >
          Yeni Randevu
        </Button>
        {canWriteInvoice && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ReceiptLongOutlinedIcon />}
            onClick={() => openQuick("invoice")}
          >
            Yeni Fatura
          </Button>
        )}
        {canWriteInvoice && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<ReceiptLongOutlinedIcon />}
            onClick={() => handleCreateClinicalInvoice()}
          >
            Fatura Oluştur
          </Button>
        )}
        {canWritePrescription && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<MedicationIcon />}
            onClick={() => openQuick("prescription")}
          >
            Yeni Reçete
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrintPdf}
        >
          Yazdır (PDF)
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <VaccineScheduleStatusCard
            status={scheduleStatus}
            onClick={scrollToVaccinesTimeline}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimalInfoCard animal={animal} owner={owner} />
        </Grid>

        <Grid item xs={12} md={8}>
          {owner && requiresCustomerOwner(animal.ownerType) ? (
            <CustomerInfoCard customer={owner} />
          ) : (
            <EmptyState
              compact
              message={`Sahibi: ${getAnimalOwnerDisplay(animal, owner)}`}
            />
          )}
        </Grid>

        <Grid item xs={12} lg={7}>
          <Box id="animal-medical-timeline">
            <MedicalTimeline items={timeline} />
          </Box>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <ClinicalNotesPanel
              key={`notes-${animal.id}-${animal.note || ""}`}
              note={animal.note || ""}
              onSave={handleSaveNotes}
              saving={notesSaving}
            />
            <WeightHistoryChart examinations={examinations} />
            <PrescriptionHistoryCard prescriptions={prescriptions} />
            <ActivityHistoryCard activities={activities} />
            <ExamAttachmentsPanel
              examinations={examinations}
              onAddAttachment={handleAddAttachment}
              onRemoveAttachment={handleRemoveAttachment}
              onError={(message) => notify(message, "error")}
            />
          </Stack>
        </Grid>
      </Grid>

      <Drawer
        open={Boolean(drawerType)}
        title={drawerTitle || ""}
        onClose={closeDrawer}
      >
        {drawerType === "exam" && (
          <ExaminationForm
            key={`exam-${formKey}`}
            examination={{
              ...prefill,
              veterinarian: "",
              examinationDate: todayDateOnly(),
              examType: "Genel Muayene",
              fee: "",
              feeSource: "",
              complaint: "",
              generalCondition: "",
              diagnosis: "",
              findings: "",
              treatment: "",
              temperature: "",
              pulse: "",
              respiration: "",
              height: "",
              weight: animal.weight || "",
              procedures: "",
              medicines: "",
              labResult: "",
              controlDate: "",
              notes: "",
              attachments: [],
            }}
            animals={animals}
            isEditing={false}
            onSave={handleExamSave}
          />
        )}

        {drawerType === "vaccine" && (
          <VaccineForm
            key={`vaccine-${formKey}`}
            vaccine={{
              ...prefill,
              vaccineName: "",
              brand: "",
              batchNo: "",
              dose: "",
              applicationDate: todayDateOnly(),
              nextDoseDate: "",
              fee: "",
              feeSource: "",
              veterinarian: "",
              notes: "",
            }}
            animals={animals}
            isEditing={false}
            onSave={handleVaccineSave}
          />
        )}

        {drawerType === "appointment" && (
          <AppointmentForm
            key={`appointment-${formKey}`}
            animals={animals}
            isEditing={false}
            onSave={handleAppointmentSave}
            initialValues={{
              ...prefill,
              date: todayDateOnly(),
              time: "09:00",
            }}
          />
        )}

        {drawerType === "invoice" && (
          <InvoiceForm
            key={`invoice-${formKey}`}
            invoice={
              invoiceDraft || {
                ...prefill,
                date: todayDateOnly(),
                items: [
                  {
                    type: "Muayene",
                    description: "",
                    unitPrice: "",
                    quantity: 1,
                  },
                ],
                discountType: "none",
                discountValue: "",
                vatEnabled: false,
                vatRate: 20,
                cancelled: false,
                note: "",
              }
            }
            animals={animals}
            isEditing={false}
            onSave={handleInvoiceSave}
          />
        )}

        {drawerType === "prescription" && (
          <PrescriptionForm
            key={`prescription-${formKey}`}
            animals={animals}
            isEditing={false}
            onSave={handlePrescriptionSave}
            initialValues={{
              ...prefill,
              date: todayDateOnly(),
              veterinarian: "",
              diagnosis: "",
              notes: "",
              items: [createEmptyPrescriptionItem()],
            }}
          />
        )}
      </Drawer>

      <VaccineScheduleDialog
        open={scheduleDialogOpen}
        proposal={scheduleProposal}
        creating={creatingSchedule}
        title={scheduleDialogTitle}
        confirmLabel={scheduleConfirmLabel}
        onConfirm={handleScheduleConfirm}
        onCancel={() => {
          if (creatingSchedule) return;
          setScheduleDialogOpen(false);
          setScheduleProposal(null);
        }}
      />
    </Box>
  );
}

export default HayvanDetay;
