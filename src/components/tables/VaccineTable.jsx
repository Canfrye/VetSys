import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function VaccineTable({
  vaccines = [],
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const rows = vaccines.map((vaccine) => ({
    ...vaccine,
    id: vaccine.id,
  }));

  const columns = [
    {
      field: "animalName",
      headerName: "Hayvan",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "ownerName",
      headerName: "Sahibi",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "vaccineName",
      headerName: "Aşı",
      width: 170,
    },
    {
      field: "brand",
      headerName: "Marka",
      width: 150,
    },
    {
      field: "dose",
      headerName: "Doz",
      width: 90,
    },
    {
      field: "applicationDate",
      headerName: "Uygulama",
      width: 130,
    },
    {
      field: "nextDoseDate",
      headerName: "Sonraki Doz",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label={params.value}
            color="success"
            size="small"
          />
        ) : (
          "-"
        ),
    },
    {
      field: "veterinarian",
      headerName: "Veteriner",
      width: 170,
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

export default VaccineTable;