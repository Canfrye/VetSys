import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";
import VaccineForm from "../components/forms/VaccineForm";
import VaccineTable from "../components/tables/VaccineTable";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";

import {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
} from "../services/vaccineService";

function Vaccines() {
  const [vaccines, setVaccines] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingVaccine, setEditingVaccine] =
    useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setVaccines(getVaccines());
    setAnimals(getAnimals());
  }

  function handleSave(vaccine) {
    if (editingVaccine) {
      updateVaccine({
        ...editingVaccine,
        ...vaccine,
      });
    } else {
      addVaccine(vaccine);
    }

    loadData();

    setEditingVaccine(null);
    setDrawerOpen(false);
  }

  function handleEdit(vaccine) {
    setEditingVaccine(vaccine);
    setDrawerOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm("Aşı silinsin mi?")) return;

    deleteVaccine(id);

    loadData();
  }

  function handleClose() {
    setEditingVaccine(null);
    setDrawerOpen(false);
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
          onClick={() => setDrawerOpen(true)}
        >
          + Yeni Aşı
        </button>
      </div>

      <div className="customer-card">
        <VaccineTable
          vaccines={vaccines}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
          vaccine={editingVaccine}
          animals={animals}
          isEditing={!!editingVaccine}
          onSave={handleSave}
        />
      </Drawer>

    </div>
  );
}

export default Vaccines;