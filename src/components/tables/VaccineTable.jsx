import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

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

export default VaccineTable;
