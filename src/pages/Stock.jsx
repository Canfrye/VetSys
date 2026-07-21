import { useEffect, useState } from "react";
import { Button, Stack } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import Drawer from "../components/Drawer";
import StockForm from "../components/forms/StockForm";
import StockTable from "../components/tables/StockTable";
import StockMovementsPanel from "../components/stock/StockMovementsPanel";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import {
  getStock,
  addStock,
  updateStock,
  deleteStock,
  getCriticalStock,
  getMovementsByStockId,
  applyStockMovement,
} from "../services/stockService";
import { getSettings } from "../services/settingsService";
import { generateStockReportPdf } from "../utils/stockPdf";
import { exportToCsv } from "../utils/csvExport";
import { normalizeStockItem } from "../utils/stockUtils";

import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../hooks/useAuth";

function Stock() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const { user } = useAuth();

  const [stock, setStock] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [detailStock, setDetailStock] = useState(null);
  const [movements, setMovements] = useState([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [newFormKey, setNewFormKey] = useState(0);

  useEffect(() => {
    // Mount sonrası yükleme — setState microtask'te (lint cascading-render kuralı).
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(detailId = null) {
    const [stockData, criticalStock] = await Promise.all([
      getStock(),
      getCriticalStock(),
    ]);

    setStock(stockData);
    setCriticalCount(criticalStock.length);

    const activeId = detailId ?? detailStock?.id;

    if (activeId) {
      const fresh = stockData.find(
        (item) => String(item.id) === String(activeId)
      );
      if (fresh) {
        setDetailStock(fresh);
        setMovements(await getMovementsByStockId(fresh.id));
      }
    }
  }

  async function handleSave(item) {
    if (editingStock) {
      await updateStock({
        ...editingStock,
        ...item,
      });
      notify("Ürün güncellendi.");
    } else {
      await addStock(item, {
        userName: user?.fullName || user?.username || "",
      });
      notify("Ürün eklendi.");
    }

    await loadData();
    setDrawerOpen(false);
    setEditingStock(null);
  }

  function handleEdit(item) {
    setEditingStock(item);
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    const confirmed = await confirm("Ürün ve hareket geçmişi silinsin mi?");

    if (!confirmed) return;

    await deleteStock(id);
    await loadData();
    notify("Ürün silindi.");

    if (detailStock && String(detailStock.id) === String(id)) {
      setDetailOpen(false);
      setDetailStock(null);
      setMovements([]);
    }
  }

  async function handleOpenDetail(item) {
    setDetailStock(item);
    setMovements(await getMovementsByStockId(item.id));
    setDetailOpen(true);
  }

  async function handleApplyMovement(payload) {
    try {
      await applyStockMovement({
        ...payload,
        userName: user?.fullName || user?.username || "",
      });
      notify("Stok hareketi kaydedildi.");
      await loadData(payload.stockId);
    } catch (error) {
      notify(error?.message || "Hareket kaydedilemedi.", "error");
    }
  }

  async function handleExportPdf() {
    const settings = await getSettings();
    generateStockReportPdf(stock, settings);
  }

  function handleExportCsv() {
    const rows = stock.map((item) => {
      const normalized = normalizeStockItem(item);
      return {
        name: normalized.name,
        lotNo: normalized.lotNo,
        expiryDate: normalized.expiryDate,
        quantity: normalized.quantity,
        minQuantity: normalized.minQuantity,
        unit: normalized.unit,
        category: normalized.category,
        purchasePrice: normalized.purchasePrice,
        salePrice: normalized.salePrice,
        currency: normalized.currency,
        supplierName: normalized.supplierName,
        supplierPhone: normalized.supplierPhone,
        supplierEmail: normalized.supplierEmail,
      };
    });

    exportToCsv("stok_raporu", rows, [
      { key: "name", label: "Ürün" },
      { key: "lotNo", label: "Lot" },
      { key: "expiryDate", label: "SKT" },
      { key: "quantity", label: "Mevcut" },
      { key: "minQuantity", label: "Minimum" },
      { key: "unit", label: "Birim" },
      { key: "category", label: "Kategori" },
      { key: "purchasePrice", label: "Alış Fiyatı" },
      { key: "salePrice", label: "Satış Fiyatı" },
      { key: "currency", label: "Para Birimi" },
      { key: "supplierName", label: "Tedarikçi" },
      { key: "supplierPhone", label: "Telefon" },
      { key: "supplierEmail", label: "E-posta" },
    ]);
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
            Toplam {stock.length} ürün | Kritik stok: {criticalCount}
          </p>
        </div>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPdf}
            disabled={stock.length === 0}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCsv}
            disabled={stock.length === 0}
          >
            CSV
          </Button>
          <button
            className="add-btn"
            onClick={() => {
              setEditingStock(null);
              setNewFormKey((key) => key + 1);
              setDrawerOpen(true);
            }}
          >
            + Yeni Ürün
          </button>
        </Stack>
      </div>

      <div className="customer-card">
        {stock.length === 0 ? (
          <EmptyState message="Henüz kayıtlı ürün yok. + Yeni Ürün ile ekleyebilirsiniz." />
        ) : (
          <StockTable
            stock={stock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editingStock ? "Stok Düzenle" : "Yeni Ürün"}
        onClose={handleClose}
      >
        <StockForm
          key={editingStock?.id || `new-${newFormKey}`}
          stock={editingStock}
          isEditing={!!editingStock}
          onSave={handleSave}
        />
      </Drawer>

      <Drawer
        open={detailOpen}
        title={detailStock ? `${detailStock.name} · Hareketler` : "Hareketler"}
        onClose={() => {
          setDetailOpen(false);
          setDetailStock(null);
          setMovements([]);
        }}
      >
        {detailStock && (
          <StockMovementsPanel
            stock={detailStock}
            movements={movements}
            onApplyMovement={handleApplyMovement}
          />
        )}
      </Drawer>
    </div>
  );
}

export default Stock;
