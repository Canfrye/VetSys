import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";

import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";
import {
  enrichCriticalStockItem,
  getExpiryBadge,
  isCriticalStock,
} from "../../utils/stockUtils";
import { formatCurrency } from "../../utils/invoiceCalc";

function StockTable({ stock = [], onEdit, onDelete, onOpenDetail }) {
  const rows = stock.map((item) => {
    const enriched = enrichCriticalStockItem(item);
    const expiry = getExpiryBadge(item.expiryDate);

    return {
      ...enriched,
      stockStatus: isCriticalStock(item) ? "Kritik" : "Normal",
      expiryLabel: expiry.label,
      expiryColor: expiry.color,
    };
  });

  const columns = [
    {
      field: "name",
      headerName: "Ürün",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "lotNo",
      headerName: "Lot",
      width: 110,
      valueGetter: (_value, row) => row.lotNo || "-",
    },
    {
      field: "category",
      headerName: "Kategori",
      width: 100,
    },
    {
      field: "quantity",
      headerName: "Stok",
      width: 70,
    },
    {
      field: "minQuantity",
      headerName: "Min.",
      width: 70,
    },
    {
      field: "unit",
      headerName: "Birim",
      width: 70,
    },
    {
      field: "purchasePrice",
      headerName: "Alış",
      width: 110,
      valueGetter: (_value, row) =>
        formatCurrency(row.purchasePrice || 0),
    },
    {
      field: "salePrice",
      headerName: "Satış",
      width: 110,
      valueGetter: (_value, row) => formatCurrency(row.salePrice || 0),
    },
    {
      field: "expiryDate",
      headerName: "SKT",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={
            params.row.expiryDate
              ? `${params.row.expiryDate} · ${params.row.expiryLabel}`
              : "SKT yok"
          }
          color={params.row.expiryDate ? params.row.expiryColor : "default"}
          size="small"
        />
      ),
    },
    {
      field: "supplierName",
      headerName: "Tedarikçi",
      width: 140,
      valueGetter: (_value, row) => row.supplierName || row.supplier || "-",
    },
    {
      field: "stockStatus",
      headerName: "Durum",
      width: 130,
      renderCell: (params) =>
        params.value === "Kritik" ? (
          <Chip
            label={`Kritik %${params.row.criticalityPercent}`}
            color={params.row.criticalityColor}
            size="small"
            sx={
              params.row.criticalityPercent > 50 &&
              params.row.criticalityPercent <= 100
                ? { bgcolor: "#EAB308", color: "#111" }
                : undefined
            }
          />
        ) : (
          <Chip label="Normal" color="success" size="small" />
        ),
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Hareketler">
            <IconButton
              color="secondary"
              size="small"
              onClick={() => onOpenDetail?.(params.row)}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Düzenle">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onEdit(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              color="error"
              size="small"
              onClick={() => onDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: DATA_GRID_HEIGHT, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={DATA_GRID_PAGE_SIZE_OPTIONS}
        initialState={DATA_GRID_INITIAL_PAGINATION}
        sx={dataGridSx}
      />
    </Box>
  );
}

export default StockTable;
