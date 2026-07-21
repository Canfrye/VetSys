import { useEffect, useMemo, useState } from "react";
import { Tabs, Tab } from "@mui/material";

import Drawer from "../components/Drawer";

import AppointmentForm from "../components/forms/AppointmentForm";
import AppointmentTable from "../components/tables/AppointmentTable";
import AppointmentCalendar from "../components/calendar/AppointmentCalendar";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";
import { getCustomers } from "../services/customerService";

import {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  isAppointmentConflict,
} from "../services/appointmentService";

import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Appointments() {
  const confirm = useConfirm();
  const { notify } = useNotification();

  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [slotDraft, setSlotDraft] = useState({});

  const [viewMode, setViewMode] = useState("list");

  // Ardışık "Yeni Randevu" açılışlarında (buton veya takvim slotu ile)
  // AppointmentForm'un yeniden mount edilip formun sıfırlanmasını
  // sağlamak için benzersiz key üretir.
  const [newFormKey, setNewFormKey] = useState(0);

  const phoneByOwnerId = useMemo(() => {
    const map = {};

    customers.forEach((customer) => {
      map[String(customer.id)] = customer.telefon || "";
    });

    return map;
  }, [customers]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [appointmentsData, animalsData, customersData] = await Promise.all([
      getAppointments(),
      getAnimals(),
      getCustomers(),
    ]);

    setAppointments(appointmentsData);
    setAnimals(animalsData);
    setCustomers(customersData);
  }

  async function handleSave(appointment) {
    if (editingAppointment) {
      await updateAppointment({
        ...editingAppointment,
        ...appointment,
      });
      notify("Randevu güncellendi.");
    } else {
      await addAppointment(appointment);
      notify("Randevu eklendi.");
    }

    await loadData();

    setEditingAppointment(null);
    setSlotDraft({});
    setDrawerOpen(false);
  }

  function handleEdit(appointment) {
    setEditingAppointment(appointment);
    setSlotDraft({});
    setDrawerOpen(true);
  }

  function handleSlotClick(date, time) {
    setEditingAppointment(null);
    setSlotDraft({ date, time });
    setNewFormKey((key) => key + 1);
    setDrawerOpen(true);
  }

  function handleNewAppointmentClick() {
    setEditingAppointment(null);
    setSlotDraft({});
    setNewFormKey((key) => key + 1);
    setDrawerOpen(true);
  }

  async function handleAppointmentMove(appointment, { date, time }) {
    const conflict = await isAppointmentConflict(
      {
        veterinarian: appointment.veterinarian,
        date,
        time,
        duration: appointment.duration || 30,
      },
      appointment.id
    );

    if (conflict) {
      notify(
        `Çakışma: ${conflict.time} · ${conflict.animalName}. Taşıma iptal edildi.`,
        "error"
      );
      return;
    }

    await updateAppointment({
      ...appointment,
      date,
      time,
    });

    await loadData();
    notify("Randevu saati güncellendi.");
  }

  async function handleAppointmentResize(appointment, duration) {
    const conflict = await isAppointmentConflict(
      {
        veterinarian: appointment.veterinarian,
        date: appointment.date,
        time: appointment.time,
        duration,
      },
      appointment.id
    );

    if (conflict) {
      notify(
        `Çakışma: ${conflict.time} · ${conflict.animalName}. Süre değiştirilemedi.`,
        "error"
      );
      return;
    }

    await updateAppointment({
      ...appointment,
      duration,
    });

    await loadData();
    notify(`Randevu süresi ${duration} dk olarak güncellendi.`);
  }

  async function handleDelete(id) {
    const confirmed = await confirm("Randevu silinsin mi?");

    if (!confirmed) return;

    await deleteAppointment(id);

    await loadData();
    notify("Randevu silindi.");
  }

  function handleClose() {
    setEditingAppointment(null);
    setSlotDraft({});
    setDrawerOpen(false);
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Randevular</h1>
          <p>Kayıtlı randevular</p>
        </div>

        <button
          className="add-btn"
          onClick={handleNewAppointmentClick}
        >
          + Yeni Randevu
        </button>
      </div>

      <Tabs
        value={viewMode}
        onChange={(_, value) => setViewMode(value)}
        sx={{ marginBottom: 2 }}
      >
        <Tab value="list" label="Liste" />
        <Tab value="calendar" label="Takvim" />
      </Tabs>

      {viewMode === "list" ? (
        <div className="customer-card">
          {appointments.length === 0 ? (
            <EmptyState message="Henüz kayıtlı randevu yok. + Yeni Randevu ile ekleyebilirsiniz." />
          ) : (
            <AppointmentTable
              appointments={appointments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          phoneByOwnerId={phoneByOwnerId}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleEdit}
          onAppointmentMove={handleAppointmentMove}
          onAppointmentResize={handleAppointmentResize}
        />
      )}

      <Drawer
        open={drawerOpen}
        title={
          editingAppointment
            ? "Randevu Düzenle"
            : "Yeni Randevu"
        }
        onClose={handleClose}
      >
        <AppointmentForm
          key={
            editingAppointment?.id ||
            (slotDraft.date && slotDraft.time
              ? `${slotDraft.date}-${slotDraft.time}-${newFormKey}`
              : `new-${newFormKey}`)
          }
          appointment={editingAppointment}
          animals={animals}
          isEditing={!!editingAppointment}
          onSave={handleSave}
          initialValues={slotDraft}
        />
      </Drawer>
    </div>
  );
}

export default Appointments;
