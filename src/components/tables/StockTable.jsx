import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function StockTable({
  stock = [],
  onEdit,
  onDelete,
}) {
  const rows = stock.map((item) => ({
    ...item,

    stockStatus:
      item.quantity <= item.minQuantity
        ? "Kritik"
        : "Normal",
  }));

  const columns = [
    {
      field: "name",
      headerName: "Ürün",
      flex: 1,
      minWidth: 220,
    },

    {
      field: "category",
      headerName: "Kategori",
      width: 130,
    },

    {
      field: "quantity",
      headerName: "Stok",
      width: 100,
    },

    {
      field: "minQuantity",
      headerName: "Min.",
      width: 90,
    },

    {
      field: "unit",
      headerName: "Birim",
      width: 90,
    },

    {
      field: "expiryDate",
      headerName: "SKT",
      width: 140,
    },

    {
      field: "supplier",
      headerName: "Tedarikçi",
      width: 180,
    },

    {
      field: "stockStatus",
      headerName: "Durum",
      width: 120,

      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "Kritik"
              ? "error"
              : "success"
          }
          size="small"
        />
      ),
    },

    {
      field: "actions",
      headerName: "İşlemler",
      width: 120,
      sortable: false,
      filterable: false,

      renderCell: (params) => (
        <>
          <Tooltip title="Düzenle">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onEdit(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              color="error"
              size="small"
              onClick={() => onDelete(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: 620, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20, 50]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
      />
    </Box>
  );
}

export default StockTable;