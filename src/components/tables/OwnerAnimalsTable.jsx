import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, Typography } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  DATA_GRID_HEIGHT,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_INITIAL_PAGINATION,
  dataGridSx,
} from "../../utils/dataGridDefaults";

function OwnerAnimalsTable({
  animals,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      field: "name",
      headerName: "Hayvan",
      flex: 1,
      renderCell: (params) => (
        <Typography noWrap title={params.value} sx={{ width: "100%" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "species",
      headerName: "Tür",
      width: 120,
    },
    {
      field: "breed",
      headerName: "Irk",
      width: 180,
    },
    {
      field: "gender",
      headerName: "Cinsiyet",
      width: 120,
    },
    {
      field: "weight",
      headerName: "Kilo",
      width: 100,
      valueGetter: (value) =>
        value ? `${value} kg` : "-",
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            color="info"
            onClick={() => onView(params.row.id)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: DATA_GRID_HEIGHT }}>
      <DataGrid
        rows={animals}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={DATA_GRID_PAGE_SIZE_OPTIONS}
        initialState={DATA_GRID_INITIAL_PAGINATION}
        sx={dataGridSx}
      />
    </Box>
  );
}

export default OwnerAnimalsTable;
