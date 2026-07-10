import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";
import SearchBar from "../components/SearchBar";
import AnimalForm from "../components/forms/AnimalForm";
import AnimalTable from "../components/tables/AnimalTable";

import "../styles/customer.css";

import {
  getCustomers,
} from "../services/customerService";

import {
  getAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
} from "../services/animalService";

function Hayvanlar() {
  const [animals, setAnimals] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setAnimals(getAnimals());
    setCustomers(getCustomers());
  }

  const filteredAnimals = animals.filter((animal) => {
    const owner = customers.find(
      (c) => String(c.id) === String(animal.ownerId)
    );

    const ownerName = owner
      ? `${owner.ad} ${owner.soyad}`
      : "";

    const text = `
      ${animal.name}
      ${animal.species}
      ${animal.breed}
      ${animal.gender}
      ${animal.microchipNo}
      ${animal.weight}
      ${ownerName}
      ${owner?.telefon || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  function handleAddAnimal(animal) {
    addAnimal(animal);
    loadData();
  }

  function handleUpdateAnimal(animal) {
    updateAnimal(animal);
    loadData();
  }

  function handleDeleteAnimal(id) {
    if (!window.confirm("Hayvan silinsin mi?")) return;

    deleteAnimal(id);
    loadData();
  }

  function handleEditAnimal(id) {
    const animal = animals.find(
      (a) => String(a.id) === String(id)
    );

    if (!animal) return;

    setSelectedAnimal(animal);
    setIsEditing(true);
    setDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedAnimal(null);
    setIsEditing(false);
  }

  return (
    <div className="customer-page">

      <div className="customer-header">

        <div>
          <h1>Hayvanlar</h1>
          <p>Kayıtlı hayvanlar</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setSelectedAnimal(null);
            setIsEditing(false);
            setDrawerOpen(true);
          }}
        >
          + Yeni Hayvan
        </button>

      </div>

      <SearchBar
        label="Hayvan Ara..."
        value={search}
        onChange={setSearch}
      />

      <div className="customer-card">

        <AnimalTable
          animals={filteredAnimals}
          customers={customers}
          onEdit={handleEditAnimal}
          onDelete={handleDeleteAnimal}
        />

      </div>

      <Drawer
        open={drawerOpen}
        title={
          isEditing
            ? "Hayvan Düzenle"
            : "Yeni Hayvan"
        }
        onClose={handleCloseDrawer}
      >
        <AnimalForm
          animal={selectedAnimal}
          customers={customers}
          isEditing={isEditing}
          onSave={(animal) => {
            if (isEditing) {
              handleUpdateAnimal(animal);
            } else {
              handleAddAnimal(animal);
            }

            handleCloseDrawer();
          }}
        />
      </Drawer>

    </div>
  );
}

export default Hayvanlar;