import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import UpcomingOutlinedIcon from "@mui/icons-material/UpcomingOutlined";
import MedicationIcon from "@mui/icons-material/Medication";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";

import { Chip } from "@mui/material";

import { getAppointmentStatusColor } from "../utils/appointmentStatus";
import { getDueBadge } from "../utils/dueDate";
import {
  FOLLOW_UP_KIND,
  buildOverdueFollowUps,
  buildTodayFollowUps,
  buildUpcomingFollowUps,
} from "../utils/followUpTracking";
import { filterAnimalsWithClinicalNotes } from "../utils/medicalRecord";
import { formatCurrency } from "../utils/invoiceCalc";
import { getAllowedRoles, PRESCRIPTION_WRITE_ROLES, INVOICE_WRITE_ROLES } from "../utils/roles";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { prepareVaccineCompletionInvoiceOffer } from "../utils/vaccineInvoiceOffer";
import { addInvoice, logInvoiceDraftCreated } from "../services/invoiceService";
import InvoiceForm from "../components/forms/InvoiceForm";
import Drawer from "../components/Drawer";
import { getReminderDashboardStats } from "../services/reminderService";
import { getLatestAuditLogs } from "../services/auditLogService";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import StatCard from "../components/StatCard";
import DashboardListCard from "../components/dashboard/DashboardListCard";
import {
  OverdueFollowUpsCard,
  TodayFollowUpsCard,
  UpcomingFollowUpsCard,
} from "../components/dashboard/FollowUpCards";
import AnimalSpeciesChart from "../components/charts/AnimalSpeciesChart";
import CustomerGrowthChart from "../components/charts/CustomerGrowthChart";

import "../styles/dashboard.css";
import "../styles/customer.css";

import {
  getCustomerCount,
  getLatestCustomers,
} from "../services/customerService";

import {
  getAnimalCount,
  getLatestAnimals,
  getAnimals,
  getOwnerlessAnimalCount,
} from "../services/animalService";

import {
  getTodayVaccines,
  getUpcomingVaccines,
  getOverdueVaccines,
  updateVaccine,
} from "../services/vaccineService";

import {
  getTodayAppointments,
  getUpcomingAppointments,
  getOverdueAppointments,
  updateAppointment,
} from "../services/appointmentService";

import {
  getCriticalStock,
  getExpiringStock,
  getTodayConsumedQuantity,
  getMonthConsumedQuantity,
} from "../services/stockService";

import {
  getTodayExaminations,
  getUpcomingControls,
  getTodayControls,
  getAverageWeight,
  getMostCommonDiagnosis,
  getExaminationCount,
  updateExamination,
} from "../services/examinationService";

import {
  getTodayPrescriptions,
  getLatestPrescriptions,
} from "../services/prescriptionService";

import { getTodayCollection } from "../services/paymentService";

import { getDashboardFinanceKpis } from "../services/analyticsService";

const EMPTY_TODAY_BOARD = {
  appointments: [],
  vaccines: [],
  overdueVaccines: [],
  controls: [],
  all: [],
};

const QUICK_ACTIONS = [
  { path: "/musteriler", label: "Yeni Müşteri", icon: <PersonAddAltOutlinedIcon /> },
  { path: "/hayvanlar", label: "Yeni Hayvan", icon: <PetsIcon /> },
  { path: "/randevular", label: "Yeni Randevu", icon: <EventOutlinedIcon /> },
  { path: "/hatirlatmalar", label: "Hatırlatmalar", icon: <NotificationsActiveOutlinedIcon /> },
  { path: "/muayeneler", label: "Yeni Muayene", icon: <NoteAddOutlinedIcon /> },
  { path: "/faturalar", label: "Yeni Fatura", icon: <ReceiptLongOutlinedIcon /> },
  { path: "/receteler", label: "Yeni Reçete", icon: <MedicationIcon /> },
];

