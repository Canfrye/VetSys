import { useEffect, useState } from "react";

import "../styles/customer.css";

import CustomerTable from "../components/tables/CustomerTable";
import CustomerForm from "../components/forms/CustomerForm";
import Drawer from "../components/Drawer";
import SearchBar from "../components/SearchBar";

import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService";

function Musteriler() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  function loadCustomers() {
    setCustomers(getCustomers());
  }

  const filteredCustomers = customers.filter((customer) => {
    const text = `
      ${customer.ad || ""}
      ${customer.soyad || ""}
      ${customer.telefon || ""}
      ${customer.email || ""}
      ${customer.adres || ""}
    `
      .toLowerCase()
      .trim();

    return text.includes(search.toLowerCase());
  });

  function handleSave(customer) {
    if (selectedCustomer) {
      updateCustomer({
        ...customer,
        id: selectedCustomer.id,
        createdAt: selectedCustomer.createdAt,
      });
    } else {
      addCustomer(customer);
    }

    loadCustomers();
    setDrawerOpen(false);
    setSelectedCustomer(null);
  }

  function handleDelete(id) {
    if (!window.confirm("Müşteri silinsin mi?")) return;

    deleteCustomer(id);
    loadCustomers();
  }

  function handleEdit(customer) {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  }

  return (
    <div className="customer-page">

      <div className="customer-header">

        <div>
          <h1>Müşteriler</h1>
          <p>Veteriner kliniğinizde kayıtlı müşteriler</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setSelectedCustomer(null);
            setDrawerOpen(true);
          }}
        >
          + Yeni Müşteri
        </button>

      </div>

      <SearchBar
        label="İsim, telefon, e-posta veya adres ara..."
        value={search}
        onChange={setSearch}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 15,
          color: "#666",
          fontSize: 14,
        }}
      >
        <span>
          Toplam Müşteri: <strong>{customers.length}</strong>
        </span>

        <span>
          Gösterilen: <strong>{filteredCustomers.length}</strong>
        </span>
      </div>

      <div className="customer-card">

        {filteredCustomers.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#777",
            }}
          >
            🔍 Arama kriterine uygun müşteri bulunamadı.
          </div>
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}

      </div>

      <Drawer
        open={drawerOpen}
        title={
          selectedCustomer
            ? "Müşteri Düzenle"
            : "Yeni Müşteri"
        }
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCustomer(null);
        }}
      >
        <CustomerForm
          customer={selectedCustomer}
          isEditing={!!selectedCustomer}
          onSave={handleSave}
        />
      </Drawer>

    </div>
  );
}

export default Musteriler;