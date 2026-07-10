import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function ExaminationTable({
  examinations = [],
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const rows = examinations.map((exam) => ({
    ...exam,
    date: exam.examinationDate
      ? new Date(exam.examinationDate).toLocaleDateString("tr-TR")
      : "-",
  }));

  const columns = [
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
      field: "veterinarian",
      headerName: "Veteriner",
      width: 170,
      valueGetter: (value) => value || "-",
    },
    {
      field: "generalCondition",
      headerName: "Genel Durum",
      width: 140,
      valueGetter: (value) => value || "-",
    },
    {
      field: "diagnosis",
      headerName: "Tanı",
      flex: 1,
      minWidth: 180,
      valueGetter: (value) => value || "-",
    },
    {
      field: "date",
      headerName: "Tarih",
      width: 120,
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Detay">
            <IconButton
              color="primary"
              onClick={() =>
                navigate(`/hayvanlar/${params.row.animalId}`)
              }
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Düzenle">
            <IconButton
              color="warning"
              onClick={() => onEdit?.(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              color="error"
              onClick={() => onDelete?.(params.row.id)}
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
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 20]}
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

export default ExaminationTable;