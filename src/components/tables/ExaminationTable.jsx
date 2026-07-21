import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MedicationIcon from "@mui/icons-material/Medication";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function ExaminationTable({
  examinations = [],
  onEdit,
  onDelete,
  onCreatePrescription,
  onCreateInvoice,
}) {
  const navigate = useNavigate();

  const rows = examinations.map((exam) => ({
    ...exam,
    date: exam.examinationDate
      ? new Date(exam.examinationDate).toLocaleDateString("tr-TR")
      : "-",
  }));

  const actionWidth =
    160 +
    (onCreatePrescription ? 40 : 0) +
    (onCreateInvoice ? 40 : 0);

  const columns = [
    {
      field: "animalName",
      headerName: "Hayvan",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "ownerName",
      headerName: "Sahibi",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "examType",
      headerName: "Tür",
      width: 140,
      valueGetter: (value) => value || "-",
    },
    {
      field: "veterinarian",
      headerName: "Veteriner",
      width: 150,
      valueGetter: (value) => value || "-",
    },
    {
      field: "generalCondition",
      headerName: "Genel Durum",
      width: 130,
      valueGetter: (value) => value || "-",
    },
    {
      field: "diagnosis",
      headerName: "Tanı",
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => value || "-",
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "Tarih",
      width: 110,
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: actionWidth,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Detay">
            <IconButton
              size="small"
              color="info"
              onClick={() =>
                navigate(`/hayvanlar/${params.row.animalId}`)
              }
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {onCreateInvoice && (
            <Tooltip title="Fatura Oluştur">
              <IconButton
                size="small"
                color="success"
                onClick={() => onCreateInvoice?.(params.row)}
              >
                <ReceiptLongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onCreatePrescription && (
            <Tooltip title="Reçete Oluştur">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => onCreatePrescription?.(params.row)}
              >
                <MedicationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit?.(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete?.(params.row.id)}
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

export default ExaminationTable;
