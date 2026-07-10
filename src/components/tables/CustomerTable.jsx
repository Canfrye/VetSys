import { DataGrid } from "@mui/x-data-grid";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

function CustomerTable({
  customers = [],
  onDelete,
  onEdit,
}) {
  const navigate = useNavigate();

  const rows = customers.map((customer) => ({
    id: customer.id,

    ad: customer.ad,
    soyad: customer.soyad,

    adSoyad: `${customer.ad} ${customer.soyad}`,

    telefon: customer.telefon || "-",
    email: customer.email || "-",

    createdAt: customer.createdAt
      ? new Date(customer.createdAt).toLocaleDateString("tr-TR")
      : "-",

    raw: customer,
  }));

  const columns = [
    {
      field: "adSoyad",
      headerName: "Müşteri",
      flex: 1.2,
      minWidth: 260,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <Avatar>
            {params.row.ad?.charAt(0).toUpperCase()}
          </Avatar>

          <Box>
            <Typography fontWeight={600}>
              {params.row.adSoyad}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              ID : {params.row.id}
            </Typography>
          </Box>
        </Stack>
      ),
    },

    {
      field: "telefon",
      headerName: "Telefon",
      width: 190,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <PhoneIcon
            fontSize="small"
            color="success"
          />

          <Typography>
            {params.value}
          </Typography>
        </Stack>
      ),
    },

    {
      field: "email",
      headerName: "E-Posta",
      flex: 1,
      minWidth: 260,

      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <EmailIcon
            fontSize="small"
            color="primary"
          />

          <Typography
            noWrap
            sx={{ width: "100%" }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },

    {
      field: "createdAt",
      headerName: "Kayıt",

      width: 150,

      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
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
          <Tooltip title="Detayı Gör">
            <IconButton
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/musteriler/${params.row.id}`);
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Düzenle">
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(params.row.raw);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(params.row.id);
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
    <Box
      sx={{
        width: "100%",
        height: 560,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          sorting: {
            sortModel: [
              {
                field: "createdAt",
                sort: "desc",
              },
            ],
          },
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        onRowClick={(params) =>
          navigate(`/musteriler/${params.id}`)
        }
        sx={{
          border: 0,

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8fafc",
            fontWeight: "bold",
          },

          "& .MuiDataGrid-row:nth-of-type(even)": {
            backgroundColor: "#fafafa",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#eef6ff",
          },
        }}
      />
    </Box>
  );
}

export default CustomerTable;