import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { getAppointmentStatusColor } from "../../utils/appointmentStatus";
import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function AppointmentTable({
  appointments = [],
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const rows = appointments.map((appointment) => ({
    ...appointment,
    id: appointment.id,
  }));

  const columns = [
    {
      field: "date",
      headerName: "Tarih",
      width: 120,
    },
    {
      field: "time",
      headerName: "Saat",
      width: 90,
    },
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
      field: "reason",
      headerName: "Randevu Nedeni",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "veterinarian",
      headerName: "Veteriner",
      width: 170,
    },
    {
      field: "status",
      headerName: "Durum",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getAppointmentStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Düzenle">
            <IconButton
              color="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(params.row.id);
              }}
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
        density="comfortable"
        disableRowSelectionOnClick
        pageSizeOptions={DATA_GRID_PAGE_SIZE_OPTIONS}
        initialState={DATA_GRID_INITIAL_PAGINATION}
        onRowDoubleClick={(params) =>
          navigate(`/hayvanlar/${params.row.animalId}`)
        }
        sx={dataGridSx}
      />
    </Box>
  );
}

export default AppointmentTable;
