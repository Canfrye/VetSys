import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Bekliyor":
        return "warning";

      case "Geldi":
        return "info";

      case "Tamamlandı":
        return "success";

      case "İptal":
        return "error";

      default:
        return "default";
    }
  };

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
    },
    {
      field: "ownerName",
      headerName: "Sahibi",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "reason",
      headerName: "Randevu Nedeni",
      flex: 1,
      minWidth: 220,
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
          color={getStatusColor(params.value)}
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(params.row);
              }}
            >
              <EditIcon />
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
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        density="comfortable"
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        onRowDoubleClick={(params) =>
          navigate(`/hayvanlar/${params.row.animalId}`)
        }
      />
    </Box>
  );
}

export default AppointmentTable;