import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { summarizeMedications } from "../../utils/prescriptionUtils";
import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function PrescriptionTable({
  prescriptions = [],
  onEdit,
  onDelete,
  onDownloadPdf,
  onView,
  canWrite = true,
  canDelete = true,
}) {
  const columns = [
    {
      field: "prescriptionNumber",
      headerName: "Reçete No",
      width: 150,
    },
    {
      field: "date",
      headerName: "Tarih",
      width: 110,
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
      field: "ownerName",
      headerName: "Sahip",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "veterinarian",
      headerName: "Veteriner",
      width: 140,
    },
    {
      field: "diagnosis",
      headerName: "Tanı",
      width: 150,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "items",
      headerName: "İlaçlar",
      flex: 1,
      minWidth: 160,
      valueGetter: (_value, row) => summarizeMedications(row.items),
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="PDF İndir">
            <IconButton
              color="primary"
              size="small"
              onClick={() => onDownloadPdf?.(params.row)}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {canWrite ? (
            <Tooltip title="Düzenle">
              <IconButton
                color="primary"
                size="small"
                onClick={() => onEdit?.(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Görüntüle">
              <IconButton
                color="primary"
                size="small"
                onClick={() => onView?.(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="Sil">
              <IconButton
                color="error"
                size="small"
                onClick={() => onDelete?.(params.row.id)}
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
        rows={prescriptions}
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

export default PrescriptionTable;
