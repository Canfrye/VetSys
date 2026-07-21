import { DataGrid } from "@mui/x-data-grid";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PaymentsIcon from "@mui/icons-material/Payments";

import { formatCurrency } from "../../utils/invoiceCalc";
import {
  getInvoicePaymentStatusColor,
  normalizePaymentStatus,
} from "../../utils/invoiceStatus";
import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function InvoiceTable({
  invoices = [],
  onEdit,
  onDelete,
  onDownloadPdf,
  onPayments,
  canWrite = true,
}) {
  const columns = [
    {
      field: "invoiceNumber",
      headerName: "Fatura No",
      width: 150,
    },
    {
      field: "date",
      headerName: "Tarih",
      width: 110,
    },
    {
      field: "ownerName",
      headerName: "Müşteri",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "animalName",
      headerName: "Hayvan",
      width: 140,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "total",
      headerName: "Genel Toplam",
      width: 140,
      valueGetter: (value) => formatCurrency(value),
    },
    {
      field: "paymentStatus",
      headerName: "Ödeme Durumu",
      width: 140,
      renderCell: (params) => {
        // getInvoicesWithBalances / calculateInvoiceBalance ile gelir.
        const status = normalizePaymentStatus(params.row.paymentStatus);
        return (
          <Chip
            label={status}
            color={getInvoicePaymentStatusColor(status)}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Tahsilat">
            <IconButton
              color="success"
              size="small"
              onClick={() => onPayments?.(params.row)}
            >
              <PaymentsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="PDF İndir">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onDownloadPdf?.(params.row)}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {canWrite && onEdit && (
            <Tooltip title="Düzenle">
              <IconButton
                color="primary"
                size="small"
                onClick={() => onEdit(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {canWrite && onDelete && (
            <Tooltip title="Sil">
              <IconButton
                color="error"
                size="small"
                onClick={() => onDelete(params.row.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: DATA_GRID_HEIGHT, width: "100%" }}>
      <DataGrid
        rows={invoices}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={DATA_GRID_PAGE_SIZE_OPTIONS}
        initialState={{ pagination: DATA_GRID_INITIAL_PAGINATION }}
        disableRowSelectionOnClick
        sx={dataGridSx}
      />
    </Box>
  );
}

export default InvoiceTable;
