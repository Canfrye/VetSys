import { useEffect, useMemo, useState } from "react";

import Drawer from "../components/Drawer";
import ExaminationForm from "../components/forms/ExaminationForm";
import ExaminationTable from "../components/tables/ExaminationTable";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";

import {
  getExaminations,
  addExamination,
  updateExamination,
  deleteExamination,
} from "../services/examinationService";

function Examinations() {
  const [examinations, setExaminations] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setExaminations(getExaminations());
    setAnimals(getAnimals());
  }

  function handleSave(exam) {
    if (editingExam) {
      updateExamination({
        ...editingExam,
        ...exam,
      });
    } else {
      addExamination(exam);
    }

    loadData();
    handleClose();
  }

  function handleEdit(exam) {
    setEditingExam(exam);
    setDrawerOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm("Muayene silinsin mi?")) return;

    deleteExamination(id);
    loadData();
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

        <ExaminationTable
          examinations={filteredExaminations}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>

      <Drawer
        open={drawerOpen}
        title={
          editingExam
            ? "Muayene Düzenle"
            : "Yeni Muayene"
        }
        onClose={handleClose}
      >
        <ExaminationForm
          examination={editingExam}
          animals={animals}
          isEditing={!!editingExam}
          onSave={handleSave}
        />
      </Drawer>

    </div>
  );
}

export default Examinations;