function Dashboard() {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const { notify } = useNotification();
  const canWriteInvoice = hasRole(INVOICE_WRITE_ROLES);

  const visibleQuickActions = QUICK_ACTIONS.filter((action) => {
    if (action.path === "/receteler") {
      return hasRole(PRESCRIPTION_WRITE_ROLES);
    }

    return hasRole(getAllowedRoles(action.path));
  });

  const [customerCount, setCustomerCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [ownerlessAnimalCount, setOwnerlessAnimalCount] = useState(0);
  const [examinationCount, setExaminationCount] = useState(0);
  const [reminderStats, setReminderStats] = useState({
    today: 0,
    upcoming: 0,
    unsent: 0,
    overdue: 0,
  });

  const [latestCustomers, setLatestCustomers] = useState([]);
  const [latestAnimals, setLatestAnimals] = useState([]);
  const [latestActivities, setLatestActivities] = useState([]);

  const [todayVaccines, setTodayVaccines] = useState([]);
  const [upcomingVaccines, setUpcomingVaccines] = useState([]);

  const [todayAppointments, setTodayAppointments] = useState([]);

  const [criticalStock, setCriticalStock] = useState([]);
  const [expiringStock, setExpiringStock] = useState({
    today: [],
    week: [],
    month: [],
    expired: [],
    upcoming: [],
  });
  const [todayConsumed, setTodayConsumed] = useState(0);
  const [monthConsumed, setMonthConsumed] = useState(0);

  const [todayExaminations, setTodayExaminations] = useState([]);
  const [upcomingControls, setUpcomingControls] = useState([]);
  const [averageWeight, setAverageWeight] = useState(0);
  const [mostDiagnosis, setMostDiagnosis] = useState("-");

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [todayProfit, setTodayProfit] = useState({
    sale: 0,
    cost: 0,
    profit: 0,
    margin: 0,
  });
  const [monthProfit, setMonthProfit] = useState({
    sale: 0,
    cost: 0,
    profit: 0,
    margin: 0,
  });

  const [todayPrescriptions, setTodayPrescriptions] = useState([]);
  const [latestPrescriptions, setLatestPrescriptions] = useState([]);
  const [todayCollectionTotal, setTodayCollectionTotal] = useState(0);
  const [outstandingSummary, setOutstandingSummary] = useState({
    totalDebt: 0,
    invoiceCount: 0,
    customerCount: 0,
    items: [],
  });

  const [todayBoard, setTodayBoard] = useState(EMPTY_TODAY_BOARD);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [clinicalNoteAlerts, setClinicalNoteAlerts] = useState([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [invoiceFormKey, setInvoiceFormKey] = useState(0);
  const [animalsForInvoice, setAnimalsForInvoice] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const [
        customerCountData,
        animalCountData,
        ownerlessCountData,
        examinationCountData,
        latestCustomersData,
        latestAnimalsData,
        animalsData,
        todayVaccinesData,
        upcomingVaccinesData,
        overdueVaccinesData,
        todayAppointmentsData,
        upcomingAppointmentsData,
        overdueAppointmentsData,
        criticalStockData,
        expiringStockData,
        todayConsumedData,
        monthConsumedData,
        todayExaminationsData,
        upcomingControlsData,
        todayControlsData,
        averageWeightData,
        mostDiagnosisData,
        financeKpisData,
        todayPrescriptionsData,
        latestPrescriptionsData,
        todayCollectionData,
        reminderStatsData,
        latestActivitiesData,
      ] = await Promise.all([
        getCustomerCount(),
        getAnimalCount(),
        getOwnerlessAnimalCount(),
        getExaminationCount(),
        getLatestCustomers(),
        getLatestAnimals(),
        getAnimals(),
        getTodayVaccines(),
        getUpcomingVaccines(),
        getOverdueVaccines(),
        getTodayAppointments(),
        getUpcomingAppointments(),
        getOverdueAppointments(),
        getCriticalStock(),
        getExpiringStock(30),
        getTodayConsumedQuantity(),
        getMonthConsumedQuantity(),
        getTodayExaminations(),
        getUpcomingControls(),
        getTodayControls(),
        getAverageWeight(),
        getMostCommonDiagnosis(),
        getDashboardFinanceKpis(),
        getTodayPrescriptions(),
        getLatestPrescriptions(),
        getTodayCollection(),
        getReminderDashboardStats(),
        getLatestAuditLogs(10, user),
      ]);

      if (cancelled) return;

      setCustomerCount(customerCountData);
      setAnimalCount(animalCountData);
      setOwnerlessAnimalCount(ownerlessCountData);
      setExaminationCount(examinationCountData);
      setReminderStats(reminderStatsData);
      setLatestCustomers(latestCustomersData);
      setLatestAnimals(latestAnimalsData);
      setLatestActivities(latestActivitiesData);
      setAnimalsForInvoice(animalsData);
      setTodayVaccines(todayVaccinesData);
      setUpcomingVaccines(upcomingVaccinesData);
      setTodayAppointments(todayAppointmentsData);
      setCriticalStock(criticalStockData);
      setExpiringStock(expiringStockData);
      setTodayConsumed(todayConsumedData);
      setMonthConsumed(monthConsumedData);
      setTodayExaminations(todayExaminationsData);
      setUpcomingControls(upcomingControlsData);
      setAverageWeight(averageWeightData);
      setMostDiagnosis(mostDiagnosisData);
      setTodayRevenue(financeKpisData.todayRevenue);
      setMonthRevenue(financeKpisData.monthRevenue);
      setTodayProfit(financeKpisData.todayProfit);
      setMonthProfit(financeKpisData.monthProfit);
      setTodayPrescriptions(todayPrescriptionsData);
      setLatestPrescriptions(latestPrescriptionsData);
      setTodayCollectionTotal(todayCollectionData.total || 0);
      setOutstandingSummary(financeKpisData.outstanding || {
        items: [],
        totalDebt: 0,
        customerCount: 0,
        invoiceCount: 0,
      });

      setClinicalNoteAlerts(
        filterAnimalsWithClinicalNotes(animalsData).map((entry) => ({
          id: entry.animal.id,
          animal: entry.animal,
          notes: entry.notes,
        }))
      );

      setTodayBoard(
        buildTodayFollowUps({
          appointments: todayAppointmentsData,
          vaccines: todayVaccinesData,
          overdueVaccines: overdueVaccinesData,
          controls: todayControlsData,
        })
      );

      setUpcomingItems(
        buildUpcomingFollowUps({
          appointments: upcomingAppointmentsData,
          vaccines: upcomingVaccinesData,
          controls: upcomingControlsData,
        }).items
      );

      setOverdueItems(
        buildOverdueFollowUps({
          appointments: overdueAppointmentsData,
          vaccines: overdueVaccinesData,
        }).items
      );
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshToken, user]);

  function handleFollowUpClick(item) {
    if (item?.animalId) {
      navigate(`/hayvanlar/${item.animalId}`);
    }
  }

  async function handleFollowUpStatusChange(item, nextStatus) {
    if (!item || statusUpdating) return;

    setStatusUpdating(true);

    try {
      if (item.kind === FOLLOW_UP_KIND.APPOINTMENT) {
        await updateAppointment({
          ...item.source,
          status: nextStatus,
        });
      } else if (item.kind === FOLLOW_UP_KIND.VACCINE) {
        if (nextStatus === "Tamamlandı") {
          const saved = await updateVaccine({
            ...item.source,
            status: "Tamamlandı",
            nextDoseDate: "",
          });

          if (canWriteInvoice && saved) {
            const offer = await prepareVaccineCompletionInvoiceOffer(saved);
            if (offer?.draft) {
              setInvoiceDraft(offer.draft);
              setInvoiceFormKey((k) => k + 1);
              setInvoiceDrawerOpen(true);
              await logInvoiceDraftCreated(offer.draft);
              notify(
                "Aşı uygulaması için fatura taslağı oluşturuldu.",
                "info"
              );
            }
          }
        }
      } else if (item.kind === FOLLOW_UP_KIND.CONTROL) {
        if (nextStatus === "Tamamlandı") {
          await updateExamination({
            ...item.source,
            controlDate: "",
          });
        }
      }

      setRefreshToken((token) => token + 1);
      notify("Durum güncellendi.");
    } catch {
      notify("Durum güncellenemedi.", "error");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleInvoiceSave(form) {
    const { isDraftPreview, ...payload } = form;
    void isDraftPreview;

    await addInvoice(payload);
    setInvoiceDrawerOpen(false);
    setInvoiceDraft(null);
    notify("Fatura eklendi.");
    setRefreshToken((token) => token + 1);
  }

  return (
    <>
      <h1 className="page-title">Hoş Geldiniz 👋</h1>
      <p className="page-subtitle">
        Veteriner Klinik Yönetim Sistemine hoş geldiniz.
      </p>

      <div className="stats-grid">
        <StatCard
          title="Toplam Müşteri"
          value={customerCount}
          icon={<PeopleAltOutlinedIcon />}
          color="#3B82F6"
        />
        <StatCard
          title="Toplam Hayvan"
          value={animalCount}
          icon={<PetsOutlinedIcon />}
          color="#10B981"
        />
        <StatCard
          title="Sahipsiz Hayvan Sayısı"
          value={ownerlessAnimalCount}
          icon={<PetsOutlinedIcon />}
          color="#64748B"
        />
        <StatCard
          title="Bugünkü Hatırlatmalar"
          value={reminderStats.today}
          icon={<NotificationsActiveOutlinedIcon />}
          color="#0369A1"
        />
        <StatCard
          title="Yaklaşan Hatırlatmalar"
          value={reminderStats.upcoming}
          icon={<NotificationsActiveOutlinedIcon />}
          color="#0E7490"
        />
        <StatCard
          title="Gönderilmeyen Hatırlatmalar"
          value={reminderStats.unsent}
          icon={<NotificationsActiveOutlinedIcon />}
          color="#B45309"
        />
        <StatCard
          title="Bugünkü Muayene"
          value={todayExaminations.length}
          icon={<MedicalServicesOutlinedIcon />}
          color="#7C3AED"
        />
        <StatCard
          title="Bugünkü Aşı Sayısı"
          value={todayVaccines.length}
          icon={<VaccinesOutlinedIcon />}
          color="#F59E0B"
        />
        <StatCard
          title="Bugünkü Randevu"
          value={todayAppointments.length}
          icon={<EventOutlinedIcon />}
          color="#EF4444"
        />
        <StatCard
          title="Bugün Yazılan Reçete"
          value={todayPrescriptions.length}
          icon={<MedicationIcon />}
          color="#7C3AED"
        />
        <StatCard
          title="Geciken İşlem"
          value={overdueItems.length}
          icon={<WarningAmberOutlinedIcon />}
          color="#B91C1C"
        />
        <StatCard
          title="Önümüzdeki 7 Günlük İşlem"
          value={upcomingItems.length}
          icon={<UpcomingOutlinedIcon />}
          color="#D97706"
        />
        <StatCard
          title="Kritik Stok"
          value={criticalStock.length}
          icon={<Inventory2OutlinedIcon />}
          color="#DC2626"
        />
        <StatCard
          title="Bugün Tüketilen İlaç"
          value={todayConsumed}
          icon={<LocalPharmacyOutlinedIcon />}
          color="#C2410C"
        />
        <StatCard
          title="Bu Ay Tüketilen İlaç"
          value={monthConsumed}
          icon={<MedicationIcon />}
          color="#9A3412"
        />
        <StatCard
          title="Yaklaşan SKT"
          value={
            (expiringStock.upcoming?.length || 0) +
            (expiringStock.expired?.length || 0)
          }
          icon={<HourglassBottomOutlinedIcon />}
          color="#CA8A04"
        />
        <StatCard
          title="Bugünkü Ciro"
          value={formatCurrency(todayRevenue)}
          icon={<PaymentsOutlinedIcon />}
          color="#059669"
        />
        <StatCard
          title="Bugünkü Tahsilat"
          value={formatCurrency(todayCollectionTotal)}
          icon={<AccountBalanceWalletOutlinedIcon />}
          color="#047857"
        />
        <StatCard
          title="Bekleyen Tahsilat"
          value={formatCurrency(outstandingSummary.totalDebt || 0)}
          icon={<RequestQuoteOutlinedIcon />}
          color="#B45309"
        />
        <StatCard
          title="Ödenmeyen Fatura Sayısı"
          value={outstandingSummary.invoiceCount || 0}
          icon={<ReceiptLongOutlinedIcon />}
          color="#DC2626"
        />
        <StatCard
          title="Bu Ayki Ciro"
          value={formatCurrency(monthRevenue)}
          icon={<ReceiptLongOutlinedIcon />}
          color="#0D9488"
        />
        <StatCard
          title="Günlük Tahmini Kar"
          value={formatCurrency(todayProfit.profit)}
          icon={<PaymentsOutlinedIcon />}
          color="#15803D"
        />
        <StatCard
          title="Aylık Tahmini Kar"
          value={formatCurrency(monthProfit.profit)}
          icon={<AccountBalanceWalletOutlinedIcon />}
          color="#166534"
        />
        <StatCard
          title="Toplam Satış (Ay)"
          value={formatCurrency(monthProfit.sale)}
          icon={<ReceiptLongOutlinedIcon />}
          color="#0F766E"
        />
        <StatCard
          title="Toplam Maliyet (Ay)"
          value={formatCurrency(monthProfit.cost)}
          icon={<RequestQuoteOutlinedIcon />}
          color="#A16207"
        />
        <StatCard
          title="Ortalama Kar Marjı (Ay)"
          value={`%${monthProfit.margin}`}
          icon={<PaymentsOutlinedIcon />}
          color="#047857"
        />
      </div>

      <div className="dashboard-lists">
        <div className="dashboard-card" style={{ width: "100%" }}>
          <h3>Hızlı İşlemler</h3>
          <div className="quick-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {visibleQuickActions.map((action) => (
              <button
                key={action.path}
                className="quick-btn"
                onClick={() => navigate(action.path)}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sprint 16 — Hasta Takip ve Hatırlatma Merkezi */}
      <div className="dashboard-lists">
        <OverdueFollowUpsCard
          items={overdueItems}
          onItemClick={handleFollowUpClick}
          onStatusChange={handleFollowUpStatusChange}
          statusUpdating={statusUpdating}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Tahsil Edilmeyen Faturalar"
          items={(outstandingSummary.items || []).slice(0, 8).map((row) => ({
            ...row,
            id: row.invoice.id,
          }))}
          keyField="id"
          emptyMessage="Bekleyen tahsilat yok."
          style={{ width: "100%" }}
          actionLabel={
            hasRole(getAllowedRoles("/finans")) ? "Finansa Git" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/finans"))
              ? () => navigate("/finans")
              : undefined
          }
          onItemClick={() => navigate("/faturalar")}
          renderItem={(row) => (
            <>
              <strong>
                {row.invoice.invoiceNumber} · {row.invoice.ownerName}
              </strong>
              <span className="dashboard-item-badges">
                <Chip
                  label={`Kalan ${formatCurrency(row.remaining)}`}
                  color="warning"
                  size="small"
                />
                <Chip label={row.status} size="small" />
              </span>
            </>
          )}
        />
      </div>

      {clinicalNoteAlerts.length > 0 && (
        <div className="dashboard-lists">
          <DashboardListCard
            title="Klinik Uyarı Notları"
            items={clinicalNoteAlerts}
            keyField="id"
            emptyMessage="Klinik uyarı notu yok."
            style={{ width: "100%" }}
            onItemClick={(entry) =>
              entry.animal?.id && navigate(`/hayvanlar/${entry.animal.id}`)
            }
            renderItem={(entry) => (
              <>
                <strong>
                  {entry.animal.name}
                  {entry.animal.ownerName ? ` · ${entry.animal.ownerName}` : ""}
                </strong>
                <span className="dashboard-item-badges">
                  {entry.notes.slice(0, 3).map((note) => (
                    <Chip
                      key={note}
                      label={note}
                      color="warning"
                      size="small"
                    />
                  ))}
                  {entry.notes.length > 3 && (
                    <Chip
                      label={`+${entry.notes.length - 3}`}
                      size="small"
                    />
                  )}
                </span>
              </>
            )}
          />
        </div>
      )}

      <div className="dashboard-lists">
        <TodayFollowUpsCard
          todayBoard={todayBoard}
          onItemClick={handleFollowUpClick}
          onStatusChange={handleFollowUpStatusChange}
          statusUpdating={statusUpdating}
        />
      </div>

      <div className="dashboard-lists">
        <UpcomingFollowUpsCard
          items={upcomingItems}
          onItemClick={handleFollowUpClick}
          onStatusChange={handleFollowUpStatusChange}
          statusUpdating={statusUpdating}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Son İşlemler"
          items={latestActivities}
          emptyMessage="Henüz aktivite yok."
          style={{ width: "100%" }}
          actionLabel={
            hasRole(getAllowedRoles("/aktivite")) ? "Tümünü Gör" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/aktivite"))
              ? () => navigate("/aktivite")
              : undefined
          }
          renderItem={(entry) => (
            <>
              <strong>
                {entry.time || "--:--"} · {entry.userRole || entry.userName || "Kullanıcı"}
              </strong>
              <span>{entry.description || `${entry.module} ${entry.action}`}</span>
            </>
          )}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Son Eklenen Müşteriler"
          items={latestCustomers}
          emptyMessage="Kayıt bulunmuyor."
          onItemClick={(customer) =>
            navigate(`/musteriler/${customer.id}`)
          }
          actionLabel="Tümünü Gör"
          onAction={() => navigate("/musteriler")}
          renderItem={(customer) => (
            <>
              <strong>{customer.ad} {customer.soyad}</strong>
              <span>{customer.telefon}</span>
            </>
          )}
        />

        <DashboardListCard
          title="Son Eklenen Hayvanlar"
          items={latestAnimals}
          emptyMessage="Kayıt bulunmuyor."
          onItemClick={(animal) =>
            navigate(`/hayvanlar/${animal.id}`)
          }
          actionLabel="Tümünü Gör"
          onAction={() => navigate("/hayvanlar")}
          renderItem={(animal) => (
            <>
              <strong>{animal.name}</strong>
              <span>{animal.species}</span>
            </>
          )}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Son Yazılan Reçeteler"
          items={latestPrescriptions}
          emptyMessage="Henüz reçete yok."
          style={{ width: "100%" }}
          onItemClick={() => navigate("/receteler")}
          actionLabel={
            hasRole(getAllowedRoles("/receteler")) ? "Tümünü Gör" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/receteler"))
              ? () => navigate("/receteler")
              : undefined
          }
          renderItem={(prescription) => (
            <>
              <strong>
                {prescription.prescriptionNumber} · {prescription.animalName}
              </strong>
              <span className="dashboard-item-badges">
                <span>{prescription.date}</span>
                <Chip
                  label={prescription.diagnosis || "Tanı yok"}
                  size="small"
                />
              </span>
            </>
          )}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Bugünkü Muayeneler"
          items={todayExaminations}
          emptyMessage="Bugün muayene bulunmuyor."
          onItemClick={(exam) =>
            exam.animalId && navigate(`/hayvanlar/${exam.animalId}`)
          }
          renderItem={(exam) => (
            <>
              <strong>{exam.animalName}</strong>
              <span>{exam.diagnosis || "Tanı girilmedi"}</span>
            </>
          )}
        />

        <DashboardListCard
          title="Bugünkü Randevular"
          items={todayAppointments}
          emptyMessage="Bugün randevu bulunmuyor."
          onItemClick={
            (appointment) =>
              appointment.animalId &&
              navigate(`/hayvanlar/${appointment.animalId}`)
          }
          actionLabel="Tümünü Gör"
          onAction={() => navigate("/randevular")}
          renderItem={(appointment) => (
            <>
              <strong>
                {appointment.time} · {appointment.animalName} -{" "}
                {appointment.ownerName}
              </strong>
              <span className="dashboard-item-badges">
                <Chip
                  label={appointment.status || "Belirsiz"}
                  color={getAppointmentStatusColor(appointment.status)}
                  size="small"
                />
              </span>
            </>
          )}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Bugünkü Aşılar"
          items={todayVaccines}
          emptyMessage="Bugün aşı bulunmuyor."
          onItemClick={(vaccine) =>
            vaccine.animalId && navigate(`/hayvanlar/${vaccine.animalId}`)
          }
          renderItem={(vaccine) => (
            <>
              <strong>{vaccine.animalName}</strong>
              <span>{vaccine.vaccineName}</span>
            </>
          )}
        />

        <DashboardListCard
          title="Yaklaşan Aşılar"
          items={upcomingVaccines}
          emptyMessage="Yaklaşan aşı bulunmuyor."
          onItemClick={
            (vaccine) =>
              vaccine.animalId &&
              navigate(`/hayvanlar/${vaccine.animalId}`)
          }
          actionLabel={
            hasRole(getAllowedRoles("/asilar")) ? "Tümünü Gör" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/asilar"))
              ? () => navigate("/asilar")
              : undefined
          }
          renderItem={(vaccine) => {
            const badge = getDueBadge(vaccine.nextDoseDate);
            return (
              <>
                <strong>
                  {vaccine.animalName} · {vaccine.vaccineName}
                </strong>
                <span className="dashboard-item-badges">
                  <span>{vaccine.nextDoseDate}</span>
                  <Chip label={badge.label} color={badge.color} size="small" />
                </span>
              </>
            );
          }}
        />
      </div>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Yaklaşan Kontroller"
          items={upcomingControls}
          emptyMessage="Yaklaşan kontrol bulunmuyor."
          onItemClick={(exam) =>
            exam.animalId && navigate(`/hayvanlar/${exam.animalId}`)
          }
          renderItem={(exam) => (
            <>
              <strong>{exam.animalName}</strong>
              <span>{exam.controlDate}</span>
            </>
          )}
        />

        <DashboardListCard
          title="Kritik Stok"
          items={criticalStock}
          emptyMessage="Kritik seviyede stok bulunmuyor."
          onItemClick={
            hasRole(getAllowedRoles("/stok"))
              ? () => navigate("/stok")
              : undefined
          }
          actionLabel={
            hasRole(getAllowedRoles("/stok")) ? "Tümünü Gör" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/stok"))
              ? () => navigate("/stok")
              : undefined
          }
          renderItem={(stockItem) => (
            <>
              <strong>{stockItem.name || "Ürün"}</strong>
              <span className="dashboard-item-badges">
                <Chip
                  label={`${stockItem.quantity} / min ${stockItem.minQuantity}`}
                  color={stockItem.criticalityColor || "error"}
                  size="small"
                  sx={
                    stockItem.criticalityPercent > 50 &&
                    stockItem.criticalityPercent <= 100
                      ? { bgcolor: "#EAB308", color: "#111" }
                      : undefined
                  }
                />
                <Chip
                  label={`Eksik ${stockItem.shortage ?? 0} · %${stockItem.criticalityPercent ?? 0}`}
                  size="small"
                  variant="outlined"
                />
              </span>
            </>
          )}
        />

        <DashboardListCard
          title="Yaklaşan Son Kullanmalar"
          items={[
            ...(expiringStock.expired || []),
            ...(expiringStock.upcoming || []),
          ]}
          emptyMessage="Yaklaşan veya geçmiş SKT yok."
          onItemClick={
            hasRole(getAllowedRoles("/stok"))
              ? () => navigate("/stok")
              : undefined
          }
          actionLabel={
            hasRole(getAllowedRoles("/stok")) ? "Stoka Git" : undefined
          }
          onAction={
            hasRole(getAllowedRoles("/stok"))
              ? () => navigate("/stok")
              : undefined
          }
          renderItem={(stockItem) => {
            const badge = stockItem.expiryBadge || {
              label: "-",
              color: "default",
            };
            const bucket =
              stockItem.daysUntilExpiry < 0
                ? "Geçmiş"
                : stockItem.daysUntilExpiry === 0
                  ? "Bugün"
                  : stockItem.daysUntilExpiry <= 7
                    ? "7 gün"
                    : "30 gün";

            return (
              <>
                <strong>{stockItem.name || "Ürün"}</strong>
                <span className="dashboard-item-badges">
                  <Chip label={bucket} size="small" variant="outlined" />
                  <Chip
                    label={badge.label}
                    color={badge.color}
                    size="small"
                  />
                  {stockItem.lotNo ? (
                    <Chip
                      label={`Lot ${stockItem.lotNo}`}
                      size="small"
                      variant="outlined"
                    />
                  ) : null}
                </span>
              </>
            );
          }}
        />
      </div>

      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Hayvan Tür Dağılımı</h3>
          <AnimalSpeciesChart />
        </div>

        <div className="dashboard-card">
          <h3>Aylık Yeni Müşteri</h3>
          <CustomerGrowthChart />
        </div>
      </div>

      <div className="dashboard-lists">
        <div className="dashboard-card" style={{ width: "100%" }}>
          <h3>Klinik Özeti</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Müşteri</strong>
              <span>{customerCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Hayvan</strong>
              <span>{animalCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Muayene</strong>
              <span>{examinationCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Muayene</strong>
              <span>{todayExaminations.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Randevu</strong>
              <span>{todayAppointments.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Aşı</strong>
              <span>{todayVaccines.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Geciken İşlem</strong>
              <span>{overdueItems.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>7 Günlük İşlem</strong>
              <span>{upcomingItems.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Yaklaşan Aşı</strong>
              <span>{upcomingVaccines.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Kritik Stok</strong>
              <span>{criticalStock.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Yaklaşan SKT</strong>
              <span>
                {(expiringStock.upcoming?.length || 0) +
                  (expiringStock.expired?.length || 0)}
              </span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugün Tüketilen İlaç</strong>
              <span>{todayConsumed}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bu Ay Tüketilen İlaç</strong>
              <span>{monthConsumed}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>
                <MonitorWeightOutlinedIcon
                  fontSize="small"
                  sx={{ mr: 0.75, verticalAlign: "middle" }}
                />{" "}
                Ortalama Kilo
              </strong>
              <span>{averageWeight} kg</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>
                <MedicalServicesOutlinedIcon
                  fontSize="small"
                  sx={{ mr: 0.75, verticalAlign: "middle" }}
                />{" "}
                En Sık Tanı
              </strong>
              <span>{mostDiagnosis}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Ciro</strong>
              <span>{formatCurrency(todayRevenue)}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bu Ayki Ciro</strong>
              <span>{formatCurrency(monthRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

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
            key={`dashboard-vaccine-invoice-${invoiceFormKey}`}
            invoice={invoiceDraft}
            animals={animalsForInvoice}
            isEditing={false}
            onSave={handleInvoiceSave}
          />
        )}
      </Drawer>
    </>
  );
}

export default Dashboard;
