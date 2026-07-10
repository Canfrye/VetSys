import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";
import StockForm from "../components/forms/StockForm";
import StockTable from "../components/tables/StockTable";

import "../styles/customer.css";

import {
  getStock,
  addStock,
  updateStock,
  deleteStock,
  getCriticalStock,
} from "../services/stockService";

function Stock() {
  const [stock, setStock] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editingStock, setEditingStock] = useState(null);

  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setStock(getStock());
    setCriticalCount(getCriticalStock().length);
  }

  function handleSave(item) {
    if (editingStock) {
      updateStock({
        ...editingStock,
        ...item,
      });
    } else {
      addStock(item);
    }

    loadData();

    setDrawerOpen(false);
    setEditingStock(null);
  }

  function handleEdit(item) {
    setEditingStock(item);
    setDrawerOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm("Ürün silinsin mi?")) return;

    deleteStock(id);

    loadData();
  }

  function handleClose() {
    setDrawerOpen(false);
    setEditingStock(null);
  }

  return (
    <div className="customer-page">

      <div className="customer-header">

        <div>

          <h1>Stok Yönetimi</h1>

          <p>
            Toplam {stock.length} ürün |
            Kritik stok: {criticalCount}
          </p>

        </div>

        <button
          className="add-btn"
          onClick={() => setDrawerOpen(true)}
        >
          + Yeni Ürün
        </button>

      </div>

      <div className="customer-card">

        <StockTable
          stock={stock}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>

      <Drawer
        open={drawerOpen}
        title={
          editingStock
            ? "Stok Düzenle"
            : "Yeni Ürün"
        }
        onClose={handleClose}
      >

        <StockForm
          stock={editingStock}
          isEditing={!!editingStock}
          onSave={handleSave}
        />

      </Drawer>

    </div>
  );
}

export default Stock;