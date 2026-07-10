import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";

import AppointmentForm from "../components/forms/AppointmentForm";
import AppointmentTable from "../components/tables/AppointmentTable";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";

import {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
} from "../services/appointmentService";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setAppointments(getAppointments());
    setAnimals(getAnimals());
  }

  function handleSave(appointment) {
    if (editingAppointment) {
      updateAppointment({
        ...editingAppointment,
        ...appointment,
      });
    } else {
      addAppointment(appointment);
    }

    loadData();

    setEditingAppointment(null);
    setDrawerOpen(false);
  }

  function handleEdit(appointment) {
    setEditingAppointment(appointment);
    setDrawerOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm("Randevu silinsin mi?")) return;

    deleteAppointment(id);

    loadData();
  }

  function handleClose() {
    setEditingAppointment(null);
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
          onClick={() => setDrawerOpen(true)}
        >
          + Yeni Randevu
        </button>
      </div>

      <div className="customer-card">
        <AppointmentTable
          appointments={appointments}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

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
          appointment={editingAppointment}
          animals={animals}
          isEditing={!!editingAppointment}
          onSave={handleSave}
        />
      </Drawer>
    </div>
  );
}

export default Appointments;