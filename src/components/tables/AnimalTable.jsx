import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function AnimalTable({
  animals = [],
  customers = [],
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  const rows = animals.map((animal) => {
    const owner = customers.find(
      (c) => String(c.id) === String(animal.ownerId)
    );

    return {
      id: animal.id,
      name: animal.name,
      owner: owner
        ? `${owner.ad} ${owner.soyad}`
        : "-",
      phone: owner?.telefon || "-",
      species: animal.species || "-",
      breed: animal.breed || "-",
      gender: animal.gender || "-",
      birthDate: animal.birthDate || "-",
      weight: animal.weight || "-",
      microchipNo: animal.microchipNo || "-",
    };
  });

  const columns = [
    {
      field: "name",
      headerName: "Hayvan",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "owner",
      headerName: "Sahibi",
      flex: 1,
      minWidth: 190,
    },
    {
      field: "phone",
      headerName: "Telefon",
      width: 150,
    },
    {
      field: "species",
      headerName: "Tür",
      width: 110,
    },
    {
      field: "breed",
      headerName: "Irk",
      width: 150,
    },
    {
      field: "gender",
      headerName: "Cinsiyet",
      width: 110,
    },
    {
      field: "weight",
      headerName: "Kilo",
      width: 90,
    },
    {
      field: "microchipNo",
      headerName: "Mikroçip",
      width: 170,
    },
    {
      field: "birthDate",
      headerName: "Doğum",
      width: 130,
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
                onEdit?.(params.row.id);
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
        pageSizeOptions={[5, 10, 20, 50]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        disableRowSelectionOnClick
        density="comfortable"
        onRowClick={(params) =>
          navigate(`/hayvanlar/${params.id}`)
        }
      />
    </Box>
  );
}

export default AnimalTable;