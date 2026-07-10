import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

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
            color="primary"
            onClick={() => onView(params.row.id)}
          >
            <VisibilityIcon />
          </IconButton>

          <IconButton
            color="warning"
            onClick={() => onEdit(params.row)}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => onDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ height: 500 }}>
      <DataGrid
        rows={animals}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
      />
    </Box>
  );
}

export default OwnerAnimalsTable;